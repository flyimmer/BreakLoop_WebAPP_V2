import React from "react";
import { Users, Globe, Activity as ActivityIcon } from "lucide-react";

/**
 * Host type labels for activity cards (compact format)
 */
export const HOST_LABELS_CARD = {
  friend: { label: "Friend", icon: () => <Users size={12} /> },
  public: { label: "Public", icon: () => <Globe size={12} /> },
  self: { label: "My plan", icon: () => <ActivityIcon size={12} /> },
};

/**
 * Host type labels for activity details modal (descriptive format)
 */
export const HOST_LABELS_MODAL = {
  friend: { label: "Friend activity", icon: () => <Users size={12} /> },
  public: { label: "Public event", icon: () => <Globe size={12} /> },
  self: { label: "My plan", icon: () => <ActivityIcon size={12} /> },
};
