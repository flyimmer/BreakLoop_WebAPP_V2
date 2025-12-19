import {
  loadCommunityState,
  persistCommunityState,
  createJoinRequestState,
  acceptJoinRequestState,
  declineJoinRequestState,
  setCurrentActivityState,
} from "./mockApi";

const STORAGE_KEY = "community_mock_state_v2";

const buildBaseState = () => ({
  upcomingActivities: [],
  friendSharedActivities: [],
  publicEvents: [],
  incomingRequests: [],
  currentActivity: null,
});

describe("community persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("skips writing when persistence is disabled (demo mode)", () => {
    persistCommunityState(
      { upcomingActivities: [{ id: "demo" }] },
      { disablePersistence: true }
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("ignores stored data when demo mode is enabled on load", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ upcomingActivities: [{ id: "persisted" }] })
    );
    const state = loadCommunityState({}, { disablePersistence: true });
    expect(state.upcomingActivities.find((a) => a.id === "persisted")).toBeUndefined();
  });
});

describe("join flow helpers", () => {
  const activity = {
    id: "event-1",
    title: "Test Session",
    hostId: "host-1",
    hostName: "Host One",
    visibility: "friends",
    status: "confirmed",
  };
  const requester = { id: "user-1", name: "Alex" };

  it("creates a pending request and upcoming entry", () => {
    const pending = createJoinRequestState(buildBaseState(), activity, requester, {
      id: "req-1",
    });
    expect(pending.upcomingActivities[0].status).toBe("pending");
    expect(pending.upcomingActivities[0].sourceId).toBe(activity.id);
    expect(pending.incomingRequests[0].id).toBe("req-1");
  });

  it("accepts a request and promotes the participant", () => {
    const pending = createJoinRequestState(buildBaseState(), activity, requester, {
      id: "req-2",
    });
    const accepted = acceptJoinRequestState(pending, pending.incomingRequests[0]);
    const entry = accepted.upcomingActivities.find((a) => a.sourceId === activity.id);
    expect(entry.status).toBe("confirmed");
    expect(entry.participants?.some((p) => p.id === requester.id)).toBe(true);
    expect(
      accepted.incomingRequests.find((r) => r.id === "req-2")?.status
    ).toBe("confirmed");
  });

  it("declines a request and removes the pending entry", () => {
    const pending = createJoinRequestState(buildBaseState(), activity, requester, {
      id: "req-3",
    });
    const declined = declineJoinRequestState(pending, pending.incomingRequests[0]);
    expect(
      declined.incomingRequests.find((r) => r.id === "req-3")?.status
    ).toBe("rejected");
    expect(
      declined.upcomingActivities.find((a) => a.requestId === "req-3")
    ).toBeUndefined();
  });

  it("tracks current activity snapshot", () => {
    const next = setCurrentActivityState(buildBaseState(), {
      title: "Hosting",
      hostId: "host-1",
      allowJoin: true,
    });
    expect(next.currentActivity?.title).toBe("Hosting");
    expect(next.currentActivity?.allowJoin).toBe(true);
  });
});

