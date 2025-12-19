import {
  FRIEND_SHARED_ACTIVITIES,
  INCOMING_REQUESTS,
  MY_UPCOMING_ACTIVITIES,
  PUBLIC_EVENTS,
} from "./mockActivities";

const STORAGE_KEY = "community_mock_state_v2";
export const CURRENT_USER_ID = "f0";

const clone = (val) => JSON.parse(JSON.stringify(val));

const defaultState = {
  upcomingActivities: MY_UPCOMING_ACTIVITIES,
  friendSharedActivities: FRIEND_SHARED_ACTIVITIES,
  publicEvents: PUBLIC_EVENTS,
  incomingRequests: INCOMING_REQUESTS,
  pendingRequests: INCOMING_REQUESTS,
  sharedCurrentActivities: [],
  currentActivity: null,
};

let memoryState = clone(defaultState);

const mergeWithDefaults = (seed = {}) => ({
  ...defaultState,
  ...seed,
});

const updateActivityParticipants = (activity, participant) => {
  if (!participant) return activity;
  const existing = activity.participants || [];
  const alreadyIn = existing.some((p) => p.id === participant.id);
  return {
    ...activity,
    participants: alreadyIn ? existing : [...existing, participant],
  };
};

const updateMatchingActivities = (list = [], request, participant) =>
  (list || []).map((act) => {
    const matches =
      act.requestId === request?.id ||
      act.sourceId === request?.activityId ||
      act.id === request?.activityId;
    if (!matches) return act;
    const updatedStatus =
      act.status === "hosting" ? act.status : request?.status || act.status;
    const base = { ...act, status: updatedStatus };
    return participant ? updateActivityParticipants(base, participant) : base;
  });

export function loadCommunityState(seed = {}, options = {}) {
  const { disablePersistence = false } = options;

  if (disablePersistence || typeof window === "undefined") {
    memoryState = mergeWithDefaults(seed);
    return clone(memoryState);
  }

  const persisted = window.localStorage.getItem(STORAGE_KEY);
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted);
      memoryState = mergeWithDefaults(parsed);
      return clone(memoryState);
    } catch (err) {
      console.warn("Failed to parse community mock state. Resetting.", err);
    }
  }

  const seeded = mergeWithDefaults(seed);
  memoryState = clone(seeded);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return clone(seeded);
}

export function persistCommunityState(nextState, options = {}) {
  const { disablePersistence = false } = options;
  memoryState = mergeWithDefaults({
    ...memoryState,
    ...nextState,
  });

  if (!disablePersistence && typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  }

  return clone(memoryState);
}

export function addMockRequest(activity, requester) {
  const request = {
    id: `req-${Date.now()}`,
    activityId: activity.id,
    activityTitle: activity.title,
    requesterId: requester.id,
    requesterName: requester.name,
    hostId: activity.hostId,
    status: "pending",
    visibility:
      activity.visibility || activity.hostType === "public" ? "public" : "friends",
  };

  memoryState = {
    ...memoryState,
    incomingRequests: [...(memoryState.incomingRequests || []), request],
    pendingRequests: [...(memoryState.pendingRequests || []), request],
  };
  persistCommunityState(memoryState);
  return request;
}

export function createJoinRequestState(prevState = {}, activity, requester, options = {}) {
  const requestId = options.id || `req-${Date.now()}`;
  const base = mergeWithDefaults(prevState);
  const targetId = activity?.sourceId || activity?.id;
  const existing = (base.upcomingActivities || []).some(
    (a) => a.sourceId === targetId || a.id === targetId
  );

  const visibility =
    activity.visibility || (activity.hostType === "public" ? "public" : "friends");

  const pendingEntry = {
    ...activity,
    id: existing ? targetId : `ua-${Date.now()}`,
    sourceId: targetId,
    status: "pending",
    requestId,
    hostId: activity.hostId,
    hostName: activity.hostName,
    visibility,
  };

  const upcomingActivities = existing
    ? (base.upcomingActivities || []).map((a) =>
        a.sourceId === targetId || a.id === targetId
          ? { ...a, status: "pending", requestId }
          : a
      )
    : [...(base.upcomingActivities || []), pendingEntry];

  const markPending = (list = []) =>
    (list || []).map((item) =>
      item.id === activity.id || item.id === targetId
        ? { ...item, status: "pending" }
        : item
    );

  const incomingRequests = [
    ...(base.incomingRequests || []),
    {
      id: requestId,
      activityId: targetId,
      activityTitle: activity.title,
      requesterId: requester.id,
      requesterName: requester.name,
      hostId: activity.hostId,
      status: "pending",
      visibility,
    },
  ];

  const result = {
    ...base,
    upcomingActivities,
    friendSharedActivities:
      activity.hostType === "friend"
        ? markPending(base.friendSharedActivities)
        : base.friendSharedActivities,
    publicEvents:
      activity.hostType === "public"
        ? markPending(base.publicEvents)
        : base.publicEvents,
    sharedCurrentActivities: markPending(base.sharedCurrentActivities),
    incomingRequests,
    pendingRequests: incomingRequests,
  };
  return result;
}

export function acceptJoinRequestState(prevState = {}, request) {
  const base = mergeWithDefaults(prevState);
  const participant = request?.requesterId
    ? {
        id: request.requesterId,
        name: request.requesterName,
        status: "confirmed",
      }
    : null;

  const incomingRequests = (base.incomingRequests || []).map((req) =>
    req.id === request.id ? { ...req, status: "confirmed" } : req
  );
  const upcomingActivities = updateMatchingActivities(
    base.upcomingActivities,
    { ...request, status: "confirmed" },
    participant
  );

  return {
    ...base,
    incomingRequests,
    pendingRequests: incomingRequests,
    upcomingActivities,
    friendSharedActivities: updateMatchingActivities(
      base.friendSharedActivities,
      request,
      participant
    ),
    publicEvents: updateMatchingActivities(base.publicEvents, request, participant),
    sharedCurrentActivities: updateMatchingActivities(
      base.sharedCurrentActivities,
      request,
      participant
    ),
  };
}

export function declineJoinRequestState(prevState = {}, request) {
  const base = mergeWithDefaults(prevState);
  const incomingRequests = (base.incomingRequests || []).map((req) =>
    req.id === request.id ? { ...req, status: "rejected" } : req
  );
  const upcomingActivities = (base.upcomingActivities || []).filter(
    (act) => act.requestId !== request.id
  );

  return {
    ...base,
    incomingRequests,
    pendingRequests: incomingRequests,
    upcomingActivities,
  };
}

export function cancelJoinRequestState(prevState = {}, activity, requesterId) {
  const base = mergeWithDefaults(prevState);
  const targetId = activity?.sourceId || activity?.id;
  
  // Remove the activity from upcomingActivities if it has a pending request
  const upcomingActivities = (base.upcomingActivities || []).filter(
    (act) => {
      // Remove if it matches the activity and has pending status
      const matches = act.id === activity.id || act.sourceId === targetId || act.id === targetId;
      const isPending = act.status === "pending";
      return !(matches && isPending);
    }
  );
  
  // Remove the request from incomingRequests and pendingRequests
  const incomingRequests = (base.incomingRequests || []).filter(
    (req) => {
      const matches = req.activityId === targetId || req.activityId === activity.id;
      const isMyRequest = req.requesterId === requesterId;
      return !(matches && isMyRequest && req.status === "pending");
    }
  );

  return {
    ...base,
    upcomingActivities,
    incomingRequests,
    pendingRequests: incomingRequests,
  };
}

export function setCurrentActivityState(prevState = {}, currentActivity) {
  const base = mergeWithDefaults(prevState);
  return { ...base, currentActivity: currentActivity || null };
}

export function runJoinFlowSmokeTest() {
  const snapshot = clone(memoryState);
  const pendingCount = (snapshot.incomingRequests || []).filter(
    (req) => req.status === "pending"
  ).length;

  return {
    pendingCount,
    upcomingCount: snapshot.upcomingActivities?.length || 0,
    hasPublicEvents: snapshot.publicEvents?.length > 0,
    hasCurrentActivity: !!snapshot.currentActivity,
  };
}

