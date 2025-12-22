import React, { useState, useEffect, useRef } from "react";
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
  MessageCircle,
  ChevronLeft,
  Send,
} from "lucide-react";
import { HOST_LABELS_MODAL } from "../constants/hostLabels";
import { findUpcomingActivity } from "../utils/activityMatching";
import {
  getEventMessages,
  addEventMessage,
  generateMessageId,
  formatMessageTime,
} from "../utils/eventChat";
import { emitEventChatUpdate } from "../utils/eventUpdates";

export function ActivityDetailsModal({
  activity,
  currentUserId,
  navigationContext,
  onClose,
  onRequestJoin,
  onStartActivity,
  onAcceptRequest,
  onDeclineRequest,
  onEditActivity,
  onCancelActivity,
  onQuitActivity,
  onCancelRequest,
  onChatOpened,
  requests = [],
  upcomingActivities = [],
  pendingRequests = [],
}) {
  if (!activity) return null;

  // Determine initial tab based on navigation context
  const getInitialTab = () => {
    if (navigationContext?.initialTab) {
      return navigationContext.initialTab;
    }
    return "details";
  };

  // Section management state
  const [activeSection, setActiveSection] = useState(getInitialTab());
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const hostMeta = HOST_LABELS_MODAL[activity.hostType] || HOST_LABELS_MODAL.self;
  
  // Determine if user is host
  // RULE 1: If navigated from join_request update, user is always the host
  const isHost = 
    (navigationContext?.updateType === 'join_request') ||
    (currentUserId && activity.hostId === currentUserId);

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

  // Set initial tab based on navigation context when activity changes
  useEffect(() => {
    if (activity?.id) {
      const initialTab = getInitialTab();
      setActiveSection(initialTab);
    }
  }, [activity?.id, navigationContext]);

  // Load chat messages when activity changes or chat tab is opened
  useEffect(() => {
    if (activity?.id) {
      const eventMessages = getEventMessages(activity.id);
      setMessages(eventMessages);
    }
  }, [activity?.id]);

  // Scroll to bottom when messages change or chat tab opens
  useEffect(() => {
    if (activeSection === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeSection]);

  // Resolve event_chat updates when chat tab is opened (Phase E-2d)
  useEffect(() => {
    if (activeSection === "chat" && activity?.id && onChatOpened) {
      onChatOpened(activity.id);
    }
  }, [activeSection, activity?.id, onChatOpened]);

  // Determine if user can access chat
  // User can chat if they are host OR confirmed participant
  const canAccessChat = isHost || (userHasJoined && !isPending);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    if (!canAccessChat) return;
    if (!activity?.id) return;

    // Get current user name from activity context
    // TODO: In real implementation, this should come from user profile state
    const senderName = isHost ? activity.hostName || "You" : "You";

    const newMessage = {
      id: generateMessageId(),
      eventId: activity.id,
      senderId: currentUserId,
      senderName: senderName,
      text: messageInput.trim(),
      createdAt: Date.now(),
    };

    // Add message to storage and update local state
    const updatedMessages = addEventMessage(activity.id, newMessage);
    setMessages(updatedMessages);
    setMessageInput("");

    // Emit event update signal (Phase E-2c)
    emitEventChatUpdate(
      activity.id,
      currentUserId,
      senderName,
      messageInput.trim()
    );

    // Focus input after sending
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Section rendering functions
  const renderDetailsSection = () => (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
      <div className="space-y-3 pt-2">
        {!isHost && !userHasJoined && (
          <button
            onClick={() => onRequestJoin?.(activity)}
            className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Users size={16} /> Ask to join
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
      </div>
    </div>
  );

  const renderChatSection = () => {
    // If user is not confirmed, show restricted access message
    if (!canAccessChat) {
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-5">
            <div className="text-center text-slate-400 space-y-2">
              <MessageCircle size={48} className="mx-auto opacity-30" />
              <p className="text-sm font-medium">Chat not available</p>
              <p className="text-xs">Chat is available once you are confirmed</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-400 space-y-2">
                <MessageCircle size={48} className="mx-auto opacity-30" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs">Start a conversation with participants</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwnMessage = msg.senderId === currentUserId;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isOwnMessage ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Sender name and timestamp */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-medium text-slate-600">
                        {isOwnMessage ? "You" : msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                    
                    {/* Message bubble */}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                        isOwnMessage
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Chat input */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <input
              ref={chatInputRef}
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderParticipantsSection = () => (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Confirmed participants */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Confirmed
        </div>
        <div className="space-y-2">
          {/* Host always shows first */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-800">
                {activity.hostName || "You"}
              </div>
              <div className="text-[11px] text-slate-500">Host</div>
            </div>
            <Shield size={16} className="text-slate-400" />
          </div>
          {/* TODO: Add confirmed participants list */}
          {/* Placeholder for now */}
        </div>
      </div>

      {/* Pending requests - only visible to host */}
      {isHost && requests?.length > 0 && (
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Pending Requests
          </div>
          <div className="space-y-2">
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
      )}

      {isHost && (!requests || requests.length === 0) && (
        <div className="text-center text-slate-400 py-8">
          <p className="text-sm">No pending requests</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      {/* Header with back button */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <ChevronLeft size={20} className="text-slate-700" />
        </button>
        <div className="flex-1 text-center">
          <h3 className="font-bold text-base text-slate-800">Activity Details</h3>
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Section tabs */}
      <div className="border-b border-slate-200 px-4 pt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSection("details")}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-t-lg transition-colors ${
              activeSection === "details"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveSection("chat")}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-t-lg transition-colors ${
              activeSection === "chat"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveSection("participants")}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-t-lg transition-colors ${
              activeSection === "participants"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Participants
          </button>
        </div>
      </div>

      {/* Section content */}
      {activeSection === "details" && renderDetailsSection()}
      {activeSection === "chat" && renderChatSection()}
      {activeSection === "participants" && renderParticipantsSection()}

      {/* Close button at bottom (fixed) */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <button
          onClick={onClose}
          className="w-full text-slate-500 font-bold py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ActivityDetailsModal;

