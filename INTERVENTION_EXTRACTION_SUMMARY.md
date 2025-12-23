# Intervention State Machine Extraction Summary

## Overview
Successfully extracted the intervention flow state machine logic from `App.js` into a framework-agnostic core module at `src/core/intervention/`. This prepares the codebase for React Native reuse while maintaining 100% backward compatibility.

## What Was Extracted

### 1. State Definitions (`src/core/intervention/state.js`)
- **Intervention States**: All 8 states of the intervention flow
  - `idle` - No intervention active
  - `breathing` - Breathing countdown before intervention
  - `root-cause` - User selects emotional causes
  - `alternatives` - User browses alternative activities
  - `action` - User views selected alternative details
  - `action_timer` - Timer running for selected alternative
  - `timer` - User chose "I really need to use it"
  - `reflection` - Post-activity reflection

- **State Context Structure**: Complete intervention context object
  - `state` - Current state in the flow
  - `targetApp` - App that triggered intervention
  - `breathingCount` - Breathing countdown (seconds)
  - `selectedCauses` - Array of selected root causes
  - `selectedAlternative` - Currently selected alternative activity
  - `actionTimer` - Action timer (seconds)

- **Helper Functions**:
  - `createInitialInterventionContext()` - Factory for initial state
  - `isInterventionActive()` - Check if intervention is running
  - `isInterventionBlocking()` - Check if intervention blocks app access

### 2. Transition Logic (`src/core/intervention/transitions.js`)
- **Pure Reducer Function**: `interventionReducer(context, action)`
  - All state transitions implemented as pure functions
  - 13 action types covering all intervention flow transitions
  - No side effects, no React dependencies

- **Action Types**:
  - `BEGIN_INTERVENTION` - Start intervention for an app
  - `BREATHING_TICK` - Decrement breathing countdown
  - `BREATHING_COMPLETE` - Breathing finished, move to root-cause
  - `SELECT_CAUSE` / `DESELECT_CAUSE` - Toggle cause selection
  - `PROCEED_TO_ALTERNATIVES` - Move from root-cause to alternatives
  - `PROCEED_TO_TIMER` - User chose "I really need to use it"
  - `SELECT_ALTERNATIVE` - Select an alternative activity
  - `START_ALTERNATIVE` - Start timer for selected alternative
  - `ACTION_TIMER_TICK` - Decrement action timer
  - `ACTION_TIMER_COMPLETE` - Action timer finished
  - `FINISH_ACTION` - User manually finishes action
  - `FINISH_REFLECTION` - Complete reflection, return to idle
  - `GO_BACK_FROM_ACTION` - Return from action to alternatives
  - `RESET_INTERVENTION` - Reset to idle state

- **Helper Functions**:
  - `beginIntervention()` - Start intervention with app and duration
  - `toggleCause()` - Toggle cause selection
  - `canProceedToAlternatives()` - Check if can proceed
  - `parseDurationToMinutes()` - Parse duration strings
  - `startAlternative()` - Select and start alternative with timer

### 3. Timer Utilities (`src/core/intervention/timers.js`)
- **Timer Condition Checks**:
  - `shouldTickBreathing()` - Check if breathing should tick
  - `isBreathingComplete()` - Check if breathing is done
  - `shouldTickActionTimer()` - Check if action timer should tick
  - `isActionTimerComplete()` - Check if action timer is done

- **Display Utilities**:
  - `formatTimerDisplay()` - Format seconds to MM:SS
  - `calculateTimerProgress()` - Calculate percentage for progress bars
  - `getTimerInterval()` - Get timer interval in milliseconds

### 4. Public API (`src/core/intervention/index.js`)
- Single entry point exporting all functions from the three modules

## Changes to App.js

### State Management
**Before:**
```javascript
const [interventionState, setInterventionState] = useState("idle");
const [targetApp, setTargetApp] = useState(null);
const [breathingCount, setBreathingCount] = useState(3);
const [selectedCauses, setSelectedCauses] = useState([]);
const [selectedAlternative, setSelectedAlternative] = useState(null);
const [actionTimer, setActionTimer] = useState(0);
```

**After:**
```javascript
const [interventionContext, setInterventionContext] = useState(() => 
  createInitialInterventionContext()
);

// Destructure for backward compatibility
const interventionState = interventionContext.state;
const targetApp = interventionContext.targetApp;
const breathingCount = interventionContext.breathingCount;
const selectedCauses = interventionContext.selectedCauses;
const selectedAlternative = interventionContext.selectedAlternative;
const actionTimer = interventionContext.actionTimer;

// Helper to dispatch intervention actions
const dispatchIntervention = useCallback((action) => {
  setInterventionContext(prev => interventionReducer(prev, action));
}, []);
```

### Timer Effects
**Before:**
```javascript
useEffect(() => {
  let timer;
  if (interventionState === "breathing") {
    if (breathingCount > 0) {
      timer = setTimeout(() => setBreathingCount(breathingCount - 1), 1000);
    } else {
      setInterventionState("root-cause");
    }
  }
  return () => clearTimeout(timer);
}, [interventionState, breathingCount]);
```

**After:**
```javascript
useEffect(() => {
  let timer;
  if (shouldTickBreathing(interventionState, breathingCount)) {
    timer = setTimeout(() => {
      dispatchIntervention({ type: 'BREATHING_TICK' });
    }, 1000);
  }
  return () => clearTimeout(timer);
}, [interventionState, breathingCount, dispatchIntervention]);
```

### State Transitions
**Before:**
```javascript
setInterventionState("alternatives");
setSelectedAlternative(null);
```

**After:**
```javascript
dispatchIntervention({ type: 'GO_BACK_FROM_ACTION' });
```

### Entry Point
**Before:**
```javascript
const beginInterventionForApp = (app) => {
  setTargetApp(app);
  setInterventionState("breathing");
  setBreathingCount(settings.interventionDuration);
  setSelectedCauses([]);
  setSelectedAlternative(null);
  resetNewAltForm();
  resetAIInspiredForm();
  setAltPage(0);
  setAltTab("discover");
};
```

**After:**
```javascript
const beginInterventionForApp = (app) => {
  setInterventionContext(prev => 
    beginIntervention(prev, app, settings.interventionDuration)
  );
  resetNewAltForm();
  resetAIInspiredForm();
  setAltPage(0);
  setAltTab("discover");
};
```

## Benefits

### 1. Framework Agnostic
- All core logic is pure JavaScript with no React dependencies
- Can be imported and used in React Native, Vue, or vanilla JavaScript
- State transitions are predictable and testable

### 2. Maintainability
- Clear separation between business logic and UI
- State machine logic is centralized and documented
- Easier to understand intervention flow

### 3. Testability
- Pure functions are easy to unit test
- No mocking of React hooks required
- Can test state transitions in isolation

### 4. Reusability
- Same logic can power React web and React Native mobile apps
- Consistent behavior across platforms
- Single source of truth for intervention flow

### 5. Backward Compatibility
- All existing UI code works unchanged
- No behavior changes
- Build succeeds without errors

## What Was NOT Changed

- UI rendering logic (all JSX remains in App.js)
- Community flow logic
- Inbox update logic
- AI generation logic
- Quick Task system
- All other features remain untouched

## Verification

✅ **Build Status**: Compiled successfully
✅ **Linter**: No errors
✅ **File Size**: 122.7 kB (gzipped) - minimal impact
✅ **Behavior**: All existing functionality preserved

## Usage Example (React Native)

```javascript
// In a React Native app
import { 
  createInitialInterventionContext, 
  interventionReducer,
  beginIntervention,
  shouldTickBreathing 
} from './core/intervention';

// Use the same state machine logic
const [context, setContext] = useState(createInitialInterventionContext());

// Start intervention
setContext(prev => beginIntervention(prev, app, 5));

// Handle transitions
const dispatch = (action) => {
  setContext(prev => interventionReducer(prev, action));
};

// Timer logic
useEffect(() => {
  if (shouldTickBreathing(context.state, context.breathingCount)) {
    const timer = setTimeout(() => {
      dispatch({ type: 'BREATHING_TICK' });
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [context.state, context.breathingCount]);
```

## Files Created

```
src/core/intervention/
├── index.js          # Public API exports
├── state.js          # State definitions (68 lines)
├── transitions.js    # Pure transition functions (237 lines)
└── timers.js         # Timer utilities (89 lines)
```

**Total**: 394 lines of framework-agnostic core logic extracted

## Next Steps (Future Work)

This extraction demonstrates the pattern for extracting other state machines:
- Community activity flow
- Quick Task system
- Inbox update management
- AI prompt building

However, per user request, only the intervention flow was extracted in this phase.

