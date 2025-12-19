Plan Activity Feature Notes

- Added `PlanActivityModal.jsx` and `ActivitySuggestionCard.jsx` for the Community tab planner.
- AI stub: `generateActivitySuggestions(inputs)` in `PlanActivityModal.jsx` returns 3 mock ideas; replace with backend call when ready.
- Activities persist via `communityData` -> `persistCommunityState` (localStorage) so new solo/group items appear across sessions.
- Group creation publishes to `publicEvents` when visibility is public; also adds to `upcomingActivities` for host.
- Ask-to-Join flow is already wired in `ActivityDetailsModal` and uses `incomingRequests`.

Navigation fixes
- Modal now resets state when closed (handleClose) so reopening returns to the Solo/Group selection screen.
- "Back to form" button appears when AI suggestions are shown, clearing suggestions and returning to the input form.
- Switching between Solo/Group tabs clears AI suggestions.
- Accepting, saving, or creating an activity resets the modal state for clean reopening.

QA checklist
- Solo manual save adds item to My Upcoming with confirmed status.
- Solo AI Accept adds confirmed item to My Upcoming.
- Solo AI Save adds confirmed item to My Upcoming.
- Solo AI Edit populates manual form, clears suggestions, and switches to manual mode.
- Group Create & Publish adds to My Upcoming and to Discover when visibility=public.
- Pending join requests render in host modal and can be accepted -> moves to confirmed.
- Planner modal closes cleanly and toasts show success.
- LocalStorage is updated (refresh retains new activities).
- Reopening modal after generating suggestions shows Solo/Group tabs again (not stuck in suggestions).
- "Back to form" button returns user to AI input form from suggestions view.

