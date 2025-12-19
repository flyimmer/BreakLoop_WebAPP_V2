# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from react-scripts (one-way operation)
npm run eject
```

## Project Overview

**BreakLoop** is a React-based digital wellbeing application that helps users break mindless scrolling habits through mindful interventions, alternative activity suggestions, and community accountability features.

## High-Level Architecture

### Single-File Application Pattern
The core application logic resides in `src/App.js` (~6400 lines). This is a deliberate design choice for a prototype/market test. The file orchestrates:
- Multiple screen contexts (launcher, BreakLoop config, dummy apps)
- Intervention flow state machine (breathing → root-cause → alternatives → action → reflection)
- Community/social features with a mock backend layer
- Settings, friends management, and activity planning

**Note:** While the app maintains a single-file core, common utilities and constants have been extracted to shared modules for better maintainability.

### Code Organization

**Directory Structure:**
```
src/
├── App.js                      # Main application (6400+ lines)
├── components/                 # Modular UI components
│   ├── ActivityCard.js
│   ├── ActivityDetailsModal.js
│   ├── ActivitySuggestionCard.jsx
│   ├── AltSchedulerModal.js
│   └── PlanActivityModal.jsx
├── constants/                  # Shared configuration and constants
│   ├── config.js              # App configuration (version, defaults, quick task settings)
│   └── hostLabels.js          # Activity host type labels (card/modal variants)
├── utils/                      # Reusable utility functions
│   ├── activityMatching.js    # Activity ID matching logic
│   ├── gemini.js              # Gemini API integration
│   ├── icons.js               # Icon mapping for apps
│   └── time.js                # Time/date formatting and parsing utilities
├── hooks/
│   └── useStickyState.js      # localStorage persistence hook
├── mockApi.js                  # Mock backend for community features
└── mockActivities.js           # Seed data for activities
```

**Shared Utilities:**
- **Activity Matching** (`utils/activityMatching.js`):
  - `findUpcomingActivity()` - Complex ID matching with 6 different strategies
  - Used by both `ActivityCard` and `ActivityDetailsModal` for consistent status checking
- **Host Labels** (`constants/hostLabels.js`):
  - `HOST_LABELS_CARD` - Compact labels for activity cards ("Friend", "Public", "My plan")
  - `HOST_LABELS_MODAL` - Descriptive labels for modals ("Friend activity", "Public event")
  - Icons returned as functions to avoid React context issues
- **Configuration** (`constants/config.js`):
  - App version, user location
  - Quick Task settings (duration options, limits, window duration)
  - Default settings for monitored apps, user account, intervention behavior


### State Management Strategy

**Persistence Layer:**
- `useStickyState` hook (`src/hooks/useStickyState.js`) wraps localStorage with React state
- Supports a `disablePersistence` option for demo mode
- All user data persists across sessions unless demo mode is enabled

**Mock Backend:**
- `src/mockApi.js` simulates server-side state for community features
- Provides functions like `createJoinRequestState`, `acceptJoinRequestState`, `declineJoinRequestState`
- Uses localStorage key `community_mock_state_v2` for persistence
- Ready to swap with real API calls when backend is available

### Component Architecture

**Modular Components:**
- `ActivityCard` - Displays activity cards in horizontal scrollable lists
  - Receives `upcomingActivities` prop to determine user's join status
  - Shows status badge (PENDING/CONFIRMED) only when activity is in user's `upcomingActivities`
  - Badge logic matches `ActivityDetailsModal` for consistency across all views
  - Uses `findUpcomingActivity()` from `utils/activityMatching.js` for status checking
  - Uses `HOST_LABELS_CARD` from `constants/hostLabels.js` for host type display
- `ActivityDetailsModal` - Full-screen modal for viewing/managing activities
  - Host actions: Edit activity, Cancel event
  - Participant actions: Join event, Cancel request, Quit event
  - Checks `upcomingActivities` to determine if user has joined
  - Request management for hosts (accept/decline join requests)
  - Uses shared `findUpcomingActivity()` and `HOST_LABELS_MODAL` utilities
- `PlanActivityModal` - AI-powered or manual activity planning interface
  - Supports both create and edit modes
  - Edit mode pre-populates form with existing activity data
  - Uses `parseFormattedDate()`, `parseTimeString()`, `parseTimeRange()` from `utils/time.js` for date/time parsing
- `AltSchedulerModal` - Schedule alternatives for later (Plan for Later flow)
- `ActivitySuggestionCard` - Presents AI suggestions with Accept/Edit/Save actions

**Component Communication:**
- Parent-child prop drilling (no global state library)
- Callback props for user actions
- Shared state managed in App.js and passed down
- Shared utilities imported from `constants/` and `utils/` directories

### Key Features & Flows

**1. Intervention System**
When a monitored app is launched:
- Quick Task dialog (emergency bypass with time limit)
- Breathing countdown (configurable duration)
- Root cause selection (boredom, anxiety, fatigue, etc.)
- Alternative discovery (My List, Discover, AI For You tabs)
- Action timer with activity steps
- Reflection & streak tracking

**2. Activity Planning**
Three modes accessible via Community tab:
- **Private + AI**: User provides time/topic/location/participants → Gemini generates 3 specific suggestions → Accept/Edit/Save
- **Private + Manual**: Traditional form input for solo activities
- **Public Hosted**: Create events that publish to friends or public discover feed

**3. Community Features**
- **My Upcoming**: Confirmed solo activities and joined group activities
- **Discover**: Friends' current live activities + public events
- **Ask-to-Join Flow**: Users request → Host accepts/declines → Activity updates to confirmed
- **Live Join**: When starting an activity, host can allow live join for a 5-minute window
- **Activity Management**:
  - **Host Actions** (in Activity Details):
    - Shows "Edit activity" and "Cancel event" buttons
    - Edit activity: Opens PlanActivityModal in edit mode with pre-filled data
    - Cancel event: Removes activity from all lists (upcoming, shared, public)
  - **Participant Actions** (in Activity Details):
    - **"Join the event"**: Shown when activity is NOT in user's `upcomingActivities` list
    - **"Cancel request"**: Shown when activity is in `upcomingActivities` with "pending" status
    - **"Quit event"**: Shown when activity is in `upcomingActivities` with "confirmed" status
  - **Activity Status Logic**:
    - `hosting`: User is the host → Show host actions (Edit/Cancel), never show "Join the event"
    - `pending`: User has requested to join, waiting for approval → Show "Cancel request"
    - `confirmed`: Activity is confirmed (either approved by host or no approval needed) → Show "Quit event"
    - Other statuses: User hasn't joined → Show "Join the event"
  - **Status Badge Consistency**:
    - Both `ActivityCard` and `ActivityDetailsModal` check `upcomingActivities` to determine if user has joined
    - Status badge (PENDING/CONFIRMED) only shows when `userHasJoined = true` (activity found in `upcomingActivities`)
    - Same activity shows same badge status across "My Upcoming" and "Discover" sections
    - When user quits an event, activity is removed from `upcomingActivities`, so badge disappears everywhere

**4. Friends & Privacy**
- Friends list with success rate leaderboard
- Optional sharing: alternatives list, current activity, recent mood
- Privacy toggles in Settings → Social Privacy
- Notes per friend (stored locally)

## AI Integration

**Gemini API** (optional):
- Set `REACT_APP_GEMINI_KEY` environment variable
- Used for:
  - Activity planning suggestions (`PlanActivityModal`)
  - Alternative idea generation (AI For You tab)
  - Deep insights analysis (Insights screen)
- Implementation in `src/utils/gemini.js`
- Gracefully degrades if API key is missing

**Plan an Activity (Private + AI Suggestion):**
- Function: `generateActivitySuggestions()` in `PlanActivityModal.jsx`
- Triggered when user clicks "Generate suggestions" in Community → Plan an activity → Private + AI suggestion mode
- Generates 3 **specific and concrete** activity suggestions using Gemini API
- **AI Behavior:** Provides specific recommendations (e.g., actual movie titles, real venue names, concrete plans) rather than generic suggestions
- **Inputs** (all optional, from user form):
  1. `topic` - User's interest/topic (e.g., "watch a movie in a theater", "stretching", "social")
  2. `location` - Preferred location (e.g., "Park, cafe, online", "Munich downtown")
  3. `timePreference` - Time of day preference: "Morning", "Afternoon", or "Evening"
  4. `date` - ISO date string (defaults to `defaultDate` prop, typically today)
  5. `participantsDescription` - Number of participants and preferences (e.g., "2-4 people, prefer quiet activities", "Recommend a romantic movie for me with my girlfriend")
- **Input Priority Order** (as specified in AI prompt):
  1. **Topic/Interest** (PRIMARY) - Match the topic/interest if provided
  2. **Location** - Can be done at or near the specified location
  3. **Time of Day** - Appropriate for the time preference
  4. **Participants Description** - Consider number of people and their preferences
  5. **Date** - Mentioned but lower priority
- **Default Values** (when inputs are empty):
  - **In AI Prompt:**
    - `topic`: `"general wellness"`
    - `location`: `"flexible location"`
    - `timePreference`: `"any time"`
    - `date`: `"today"`
    - `participantsDescription`: `"no specific participant preferences"`
  - **In Response Processing** (when AI response is missing fields):
    - `title`: `"Suggested Activity"`
    - `description`: `"No description provided"`
    - `time`: From `getDefaultTime()` function (see below)
    - `location`: `"Your preferred location"`
    - `topic`: `"General wellness"`
    - `duration`: `"30-60m"`
  - **Default Time Values** (based on time preference):
    - Morning: `["08:00", "09:30", "07:00"]` (for 3 suggestions)
    - Afternoon: `["14:00", "15:30", "16:00"]`
    - Evening: `["18:30", "19:00", "20:00"]`
    - No preference: `["09:00", "14:00", "18:30"]`
    - Fallback: `"09:00"`
- **Output Format:**
  - JSON array of 3 activity objects
  - Each object contains: 
    - `title` - Specific activity name (e.g., "Watch 'Past Lives' at Cinema München")
    - `description` - Detailed description with concrete recommendations, venue names, movie titles, etc.
    - `duration` - Estimated time like "30-45m" or "120-150m"
    - `time` - Suggested start time in HH:MM format (24-hour)
- **AI Output Requirements:**
  - Must be specific and concrete (not generic wellness suggestions)
  - Should recommend actual movie titles, restaurant names, venue details when relevant
  - Should include location details in descriptions
  - Example: If user asks for "romantic movie with girlfriend", AI suggests specific movie titles at specific theaters
- **Error Handling:**
  - Falls back to `getFallbackSuggestions()` if API fails or returns invalid response
  - Fallback provides 3 generic suggestions using form inputs
  - Shows error message in UI if generation fails

**AI For You Tab (Intervention Flow):**
- Function: `handleGenerateContextualAlternatives()` in `App.js`
- Triggered automatically when user opens "AI For You" tab after selecting root causes
- Generates 3 contextual alternative activity suggestions using Gemini API
- **Input Priority Order** (from most to least important):
  1. **Root causes/emotions** (PRIMARY) - Selected emotional states (boredom, anxiety, fatigue, loneliness, self-doubt, no goal)
  2. **Location** - User's current location (`USER_LOCATION` constant, default: "Munich")
  3. **Social context** - Nearby friends within 50km (same location as proxy)
     - Includes friend names, locations, and current/recent activities
     - Suggests activities that could involve joining friends if appropriate
  4. **User's values/goals** - Core values from `selectedValues` state
     - Maps to labels: Career, Health, Love, Kids, Reading, Nature, Social
     - AI prioritizes activities aligned with these values
  5. **User's saved alternatives/preferences** - Historical activity data
     - Saved alternatives from `savedAlternativeIds`
     - Custom alternatives from `customAlternatives`
     - Recent activities from `sessionHistory` (last 10 sessions)
     - Shows top 5 preferences to guide similar suggestions
  6. **Time of day** - Current time (`currentTime` state)
     - Determines morning/afternoon/evening/night context
     - Influences time-appropriate activity suggestions
  7. **Weather** - Current weather condition (`weather` state: "sunny" or "rainy")
  8. **Target app** - App that triggered the intervention (e.g., "Instagram", "TikTok")
- **Prompt Structure:**
  - Primary context section with emotional state and location
  - Conditional sections for social context, values, and preferences (only if available)
  - Time, weather, and trigger app information
  - Instructions to prioritize emotional state first, then contextual factors
- **Output Format:**
  - JSON array of 3 activity objects
  - Each object contains: `title`, `desc`, `duration`, `actions` (array of 3 steps), `type`
  - Types: social/calm/creative/active/productive/rest
- **Error Handling:**
  - Gracefully handles missing data (e.g., no friends, no values set, empty history)
  - Falls back to basic suggestions if API fails
  - Shows toast notifications for errors

## Important Implementation Details

### State Persistence Keys
When debugging or resetting state, be aware of these localStorage keys:
- `mindful_*_v17_2` - Main app state (values, monitored apps, plan, etc.)
- `mindful_*_v17_6` - Settings and friends (includes new privacy fields)
- `community_mock_state_v2` - Community activities and requests

### Quick Task System
- Allows brief monitored app usage without full intervention
- 15-minute rolling window with configurable uses per window
- Premium feature: customize duration (10s for testing, 2/3/5 min for prod) and uses (1-2)
- Free plan: locked to 3min duration, 1 use per window

### Modal Rendering Pattern
Modals are rendered at the root level to ensure proper z-index stacking:
- `renderGlobalModals()` function in launcher context
- `AltSchedulerModal` accessible from both intervention flow and community tab
- State props: `showAltScheduler`, `altPlanDraft`

### Time Utilities
`src/utils/time.js` provides comprehensive time and date utilities:

**Time Conversion:**
- `timeToMins(time)` - Convert "HH:MM" to minutes
- `minsToTime(mins)` - Convert minutes to "HH:MM"
- `addMinutes(time, mins)` - Add minutes to a time string
- `formatSeconds(totalSeconds)` - Format countdown timers
- `formatQuickTaskDuration(minutes, options)` - Format duration with optional long format

**Date/Time Parsing** (used by PlanActivityModal for edit mode):
- `parseFormattedDate(dateStr, defaultDate)` - Parses formatted dates (e.g., "Mon, Nov 18") to ISO format (YYYY-MM-DD)
  - Handles year inference for dates that may be in the next year
  - Returns ISO format if already provided
- `parseTimeString(timeStr)` - Parses time strings to HH:MM 24-hour format
  - Supports: "9:30 AM", "09:30 AM", "9:30", "19:30"
  - Converts 12-hour format with AM/PM to 24-hour format
- `parseTimeRange(timeStr)` - Extracts start and end times from range strings
  - Handles: "9:30 AM - 11:00 AM", "9:30 - 11:00", single times
  - Returns: `{ start: "09:30", end: "11:00" }` or `{ start: "09:30", end: "" }`

**Date/Time Formatting in BreakLoopConfig:**
- `formatDateLabel(dateVal)` - Formats ISO date to "Weekday, Month Day" (e.g., "Sat, Dec 13")
- `buildTimeLabel(start, end)` - Formats time range as "HH:MM - HH:MM" or single time "HH:MM"
- Both functions are defined within BreakLoopConfig component scope

## Development Workflow Notes

**From DEVELOPMENT_NOTE_PLAN_ACTIVITY.md:**
- AI stub `generateActivitySuggestions()` returns 3 mock ideas; replace with backend call when ready
- Activities persist via `communityData` → `persistCommunityState` (localStorage)
- Group creation publishes to `publicEvents` when visibility is public
- Modal state resets on close (handleClose) to prevent stuck states
- "Back to form" button clears AI suggestions and returns to input form
- Accepting/saving/creating activities triggers modal reset for clean reopening

**QA Checklist:**
- Solo manual save adds item to My Upcoming with confirmed status
- Solo AI Accept/Save adds confirmed item to My Upcoming
- Solo AI Edit populates manual form and clears suggestions
- Group Create & Publish adds to My Upcoming and Discover (based on visibility)
- Pending join requests render in host modal and can be accepted
- localStorage updates on activity changes (refresh retains new activities)
- **Activity Management:**
  - Host can edit activity (title, description, date, start/end time, location, visibility)
  - Host can cancel event (removes from all lists, shows toast confirmation)
  - Non-host participants can quit event (removes from their upcoming list only)
  - Edit mode pre-populates all fields correctly, including time range parsing
  - Form validation prevents saving incomplete activities
- **Activity Details Modal Button Logic:**
  - `isHost = true`: Shows "Edit activity" and "Cancel event" buttons only
  - `isHost = false` + activity in `upcomingActivities`: Shows "Quit event" (if confirmed) or "Cancel request" (if pending)
  - `isHost = false` + activity NOT in `upcomingActivities`: Shows "Join the event"
  - Status badges ("CONFIRMED", "PENDING") only shown when `userHasJoined = true` (activity found in `upcomingActivities`)
  - Host users see "Host" badge instead of status badges
- **Status Badge Consistency:**
  - `ActivityCard` and `ActivityDetailsModal` both check `upcomingActivities` to determine join status
  - Same activity shows same badge in "My Upcoming" and "Discover" sections
  - Badge disappears when user quits event (activity removed from `upcomingActivities`)
  - All `ActivityCard` instances receive `upcomingActivities={state.upcomingActivities || []}` prop

## Code Style & Patterns

**Lucide React Icons:**
- All icons imported from `lucide-react`
- Consistent sizing: `<Icon size={16} />` for buttons, `<Icon size={12} />` for labels
- **Important:** Icons in exported constants must be wrapped in functions (e.g., `icon: () => <Users size={12} />`) to avoid React context issues

**Tailwind Utility Classes:**
- Extensive use of Tailwind CSS for styling
- Responsive breakpoints for mobile-first design
- Custom animations: `animate-in`, `slide-in-from-bottom`, `zoom-in-95`

**React Patterns:**
- Functional components with hooks
- useMemo for expensive computations and JSX elements
- useCallback for stable function references
- useRef for DOM references and mutable values

**Code Quality:**
- No debug logging or external fetch calls in production code
- Shared utilities extracted to avoid duplication
- Constants centralized in `constants/` directory
- All components use shared utilities for consistent behavior

## Testing Considerations

- Mock data in `src/mockActivities.js` provides seed data
- Demo mode (`demoMode` state) disables persistence for testing
- Quick Task testing timer: 10 seconds (auto-enabled in demo mode)
- `mockApi.test.js` exists but implementation is minimal

## External Dependencies

Key production dependencies:
- `react: ^19.0.0`
- `react-dom: ^19.0.0`
- `lucide-react: 0.555.0` (icon library)

Development:
- `react-scripts: ^5.0.0` (Create React App tooling)
- `typescript: 5.7.2` (not actively used, but available)

## Environment Variables

```bash
# Optional: Enable AI features
REACT_APP_GEMINI_KEY=your_api_key_here
```

## Recent Refactoring (December 2025)

The codebase underwent incremental refactoring to improve maintainability while preserving all existing functionality:

**Phase 1 - Cleanup & Security:**
- Removed all debug logging (external fetch calls to hardcoded debug endpoints)
- Eliminated 8+ debug fetch calls from `mockApi.js`, `App.js`, and `ActivityDetailsModal.js`
- Cleaned up console.log debug statements

**Phase 2 - Extract Shared Utilities:**
- Created `constants/hostLabels.js` - Extracted duplicate HOST_LABELS from ActivityCard and ActivityDetailsModal
- Created `utils/activityMatching.js` - Extracted `findUpcomingActivity()` logic (20+ lines of duplicate code)
- Enhanced `utils/time.js` - Added date/time parsing functions from PlanActivityModal
  - `parseFormattedDate()`, `parseTimeString()`, `parseTimeRange()`
  - 107 lines of parsing logic now reusable and testable
- Created `constants/config.js` - Centralized app configuration constants
  - Version, location, Quick Task settings, default values

**Impact:**
- **-218 lines** of duplicate/debug code removed
- **+96 lines** added in reusable utilities
- **Net improvement:** -122 lines + better organization
- Build verified: No breaking changes, all functionality preserved
- Components now share utilities for consistent behavior

**Files Created:**
- `src/constants/hostLabels.js` (19 lines)
- `src/constants/config.js` (48 lines)
- `src/utils/activityMatching.js` (29 lines)

**Files Significantly Modified:**
- `src/App.js` (6,442 → 6,385 lines, -57 lines)
- `src/components/PlanActivityModal.jsx` (904 → 797 lines, -107 lines)
- `src/utils/time.js` (30 → 158 lines, +128 lines for new parsing functions)


## Git Workflow

Current branch: `Community_Optimization`
Main branch: `main`

Recent commit themes:
- Code refactoring for maintainability (December 2025)
  - Removed debug logging and external fetch calls
  - Extracted shared utilities and constants
  - Created `constants/` and enhanced `utils/` directories
- Bug fixes and syntax error corrections
- Community feature development (plan activity, ask-to-join flow)
- Privacy settings expansion
- Activity management features (edit, cancel, quit event)
- PlanActivityModal edit mode support with start/end time fields
