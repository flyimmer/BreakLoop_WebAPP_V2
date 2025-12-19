import React, { useEffect, useState } from "react";
import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  Clock,
  Globe,
  MapPin,
  Users,
  X,
} from "lucide-react";


const VISIBILITY_OPTIONS = [
  { value: "private", label: "Only for me" },
  { value: "friends", label: "Friends can ask to join" },
  { value: "public", label: "Anyone can ask to join" },
];

export default function AltSchedulerModal({
  isOpen,
  activity,
  friends = [],
  onSave,
  onClose,
}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "",
    date: todayIso,
    time: "",
    endTime: "",
    location: "",
    eventPlace: "",
    description: "",
    visibility: "private",
    participantLimit: 3,
    invited: [],
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({
      ...prev,
      title: activity?.title || prev.title || "Planned activity",
      description: prev.description || activity?.desc || "",
      location: prev.location || activity?.location || "",
      date: prev.date || todayIso,
    }));
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const isSoloActivity = form.visibility === "private";

  const updateField = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const toggleInvite = (friendId) =>
    setForm((prev) => {
      const invited = prev.invited.includes(friendId)
        ? prev.invited.filter((id) => id !== friendId)
        : [...prev.invited, friendId];
      return { ...prev, invited };
    });

  const handleSave = () => {
    const participantLimit = Number(form.participantLimit) || undefined;
    const payload = {
      ...form,
      participantLimit,
      maxParticipants: participantLimit,
      invited: form.invited,
      title: form.title || activity?.title || "Planned activity",
      description: form.description || activity?.desc,
    };
    onSave?.(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 shadow-xl animate-in slide-in-from-bottom">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
              Plan for later
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              {activity?.title || "Schedule activity"}
            </h3>
            <p className="text-xs text-slate-500">
              Save to My Upcoming Activities
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <CalendarDays size={12} /> Date
              </span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Time
              </span>
              <input
                type="time"
                value={form.time}
                onChange={(e) => updateField("time", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="--:--"
              />
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="--:--"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} /> Location
              </span>
              <input
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="City or area"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                Event place
              </span>
              <input
                value={form.eventPlace}
                onChange={(e) => updateField("eventPlace", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Venue"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <AlignLeft size={12} /> Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
              placeholder="What will you do?"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Globe size={12} /> Visibility
              </div>
              <div className="space-y-1">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600"
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      checked={form.visibility === opt.value}
                      onChange={(e) => updateField("visibility", e.target.value)}
                      className="accent-blue-600"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users size={12} /> Participant limit
              </span>
              <input
                type="number"
                min="1"
                value={form.participantLimit}
                onChange={(e) => updateField("participantLimit", e.target.value)}
                disabled={isSoloActivity}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </label>
          </div>

          {friends.length > 0 && !isSoloActivity && (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                <CheckSquare size={12} /> Invite friends
              </div>
              <div className="grid grid-cols-2 gap-2">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-2"
                  >
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={form.invited.includes(friend.id)}
                      onChange={() => toggleInvite(friend.id)}
                    />
                    {friend.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

