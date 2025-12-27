# Phase E-2e: Unread & Resolution Semantics

**Date:** December 22, 2025  
**Status:** ✅ COMPLETE

---

## Goal

Implement correct, minimal, non-coercive unread and resolution logic for Inbox v1 to ensure:
- Users are informed without pressure
- Nothing escalates if ignored
- Inbox remains safe to forget
- Attention semantics are stable and predictable

---

## Critical Principles Met

### ✅ No Coercion
- No push notifications added
- No reminders, nudges, or escalation logic
- No sounds, vibrations, or animations
- No streaks or pressure counters
- Unread indicates **STATE**, not **OBLIGATION**

### ✅ Stability
- If user ignores Inbox → unread state remains as-is
- No escalation occurs
- No new reminders appear
- No penalties apply
- Inbox is safe to forget

### ✅ Clarity
- Two independent unread systems (never merged):
  1. Private Messages (conversations)
  2. Updates (system/event signals)
- Badge shows exact count, no color escalation
- Resolution requires explicit user action

---

## Implementation Details

### 1. Private Messages — Unread Logic

**Conversation is UNREAD if:**
- The latest message in the conversation
- Was sent by the OTHER participant
- AND the conversation has not been opened since

**Conversation is READ when:**
- User opens the conversation thread
- ALL messages in that conversation marked as read
- No partial read states

**Persistence:**
- `lastReadAt` field added to conversation data model
- Stored in `private_messages_v1` localStorage

**No Read Receipts:**
- Other user is NOT notified when messages are read
- No typing indicators
- No online status changes

### 2. Updates — Resolution Logic

**Update is UNRESOLVED when:**
- `update.resolved === false`

**Update becomes RESOLVED only after explicit user action:**

| Update Type | Resolution Trigger |
|------------|-------------------|
| `event_chat` | User opens Activity Details → Chat tab |
| `join_request` | User accepts OR declines request |
| `join_approved` | User opens the related Activity Details |
| `join_declined` | User opens the related Activity Details |
| `event_updated` | User opens Activity Details |
| `event_cancelled` | User opens Activity Details |
| `participant_left` | User opens Activity Details |

**Rules:**
- Do NOT auto-resolve updates on arrival
- Do NOT resolve updates just because Inbox was opened
- Resolution requires context view or action
- Resolved state persisted to `event_updates_v1` localStorage

### 3. Badge Logic (Strict)

**Inbox Tab Badge:**
```javascript
badge = getUnresolvedCount() + getUnreadConversationCount(currentUserId)
```
- Shows total count of (unread conversations + unresolved updates)
- Updates immediately when state changes
- No color escalation
- No pulsing or animation

**Messages Sub-tab Badge:**
```javascript
badge = getUnreadConversationCount(currentUserId)
```
- Shows number of unread conversations only

**Updates Sub-tab Badge:**
```javascript
badge = unresolvedUpdates.length
```
- Shows number of unresolved updates only

**Other Tabs:**
- Community: NEVER badged
- Insights: NEVER badged
- Settings: NEVER badged

---

## Files Modified

### 1. `src/utils/privateMessages.js` (+~60 lines)

**New Functions:**

```javascript
/**
 * Check if conversation is unread
 * Returns true if:
 * - Latest message sent by OTHER user
 * - Conversation not opened since that message
 */
isConversationUnread(conversation, currentUserId)

/**
 * Mark conversation as read
 * Sets lastReadAt to current timestamp
 */
markConversationAsRead(conversationId)

/**
 * Get count of unread conversations
 * Returns number of conversations with unread messages
 */
getUnreadConversationCount(currentUserId)
```

**Data Model Update:**
```javascript
PrivateConversation {
  id: string
  participantIds: string[]
  messages: PrivateMessage[]
  createdAt: number
  lastMessageAt: number
  lastReadAt: number  // ← NEW: timestamp of last read
}
```

### 2. `src/App.js` (+~20 lines)

**Changes:**

1. **Imports:** Added unread detection functions
   ```javascript
   import {
     isConversationUnread,
     markConversationAsRead,
     getUnreadConversationCount,
   } from "./utils/privateMessages";
   ```

2. **openChat():** Mark conversation as read when opened
   ```javascript
   const openChat = (friend) => {
     actions.setActiveChatFriend(friend);
     
     // Mark conversation as read (Phase E-2e)
     const conversationId = getConversationId(currentUserId, friend.id);
     markConversationAsRead(conversationId);
   };
   ```

3. **Messages Tab Badge:** Show unread conversation count
   ```javascript
   const unreadCount = getUnreadConversationCount(currentUserId);
   return unreadCount > 0 && (
     <span className="...badge">
       {unreadCount > 99 ? '99+' : unreadCount}
     </span>
   );
   ```

4. **Inbox Tab Badge:** Show total unread count
   ```javascript
   badge={getUnresolvedCount() + getUnreadConversationCount(currentUserId)}
   ```

5. **Conversation List Items:** Visual unread indicators
   ```javascript
   const isUnread = isConversationUnread(conversation, currentUserId);
   
   // Blue dot on avatar
   {isUnread && (
     <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
   )}
   
   // Bold name and message text
   <span className={isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}>
     {displayName}
   </span>
   <p className={isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}>
     {lastMessage?.text}
   </p>
   ```

---

## User Experience

### Scenario 1: Receiving a Private Message

1. Friend sends message: "Hey, want to grab coffee?"
2. **Inbox tab badge:** Shows +1
3. User opens Inbox → Messages tab
4. **Messages badge:** Shows 1 unread
5. Conversation list shows:
   - Blue dot on friend's avatar
   - Bold friend name
   - Bold message preview
6. User taps conversation
7. Chat opens in Community tab
8. **Conversation marked as read** automatically
9. Blue dot disappears
10. Badges update to 0

**If user ignores:**
- Badge remains at 1
- No escalation
- No reminders
- User can check whenever they want

### Scenario 2: Receiving Event Update

1. Host cancels event
2. `event_cancelled` update created
3. **Inbox tab badge:** Shows +1
4. User opens Inbox → Updates tab
5. **Updates badge:** Shows 1 unresolved
6. Update shown: "Event was cancelled"
7. User taps update
8. Activity Details opens
9. **Update marked as resolved** automatically
10. Update removed from list
11. Badge updates to 0

**If user ignores:**
- Update remains unresolved
- No escalation
- No auto-resolution
- User can check whenever they want

### Scenario 3: Multiple Unread Items

1. User has:
   - 2 unread conversations
   - 3 unresolved updates
2. **Inbox tab badge:** Shows 5 (total)
3. **Messages badge:** Shows 2
4. **Updates badge:** Shows 3
5. User opens one conversation
6. **Inbox badge:** Now shows 4
7. **Messages badge:** Now shows 1
8. User resolves one update
9. **Inbox badge:** Now shows 3
10. **Updates badge:** Now shows 2

---

## Unread Detection Logic

### Private Messages

```javascript
function isConversationUnread(conversation, currentUserId) {
  // No messages = not unread
  if (!conversation.messages || conversation.messages.length === 0) {
    return false;
  }
  
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  
  // My own message = not unread
  if (lastMessage.senderId === currentUserId) {
    return false;
  }
  
  // Never read = unread
  if (!conversation.lastReadAt) {
    return true;
  }
  
  // Unread if message arrived after last read
  return lastMessage.createdAt > conversation.lastReadAt;
}
```

**Key Decisions:**
- If YOU sent the last message → conversation is NOT unread
- Only OTHER user's messages can make conversation unread
- Once read, stays read until new message arrives

### Updates

```javascript
// Updates already have resolved flag from Phase E-2d
const unresolvedUpdates = allUpdates.filter(u => !u.resolved);
```

**Key Decisions:**
- Updates start as `resolved: false`
- Only explicit user action marks `resolved: true`
- Opening Inbox does NOT resolve updates
- Must open specific context or take action

---

## Badge Calculation

### Inbox Tab
```javascript
const totalUnread = getUnresolvedCount() + getUnreadConversationCount(currentUserId);

<NavIcon
  icon={<Inbox size={20} />}
  label="Inbox"
  badge={totalUnread}
/>
```

### Messages Sub-tab
```javascript
const unreadMessages = getUnreadConversationCount(currentUserId);

<button>
  Messages
  {unreadMessages > 0 && (
    <span className="badge">{unreadMessages}</span>
  )}
</button>
```

### Updates Sub-tab
```javascript
const unresolvedCount = unresolvedUpdates.length;

<button>
  Updates
  {unresolvedCount > 0 && (
    <span className="badge">{unresolvedCount}</span>
  )}
</button>
```

**Badge Rules:**
- Show exact count (1-99)
- Show "99+" for counts over 99
- Red background, white text
- Circular pill shape
- No animation or pulsing
- No color changes based on age or urgency

---

## What Was NOT Implemented (By Design)

Per Phase E-2e constraints:

- ❌ Push notifications
- ❌ Reminders or nudges
- ❌ Escalation logic
- ❌ Sounds or vibrations
- ❌ Badge animations
- ❌ Streak counters
- ❌ Time-based urgency indicators
- ❌ Read receipts to other users
- ❌ Typing indicators
- ❌ Online/offline status
- ❌ "Mark all as read" button (may be added later as convenience)
- ❌ Snooze/defer functionality

---

## Compliance with Design Principles

### Main App Posture
✅ No manipulation or coercion  
✅ User agency preserved  
✅ Safe to ignore  
✅ No guilt framing  

### Communication Model
✅ Messages and Updates separated  
✅ Unread indicates state, not obligation  
✅ No badge escalation  
✅ Community never badged  

### Inbox Flows
✅ Conversations unread by default  
✅ Updates unresolved until action  
✅ Badge shows accurate count  
✅ No auto-resolution  

---

## Testing Results

### Build Verification
```bash
npm run build
# Result: ✅ Compiled successfully
# Bundle size: 117.01 kB (+242 B)
# No linter errors
```

### Manual Testing Checklist

**Private Messages:**
- ✅ Send message from friend → Inbox badge +1
- ✅ Messages badge shows 1
- ✅ Conversation shows blue dot
- ✅ Open conversation → Blue dot disappears
- ✅ Badges decrement to 0
- ✅ My own message doesn't mark unread
- ✅ Ignoring message keeps it unread
- ✅ No read receipt sent to friend

**Updates:**
- ✅ Event cancelled → Inbox badge +1
- ✅ Updates badge shows 1
- ✅ Open update → Resolves correctly
- ✅ Badge decrements to 0
- ✅ Opening Inbox doesn't auto-resolve
- ✅ Each update type resolves per rules

**Badges:**
- ✅ Inbox badge = messages + updates
- ✅ Messages badge = unread conversations
- ✅ Updates badge = unresolved updates
- ✅ Badges update in real-time
- ✅ No badge on Community/Insights/Settings

**Stability:**
- ✅ Ignoring Inbox → no escalation
- ✅ No reminders appear
- ✅ State persists across refresh
- ✅ Multiple unread items handled correctly

---

## Performance Impact

- **Bundle Size:** +242 bytes gzipped (minimal)
- **Runtime:** Badge calculation is O(n) on conversations/updates
- **Storage:** Added `lastReadAt` field per conversation (~8 bytes)
- **Memory:** No additional memory overhead

---

## Data Migration

### Existing Conversations
- Conversations without `lastReadAt` field are treated as "never read"
- If last message is from other user → conversation appears as unread
- User opening conversation sets `lastReadAt` for first time
- No data loss, backwards compatible

### Existing Updates
- Updates already have `resolved` field from Phase E-2d
- No migration needed
- System works immediately

---

## Future Enhancements (Out of Scope)

### Phase E-2f: Convenience Features
- "Mark all as read" button
- "Clear all resolved" button
- Conversation archiving
- Update filtering

### Phase E-3: Optional Notifications
- Push notification opt-in
- Notification preferences per source
- Sound/vibration opt-in
- Still no escalation or coercion

### Phase E-4: Advanced Unread
- Per-message unread state
- Partial read indicators
- Thread-level unread in group chats
- Smart unread (ML-based importance)

---

## Code Quality

### Maintainability
- ✅ Clear function names
- ✅ JSDoc comments
- ✅ Inline comments explain decisions
- ✅ Consistent with existing patterns

### Testability
- ✅ Pure functions for unread detection
- ✅ Deterministic badge calculation
- ✅ Easy to unit test
- ✅ No hidden state

### Performance
- ✅ Minimal bundle size increase
- ✅ Efficient unread detection
- ✅ No unnecessary re-renders
- ✅ localStorage I/O only when needed

---

## Documentation

Complete documentation provided:
- `PHASE_E2E_UNREAD_RESOLUTION.md` - This file
- Inline code comments in `src/utils/privateMessages.js`
- JSDoc comments for all new functions
- Clear explanation of design decisions

---

## Conclusion

Phase E-2e implements **correct, minimal, non-coercive** unread and resolution semantics for Inbox v1:

- ✅ **Informative** - Users know what's new
- ✅ **Non-coercive** - No pressure to act
- ✅ **Stable** - Safe to ignore
- ✅ **Predictable** - Clear rules, no surprises
- ✅ **Separated** - Messages and Updates independent
- ✅ **Compliant** - Follows all design principles

The system respects user agency while providing clear, accurate information about new messages and updates.

**Phase E-2e: COMPLETE ✅**








