import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  Loader,
  MapPin,
  Sparkles,
  Users,
  User,
  X,
} from "lucide-react";
import ActivitySuggestionCard from "./ActivitySuggestionCard";
import { callGemini } from "../utils/gemini";
import { parseFormattedDate, parseTimeString, parseTimeRange } from "../utils/time";

// AI-powered activity suggestion generator using Gemini API
export async function generateActivitySuggestions(inputs) {
  const { topic, location, timePreference, date, participantsDescription } = inputs;

  // Build the prompt for Gemini
  const timeContext = timePreference === "Now" 
    ? `right now (current time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })})` 
    : (timePreference || "any time");
  
  const prompt = `You are a mindful activity planning assistant. Generate 3 diverse, personalized activity suggestions based on the following user preferences:

Topic/Interest: ${topic || "general wellness"}
Location: ${location || "flexible location"}
Time of Day: ${timeContext}
Date: ${date || "today"}
Participants Description: ${participantsDescription || "no specific participant preferences"}

Please generate 3 different activity suggestions that:
1. Match the topic/interest if provided
2. Can be done at or near the specified location
3. Are appropriate for the time of day
4. Consider the number of participants and participant preferences if provided
5. Range from 20 minutes to 3 hours in duration
6. Provide clear, actionable descriptions with SPECIFIC recommendations

IMPORTANT: Be specific and concrete in your suggestions. If the user mentions watching a movie, recommend actual movie titles. If they mention restaurants, suggest real places. If they mention activities, provide specific venues or exact plans. Include the location details in your suggestions.

Return your response as a valid JSON array with exactly 3 objects, each having this structure:
[
  {
    "title": "Activity Name (be specific, e.g., 'Watch The Notebook at Cinema Palace')",
    "description": "Detailed description with specific recommendations, venue names, movie titles, etc.",
    "duration": "estimated time like 30-45m or 60-90m",
    "time": "suggested start time in HH:MM format based on timePreference"
  }
]

Make each suggestion unique and diverse. Be as specific as possible based on the user's inputs.
IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, no additional text.`;

  try {
    const response = await callGemini(prompt);

    if (!response) {
      console.warn("Gemini API returned null, using fallback suggestions");
      return getFallbackSuggestions(inputs);
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, "").replace(/```\n?$/g, "");
    }

    // Parse the JSON response
    const suggestions = JSON.parse(cleanedResponse);

    // Validate and format the suggestions
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      return suggestions.slice(0, 3).map((sug, index) => ({
        id: `ai-${Date.now()}-${index + 1}`,
        title: sug.title || "Suggested Activity",
        description: sug.description || "No description provided",
        time: sug.time || getDefaultTime(timePreference, index),
        location: location || "Your preferred location",
        topic: topic || "General wellness",
        duration: sug.duration || "30-60m",
      }));
    } else {
      console.warn("Invalid suggestions format from Gemini, using fallback");
      return getFallbackSuggestions(inputs);
    }
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return getFallbackSuggestions(inputs);
  }
}

// Helper function to get default time based on preference
function getDefaultTime(timePreference, index) {
  // If "Now" is selected, return current time
  if (timePreference === "Now") {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const baseTimes = {
    Morning: ["08:00", "09:30", "07:00"],
    Afternoon: ["14:00", "15:30", "16:00"],
    Evening: ["18:30", "19:00", "20:00"],
  };

  return baseTimes[timePreference]?.[index] || ["09:00", "14:00", "18:30"][index] || "09:00";
}

// Fallback suggestions when AI is unavailable
function getFallbackSuggestions(inputs) {
  const { topic, location, timePreference } = inputs;
  const locationText = location ? `at ${location}` : "";

  return [
    {
      id: `ai-${Date.now()}-1`,
      title: "Mindful Activity Session",
      description: `Engage in a focused ${topic || "wellness"} activity ${locationText}. Take your time, be present, and enjoy the experience.`,
      time: getDefaultTime(timePreference, 0),
      location: location || "Your preferred location",
      topic: topic || "General wellness",
      duration: "30-60m",
    },
    {
      id: `ai-${Date.now()}-2`,
      title: "Reflective Practice",
      description: `Spend time on ${topic || "mindful activities"} ${locationText}. Focus on quality over quantity and notice how you feel.`,
      time: getDefaultTime(timePreference, 1),
      location: location || "Your preferred location",
      topic: topic || "General wellness",
      duration: "45-75m",
    },
    {
      id: `ai-${Date.now()}-3`,
      title: "Intentional Break",
      description: `Take a purposeful break for ${topic || "self-care"} ${locationText}. Remove distractions and fully commit to the moment.`,
      time: getDefaultTime(timePreference, 2),
      location: location || "Your preferred location",
      topic: topic || "General wellness",
      duration: "20-45m",
    },
  ];
}

export default function PlanActivityModal({
  isOpen,
  onClose,
  onCreateSolo,
  onCreateGroup,
  onUpdateActivity,
  onSaveSuggestion,
  defaultDate,
  editActivity,
}) {
  const [mode, setMode] = useState("solo");
  const [soloMode, setSoloMode] = useState("ai");
  const [aiForm, setAiForm] = useState({
    date: defaultDate,
    timePreference: "",
    topic: "",
    location: "",
    participantsDescription: "",
  });
  const [manualForm, setManualForm] = useState({
    title: "",
    description: "",
    date: defaultDate,
    time: "",
    endTime: "",
    steps: "",
    location: "",
  });
  const [groupForm, setGroupForm] = useState({
    title: "",
    description: "",
    date: defaultDate,
    time: "",
    endTime: "",
    location: "",
    maxParticipants: 6,
    visibility: "friends",
    allowAutoJoin: false,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  // Track if user came from AI suggestions (to enable back navigation)
  const [cameFromSuggestions, setCameFromSuggestions] = useState(false);

  const isEditMode = !!editActivity;
  const canSubmitSoloManual = manualForm.title && manualForm.date && manualForm.time;
  const canSubmitGroup = groupForm.title && groupForm.date && groupForm.time;

  // Check if selected date is today
  const isToday = React.useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return aiForm.date === todayStr;
  }, [aiForm.date]);

  // Populate form when editing
  React.useEffect(() => {
    if (editActivity && isOpen) {
      // Parse date from activity (might be formatted like "Sat, Dec 13" or ISO format)
      const isoDate = parseFormattedDate(editActivity.date, defaultDate);

      // Parse time from activity (might be formatted like "9:30 AM" or "9:30 AM - 11:00 AM")
      const timeStr = editActivity.time || "";
      const { start: parsedTime, end: parsedEndTime } = parseTimeRange(timeStr);

      // Determine if this is a group or solo activity
      const isGroup = editActivity.hostType === "public" || editActivity.visibility === "public" || editActivity.maxParticipants > 1;

      if (isGroup) {
        setMode("group");
        setGroupForm({
          title: editActivity.title || "",
          description: editActivity.description || "",
          date: isoDate,
          time: parsedTime,
          endTime: parsedEndTime || editActivity.endTime || "",
          location: editActivity.location || "",
          maxParticipants: editActivity.maxParticipants || 6,
          visibility: editActivity.visibility || "friends",
          allowAutoJoin: editActivity.allowAutoJoin || false,
        });
      } else {
        setMode("solo");
        setSoloMode("manual");
        
        setManualForm({
          title: editActivity.title || "",
          description: editActivity.description || "",
          date: isoDate,
          time: parsedTime,
          endTime: parsedEndTime || editActivity.endTime || "",
          steps: editActivity.steps || "",
          location: editActivity.location || "",
        });
      }
    }
  }, [editActivity, isOpen, defaultDate]);

  // Dynamic time options - add "Now" if selected date is today
  const timeOptions = React.useMemo(() => {
    const baseOptions = ["Morning", "Afternoon", "Evening"];
    if (isToday) {
      return ["Now", ...baseOptions];
    }
    return baseOptions;
  }, [isToday]);

  const handleGenerate = async () => {
    setError("");
    setIsLoading(true);
    try {
      // Call the Gemini AI to generate personalized suggestions
      const ideas = await generateActivitySuggestions(aiForm);
      setSuggestions(ideas);
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async (targetForm) => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Perform reverse geocoding to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'en-US,en;q=0.9',
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.address;
              
              // Build a readable location string
              let locationString = "";
              
              // Prioritize: road/street, suburb/neighborhood, city
              if (address.road) {
                locationString = address.road;
              } else if (address.pedestrian) {
                locationString = address.pedestrian;
              } else if (address.suburb) {
                locationString = address.suburb;
              } else if (address.neighbourhood) {
                locationString = address.neighbourhood;
              }
              
              // Add suburb or neighborhood if we started with a road
              if (address.road && (address.suburb || address.neighbourhood)) {
                locationString += `, ${address.suburb || address.neighbourhood}`;
              }
              
              // Add city if not already included
              const city = address.city || address.town || address.village;
              if (city && !locationString.toLowerCase().includes(city.toLowerCase())) {
                locationString = locationString ? `${locationString}, ${city}` : city;
              }
              
              // Fallback to display_name if we couldn't build a good string
              if (!locationString && data.display_name) {
                // Use first 2-3 parts of display_name
                const parts = data.display_name.split(',').slice(0, 3);
                locationString = parts.join(',').trim();
              }
              
              // Update the appropriate form with the address
              if (locationString) {
                if (targetForm === "ai") {
                  setAiForm((p) => ({ ...p, location: locationString }));
                } else if (targetForm === "manual") {
                  setManualForm((p) => ({ ...p, location: locationString }));
                } else if (targetForm === "group") {
                  setGroupForm((p) => ({ ...p, location: locationString }));
                }
              }
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error);
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsGettingLocation(false);
    }
  };

  const withContext = (suggestion) => ({
    ...suggestion,
    // Carry planner context into the consumer so persistence can include the date.
    date: suggestion.date || aiForm.date,
    time: suggestion.time || aiForm.timePreference || "TBD",
    location: suggestion.location || aiForm.location,
    topic: suggestion.topic || aiForm.topic,
  });

  const handleSoloSave = () => {
    if (soloMode === "manual" && canSubmitSoloManual) {
      if (isEditMode) {
        onUpdateActivity?.({
          ...manualForm,
          type: "solo",
        });
      } else {
        onCreateSolo?.({
          ...manualForm,
          type: "solo",
        });
      }
      // Reset form after save
      resetModal();
    }
  };

  const handleGroupSave = () => {
    if (!canSubmitGroup) return;
    if (isEditMode) {
      onUpdateActivity?.({
        ...groupForm,
        type: "group",
      });
    } else {
      onCreateGroup?.({
        ...groupForm,
        type: "group",
      });
    }
    // Reset form after save
    resetModal();
  };

  const resetModal = () => {
    setSuggestions([]);
    setError("");
    setIsLoading(false);
    setCameFromSuggestions(false);
    // Don't reset soloMode - preserve user's last selection (AI suggestion vs Manual edit)
    setManualForm({
      title: "",
      description: "",
      date: defaultDate,
      time: "",
      endTime: "",
      steps: "",
      location: "",
    });
    setAiForm({
      date: defaultDate,
      timePreference: "",
      topic: "",
      location: "",
      participantsDescription: "",
    });
    setGroupForm({
      title: "",
      description: "",
      date: defaultDate,
      time: "",
      endTime: "",
      location: "",
      maxParticipants: 6,
      visibility: "friends",
      allowAutoJoin: false,
    });
  };

  const handleClose = () => {
    // If user is in manual mode and came from AI suggestions, go back to suggestions
    if (soloMode === "manual" && cameFromSuggestions && suggestions.length > 0) {
      setSoloMode("ai");
      setCameFromSuggestions(false);
      // Clear manual form but keep suggestions
      setManualForm({
        title: "",
        description: "",
        date: defaultDate,
        time: "",
        endTime: "",
        steps: "",
        location: "",
      });
    } else {
      // Otherwise, close the modal completely
      resetModal();
      onClose?.();
    }
  };

  const handleBackToForm = () => {
    setSuggestions([]);
    setError("");
  };

  const soloForm = useMemo(
    () => (
      <>
        {!isEditMode && (
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setSoloMode("ai")}
              className={`text-xs font-bold px-3 py-2 rounded-xl border ${
                soloMode === "ai"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              AI suggestion
            </button>
            <button
              onClick={() => setSoloMode("manual")}
              className={`text-xs font-bold px-3 py-2 rounded-xl border ${
                soloMode === "manual"
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              Manual edit
            </button>
          </div>
        )}

        {soloMode === "ai" ? (
          <div className="space-y-3">
            {!suggestions.length && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </label>
                    <input
                      type="date"
                      value={aiForm.date}
                      onChange={(e) => setAiForm((p) => ({ ...p, date: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Time preference
                    </label>
                    <select
                      value={aiForm.timePreference}
                      onChange={(e) =>
                        setAiForm((p) => ({ ...p, timePreference: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                    >
                      <option value="">Choose</option>
                      {timeOptions.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Topic (optional)
                  </label>
                  <input
                    value={aiForm.topic}
                    onChange={(e) => setAiForm((p) => ({ ...p, topic: e.target.value }))}
                    placeholder="e.g., focus, stretching, social"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Location (optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={aiForm.location}
                      onChange={(e) =>
                        setAiForm((p) => ({ ...p, location: e.target.value }))
                      }
                      placeholder="Park, cafe, online"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleGetCurrentLocation("ai")}
                      disabled={isGettingLocation}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Use my current location"
                    >
                      {isGettingLocation ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <MapPin size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Description (Number of participants, preference) (optional)
                  </label>
                  <textarea
                    value={aiForm.participantsDescription}
                    onChange={(e) =>
                      setAiForm((p) => ({ ...p, participantsDescription: e.target.value }))
                    }
                    placeholder="e.g., 2-4 people, prefer quiet activities"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 min-h-[60px]"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate suggestions
                    </>
                  )}
                </button>
              </>
            )}
            {error ? (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={14} /> {error}
              </div>
            ) : null}
            {suggestions.length ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}>
                <div className="flex items-center justify-between mb-2 sticky top-0 bg-white z-10 pb-2">
                  <div className="text-xs font-bold text-slate-600">
                    {suggestions.length} suggestions
                  </div>
                  <button
                    onClick={handleBackToForm}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    ← Back to form
                  </button>
                </div>
                {suggestions.map((suggestion) => (
                  <ActivitySuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onEdit={(s) => {
                      setManualForm((prev) => ({
                        ...prev,
                        ...withContext(s),
                        time: s.time || "",
                        date: aiForm.date,
                      }));
                      setSoloMode("manual");
                      setCameFromSuggestions(true);
                      // Keep suggestions so user can go back
                    }}
                    onSave={(s) => {
                      onSaveSuggestion?.(withContext(s));
                      resetModal();
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show back button if user came from AI suggestions */}
            {cameFromSuggestions && suggestions.length > 0 && (
              <button
                onClick={() => {
                  setSoloMode("ai");
                  setCameFromSuggestions(false);
                  // Clear manual form
                  setManualForm({
                    title: "",
                    description: "",
                    date: defaultDate,
                    time: "",
                    endTime: "",
                    steps: "",
                    location: "",
                  });
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                ← Back to suggestions
              </button>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Title
              </label>
              <input
                value={manualForm.title}
                onChange={(e) =>
                  setManualForm((p) => ({ ...p, title: e.target.value }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Description (optional)
              </label>
              <textarea
                value={manualForm.description}
                onChange={(e) =>
                  setManualForm((p) => ({ ...p, description: e.target.value }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 min-h-[80px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={manualForm.date}
                onChange={(e) =>
                  setManualForm((p) => ({ ...p, date: e.target.value }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Start time
                </label>
                <input
                  type="time"
                  value={manualForm.time}
                  onChange={(e) =>
                    setManualForm((p) => ({ ...p, time: e.target.value }))
                  }
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  End time (optional)
                </label>
                <input
                  type="time"
                  value={manualForm.endTime}
                  onChange={(e) =>
                    setManualForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Steps (optional)
              </label>
              <input
                value={manualForm.steps}
                onChange={(e) =>
                  setManualForm((p) => ({ ...p, steps: e.target.value }))
                }
                placeholder="Warmup, main task, cooldown"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Location (optional)
              </label>
              <div className="flex gap-2">
                <input
                  value={manualForm.location}
                  onChange={(e) =>
                    setManualForm((p) => ({ ...p, location: e.target.value }))
                  }
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => handleGetCurrentLocation("manual")}
                  disabled={isGettingLocation}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Use my current location"
                >
                  {isGettingLocation ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <MapPin size={16} />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={handleSoloSave}
              disabled={!canSubmitSoloManual}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {isEditMode ? "Update activity" : "Save to My upcoming"}
            </button>
          </div>
        )}
      </>
    ),
    [
      aiForm,
      canSubmitSoloManual,
      isLoading,
      manualForm,
      onSaveSuggestion,
      soloMode,
      suggestions,
      timeOptions,
    ]
  );

  const groupFormView = useMemo(
    () => (
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Title
          </label>
          <input
            value={groupForm.title}
            onChange={(e) =>
              setGroupForm((p) => ({ ...p, title: e.target.value }))
            }
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={groupForm.description}
            onChange={(e) =>
              setGroupForm((p) => ({ ...p, description: e.target.value }))
            }
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 min-h-[80px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={groupForm.date}
              onChange={(e) =>
                setGroupForm((p) => ({ ...p, date: e.target.value }))
              }
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Start time
            </label>
            <input
              type="time"
              value={groupForm.time}
              onChange={(e) =>
                setGroupForm((p) => ({ ...p, time: e.target.value }))
              }
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              End time (optional)
            </label>
            <input
              type="time"
              value={groupForm.endTime}
              onChange={(e) =>
                setGroupForm((p) => ({ ...p, endTime: e.target.value }))
              }
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Location
            </label>
            <div className="flex gap-2">
              <input
                value={groupForm.location}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, location: e.target.value }))
                }
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
              />
              <button
                type="button"
                onClick={() => handleGetCurrentLocation("group")}
                disabled={isGettingLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                title="Use my current location"
              >
                {isGettingLocation ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <MapPin size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Max participants
            </label>
            <input
              type="number"
              min="1"
              value={groupForm.maxParticipants}
              onChange={(e) =>
                setGroupForm((p) => ({ ...p, maxParticipants: e.target.value }))
              }
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Visibility
            </label>
            <select
              value={groupForm.visibility}
              onChange={(e) =>
                setGroupForm((p) => ({ ...p, visibility: e.target.value }))
              }
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            >
              <option value="friends">Friends only</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
          <input
            type="checkbox"
            checked={groupForm.allowAutoJoin}
            onChange={(e) =>
              setGroupForm((p) => ({ ...p, allowAutoJoin: e.target.checked }))
            }
            className="accent-blue-600"
          />
          Allow immediate join?
        </label>
        <button
          onClick={handleGroupSave}
          disabled={!canSubmitGroup}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {isEditMode ? "Update activity" : "Create & publish"}
        </button>
      </div>
    ),
    [canSubmitGroup, groupForm]
  );

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl relative my-auto">
        {/* Header with close button */}
        <div className="p-5 md:p-6 pb-3 border-b border-slate-100">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-slate-500 bg-slate-100 rounded-full p-2 hover:bg-slate-200 z-20"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-800">
              {isEditMode ? "Edit activity" : "Plan an activity"}
            </h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-5 md:px-6 py-4">
          {!isEditMode && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  setMode("solo");
                  setSuggestions([]);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border ${
                  mode === "solo"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <User size={14} /> Private
              </button>
              <button
                onClick={() => {
                  setMode("group");
                  setSuggestions([]);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border ${
                  mode === "group"
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <Users size={14} /> Public
              </button>
            </div>
          )}

          {mode === "solo" ? soloForm : groupFormView}

          <div className="mt-4 text-[11px] text-slate-500 flex items-center gap-1">
            <AlertCircle size={12} className="text-amber-500" />
            AI suggestions powered by Gemini. Set REACT_APP_GEMINI_KEY to enable.
          </div>
        </div>
      </div>
    </div>
  );
}

