import React from "react";
import { Clock, MapPin, Users } from "lucide-react";
import { HOST_LABELS_CARD } from "../constants/hostLabels";
import { findUpcomingActivity } from "../utils/activityMatching";

export function ActivityCard({ activity, onClick, currentUserId, upcomingActivities = [] }) {
  const hostMeta = HOST_LABELS_CARD[activity.hostType] || HOST_LABELS_CARD.self;
  const isHost = currentUserId && activity.hostId === currentUserId;

  // Check if the activity is in user's upcoming activities list
  // This determines the actual status from user's perspective
  const upcomingActivity = findUpcomingActivity(activity, upcomingActivities);
  
  // User has joined if the activity is in their upcoming list
  const userHasJoined = !isHost && !!upcomingActivity;
  // Get status from upcoming activity if user has joined
  const effectiveStatus = upcomingActivity?.status || activity.status;
  
  const isPending = effectiveStatus === "pending";
  const isConfirmed = effectiveStatus === "confirmed";
  const isHosting = effectiveStatus === "hosting";
  const statusLabel = isHosting
    ? "Hosting"
    : isPending
    ? "Pending"
    : isConfirmed
    ? "Confirmed"
    : null;
  const statusClass = isHosting
    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
    : isPending
    ? "bg-amber-50 text-amber-700 border-amber-100"
    : "bg-emerald-50 text-emerald-700 border-emerald-100";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-100 flex items-start gap-3 transition-colors shadow-sm"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="font-bold text-sm text-slate-800 truncate">
            {activity.title}
          </div>
          <div className="flex items-center gap-1">
            {!isHost && userHasJoined && statusLabel && (
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap uppercase tracking-wide ${statusClass}`}
              >
                {statusLabel}
              </span>
            )}
            {isHost && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap bg-slate-900 text-white border-slate-900">
                Host
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          <Clock size={12} />
          <span className="truncate">
            {activity.date} • {activity.time}
          </span>
        </div>
        {activity.location ? (
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin size={12} className="text-slate-400" />
            <span className="truncate">{activity.location}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2 mt-2">
          <div className="inline-flex items-center gap-1 text-[10px] text-slate-500 px-2 py-1 rounded-full bg-white border border-slate-100">
            {hostMeta.icon()}
            <span className="uppercase tracking-wider font-bold">
              {activity.hostName || hostMeta.label}
            </span>
          </div>
        </div>
        {activity.hostName && (
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
            <Users size={12} className="text-slate-400" />
            Hosted by {activity.hostName}
          </div>
        )}
      </div>
    </button>
  );
}

export default ActivityCard;

