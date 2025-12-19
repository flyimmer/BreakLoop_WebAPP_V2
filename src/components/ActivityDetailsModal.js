import React, { useState } from "react";
import {
  Clock,
  MapPin,
  X,
  Shield,
  Check,
  AlertCircle,
  Edit,
  Trash2,
  LogOut,
  Globe,
  Users,
} from "lucide-react";
import { HOST_LABELS_MODAL } from "../constants/hostLabels";
import { findUpcomingActivity } from "../utils/activityMatching";

export function ActivityDetailsModal({
  activity,
  currentUserId,
  onClose,
  onRequestJoin,
  onStartActivity,
  onAcceptRequest,
  onDeclineRequest,
  onEditActivity,
  onCancelActivity,
  onQuitActivity,
  onCancelRequest,
  requests = [],
  upcomingActivities = [],
  pendingRequests = [],
}) {
  if (!activity) return null;

  const hostMeta = HOST_LABELS_MODAL[activity.hostType] || HOST_LABELS_MODAL.self;
  const isHost = currentUserId && activity.hostId === currentUserId;

  // Check if the activity is in user's upcoming activities list
  // This determines if they have actually joined (confirmed or pending)
  const upcomingActivity = findUpcomingActivity(activity, upcomingActivities);
  
  // User has joined if the activity is in their upcoming list
  const userHasJoined = !isHost && !!upcomingActivity;
  // Get status from upcoming activity if user has joined, otherwise use activity's own status
  const activityStatus = upcomingActivity?.status || activity.status || "confirmed";
  const isPending = userHasJoined && activityStatus === "pending";

  const effectiveStatus = activityStatus;
  const statusLabel =
    effectiveStatus === "hosting"
      ? "Hosting"
      : effectiveStatus === "pending"
      ? "Pending"
      : "Confirmed";
  const statusClass =
    effectiveStatus === "hosting"
      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
      : effectiveStatus === "pending"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100";
  const canStart =
    isHost ||
    activity.status === "confirmed" ||
    activity.status === "hosting";
  const visibility =
    activity.visibility === "public" ? "Public" : "Friends only";
  const [allowLiveJoin, setAllowLiveJoin] = useState(false);
  const [liveVisibility, setLiveVisibility] = useState(
    activity.visibility === "public" ? "public" : "friends"
  );

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-5 animate-in zoom-in-95 relative">
        <button
          onClick={onClose}
          className="p-2 bg-slate-100 rounded-full absolute right-3 top-3"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <div className="mb-3">
          <h3 className="font-bold text-lg text-slate-800">Activity Details</h3>
          <p className="text-xs text-slate-500">Community prototype</p>
        </div>
        <div className="space-y-2 text-sm text-slate-700">
          <div className="font-bold flex items-center gap-2">
            {activity.title}
            {isHost && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-900 text-white">
                <Shield size={10} /> Host
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock size={12} /> {activity.date} • {activity.time}
          </div>
          {activity.location && (
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <MapPin size={12} /> {activity.location}
            </div>
          )}
          <div className="text-xs text-slate-600 leading-relaxed">
            {activity.description}
          </div>
          <div className="flex items-center gap-2 pt-1">
            {!isHost && userHasJoined && (
              <span
                className={`inline-flex text-[11px] font-bold px-2 py-1 rounded-full border uppercase tracking-wide ${statusClass}`}
              >
                {statusLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
              {hostMeta.icon()}
              {activity.hostType === "friend" && activity.hostName
                ? activity.hostName
                : hostMeta.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              <Globe size={12} /> {visibility}
            </span>
          </div>
          {activity.hostName && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Users size={12} /> Hosted by {activity.hostName}
            </div>
          )}
        </div>

        {/* Join / start actions */}
        <div className="space-y-3 mt-5">
          {!isHost && !userHasJoined && (
            <button
              onClick={() => onRequestJoin?.(activity)}
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <Users size={16} /> Join the event
            </button>
          )}

          {!isHost && userHasJoined && isPending && (
            <button
              onClick={() => onCancelRequest?.(activity)}
              className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <X size={16} /> Cancel request
            </button>
          )}

          {!isHost && userHasJoined && !isPending && (
            <button
              onClick={() => onQuitActivity?.(activity)}
              className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Quit event
            </button>
          )}

          {isHost && (
            <div className="space-y-2">
              <button
                onClick={() => onEditActivity?.(activity)}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                <Edit size={16} /> Edit activity
              </button>
              <button
                onClick={() => onCancelActivity?.(activity)}
                className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Cancel event
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full text-slate-500 font-bold py-2.5 rounded-xl bg-slate-50 border border-slate-100"
          >
            Close
          </button>
        </div>

        {isHost && requests?.length ? (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Requests
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {req.requesterName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {req.status === "pending" ? "Pending" : req.status}
                    </div>
                  </div>
                  {req.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAcceptRequest?.(activity, req)}
                        className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onDeclineRequest?.(activity, req)}
                        className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      {req.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ActivityDetailsModal;

