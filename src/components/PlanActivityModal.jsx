import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  Loader,
  MapPin,
  RefreshCw,
  Sparkles,
  Users,
  User,
  X,
  Lock,
  Globe,
} from "lucide-react";
import ActivitySuggestionCard from "./ActivitySuggestionCard";
import { callGemini } from "../utils/gemini";
import { parseFormattedDate, parseTimeString, parseTimeRange } from "../utils/time";

// AI-powered activity suggestion generator using Gemini API
export async function generateActivitySuggestions(inputs) {
  const { topic, location, timePreference, date, participantsDescription } = inputs;

  // Build the optimized prompt for Gemini
  const timeContext = timePreference === "Now" 
    ? `right now (current time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })})` 
    : (timePreference || "any time");

  // Helper to get the day name (e.g., "Sunday" / "Sonntag")
  const dateObj = new Date(date || new Date());
  const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'long' }); // e.g., "Sonntag"

  const systemInstruction = `You are a Smart Local Event Scout.

PRIMARY REQUIREMENT - TOPIC MATCH:
The user wants: "${topic || "general wellness"}"
YOU MUST search ONLY for events matching this topic. Do NOT suggest unrelated activities.
- If topic is "Dinner" or "Restaurant" → Search ONLY for restaurants/dining
- If topic is "Movie" → Search ONLY for cinemas/films
- If topic is "Concert" → Search ONLY for live music
- ALL 3 suggestions MUST match the topic. NO exceptions.

INPUT CONTEXT:
• User Topic: "${topic || "general wellness"}" (MOST IMPORTANT - match this!)
• User Location: "${location || "flexible location"}" (This is the USER'S starting point, NOT the venue address).
• Date: "${dayName}" (${date || "today"}).

SEARCH STRATEGY (CRITICAL):
1. ANALYZE LOCATION: If "${location || "flexible location"}" is a specific street (like "Gertrud-Grunow-Str"), search for "Cinema program in [City of this street]" or "Events near ${location || "flexible location"}". DO NOT limit search to just that street.
2. FIND VENUE ADDRESS: You MUST find the real address of the cinema/venue (e.g., "Cinema Filmtheater, Nymphenburger Str. 31").
3. NO MIRRORING: NEVER simply copy "${location || "flexible location"}" into the output 'location' field. If you can't find the real venue address, use the Venue Name + City.

LOCATION INTELLIGENCE:
- User's location is a REFERENCE POINT, not the venue location
- Search in the city/area of the user's location
- City location: Search entire city (20km radius)
- Street address: Search in that city/neighborhood (10km radius)
- Find REAL venue addresses, not the user's address

CRITICAL INSTRUCTION FOR TABLES:
Search results often show weekly schedules (Mon, Tue, Wed...).
You MUST explicitly look for the column or section matching "${dayName}" (${date || "today"}).
DO NOT use times from adjacent columns (yesterday or tomorrow).

RULES:
1. TOPIC PRIORITY: ALL suggestions MUST match "${topic || "general wellness"}". This is NON-NEGOTIABLE.
2. DIVERSITY: Try to find 3 distinct options within the same topic category.
3. ACCURATE TIMES: Only list confirmed start times for ${dayName}.
4. NO DUPLICATES: Do not list the same event twice.
5. REAL TIME CHECK: Be careful with "19:30" vs "19:00". Verify the minute exactness.

CRITICAL OUTPUT REQUIREMENT:
- Return ONLY a valid JSON array
- NO conversational text like "Okay", "Here are", "I found", etc.
- NO explanations before or after the JSON
- Start your response with [ and end with ]
- If you cannot find valid events, return an empty array: []

OUTPUT FORMAT (JSON Array):
[
  {
    "title": "Exact Event Title",
    "description": "Short, engaging description. Mention confirmed time.",
    "time": "HH:MM",
    "duration": "e.g. 120m",
    "location": "REAL Venue Name, REAL Street Address, City",
    "eventUrl": null
  }
]`;

  const userPrompt = `CRITICAL: Find ONLY "${topic || "general wellness"}" events for:
• PRIMARY TOPIC: "${topic || "general wellness"}" (MUST MATCH - search ONLY for this type of event)
• Date: ${date || "today"} (${dayName})
• Location: ${location || "flexible location"}
• Time Preference: ${timeContext}

REMINDER: Do NOT mix different activity types. If user wants "Dinner", return ONLY restaurants. If user wants "Movie", return ONLY cinemas.`;

  const prompt = `${systemInstruction}

${userPrompt}`;

  try {
    const response = await callGemini(prompt);

    if (!response) {
      console.warn("Gemini API returned null, using fallback suggestions");
      return getFallbackSuggestions(inputs);
    }

    // Clean the response - aggressively remove any markdown code blocks and conversational text
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/g, "").replace(/\s*```$/g, "");
    
    // Remove any conversational text before the JSON array
    // Find the first [ and last ] to extract only the JSON array
    const firstBracket = cleanedResponse.indexOf('[');
    const lastBracket = cleanedResponse.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanedResponse = cleanedResponse.substring(firstBracket, lastBracket + 1);
    }
    
    // Remove any leading/trailing whitespace again after stripping
    cleanedResponse = cleanedResponse.trim();

    // Parse the JSON response
    const suggestions = JSON.parse(cleanedResponse);

    // Validate and format the suggestions
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      // Post-processing: Generate Fail-Safe URLs with Date
      // We do NOT trust the AI's direct link for booking, as deep links often fail (404 errors)
      // Instead, we construct a precise Google Search query using high-quality data from AI
      return suggestions.slice(0, 3).map((sug, index) => {
        const suggestionLocation = sug.location || location || "Your preferred location";
        
        // Fail-Safe URL Strategy:
        // We construct a query that lands the user on the Daily Schedule page.
        // We include the DATE to ensure the search results are for the right day.
        // We exclude the TIME to prevent "zero results" if the formatting differs (e.g. "20:15" vs "8:15 PM").
        // Query format: "Avatar Munich 2025-12-21 tickets showtimes"
        const queryParts = [
          sug.title || "Suggested Activity",
          suggestionLocation, // Contains Venue + City
          date || new Date().toISOString().split('T')[0], // CRITICAL: Add the specific date
          "tickets",
          "showtimes"
        ];
        
        // Join and clean
        const query = queryParts.filter(Boolean).join(" ");
        const safeLink = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        
        return {
          id: `ai-${Date.now()}-${index + 1}`,
          title: sug.title || "Suggested Activity",
          description: sug.description || "No description provided",
          time: sug.time || getDefaultTime(timePreference, index),
          location: suggestionLocation,
          topic: topic || "General wellness",
          duration: sug.duration || "30-60m",
          eventUrl: safeLink, // ALWAYS use our 100% working Google Search link with DATE
        };
      });
    } else {
      console.warn("Invalid suggestions format from Gemini, using fallback");
      return getFallbackSuggestions(inputs);
    }
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return getFallbackSuggestions(inputs);
  }
}

// Helper function to generate useful search/booking URLs based on activity details
function generateSmartUrl(suggestion, userLocation) {
  const title = suggestion.title || "";
  const location = suggestion.location || userLocation || "";
  const description = suggestion.description || "";
  
  // Detect activity type and generate appropriate URL
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Movie/Cinema detection
  if (titleLower.includes('watch') || titleLower.includes('movie') || titleLower.includes('film') || 
      titleLower.includes('cinema') || titleLower.includes('kino') ||
      descLower.includes('cinema') || descLower.includes('screening') || descLower.includes('kino')) {
    
    // Extract movie title if in quotes or after "Watch"
    let movieTitle = "";
    const quoteMatch = title.match(/['"]([^'"]+)['"]/);
    if (quoteMatch) {
      movieTitle = quoteMatch[1];
    } else {
      const watchMatch = title.match(/watch\s+(.+?)(?:\s+at|\s+in|$)/i);
      if (watchMatch) {
        movieTitle = watchMatch[1];
      }
    }
    
    if (movieTitle) {
      // Google search for movie showtimes in the specific location
      const searchQuery = `${movieTitle} showtimes ${location}`;
      return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    }
  }
  
  // Concert/Music detection
  if (titleLower.includes('concert') || titleLower.includes('music') || titleLower.includes('live') ||
      descLower.includes('concert') || descLower.includes('performance') || descLower.includes('band')) {
    const searchQuery = `${title} ${location} tickets`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }
  
  // Theater/Show detection
  if (titleLower.includes('theater') || titleLower.includes('theatre') || titleLower.includes('play') ||
      titleLower.includes('show') || descLower.includes('theater') || descLower.includes('stage')) {
    const searchQuery = `${title} ${location} tickets`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }
  
  // Exhibition/Museum detection
  if (titleLower.includes('exhibition') || titleLower.includes('museum') || titleLower.includes('gallery') ||
      titleLower.includes('ausstellung') || descLower.includes('exhibition') || descLower.includes('museum')) {
    const searchQuery = `${title} ${location}`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }
  
  // Workshop/Class detection
  if (titleLower.includes('workshop') || titleLower.includes('class') || titleLower.includes('course') ||
      titleLower.includes('lesson') || descLower.includes('workshop') || descLower.includes('learn')) {
    // Try Eventbrite first for workshops
    const searchQuery = `${title} ${location}`;
    return `https://www.eventbrite.com/d/${encodeURIComponent(location)}/${encodeURIComponent(title)}/`;
  }
  
  // Meetup/Social event detection
  if (titleLower.includes('meetup') || titleLower.includes('meet') || titleLower.includes('social') ||
      descLower.includes('meetup') || descLower.includes('gathering') || descLower.includes('group')) {
    const searchQuery = `${title} ${location}`;
    return `https://www.meetup.com/find/?keywords=${encodeURIComponent(searchQuery)}`;
  }
  
  // Restaurant/Dining detection
  if (titleLower.includes('restaurant') || titleLower.includes('dinner') || titleLower.includes('lunch') ||
      titleLower.includes('cafe') || titleLower.includes('dining') || descLower.includes('restaurant')) {
    // Extract restaurant name if possible
    const venueMatch = title.match(/at\s+(.+?)(?:\s+in|$)/i);
    const venueName = venueMatch ? venueMatch[1] : title;
    const searchQuery = `${venueName} ${location}`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }
  
  // Default: Google search for the activity
  const searchQuery = `${title} ${location}`;
  return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
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

  const suggestions = [
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

  // Add fail-safe URLs to fallback suggestions with date
  return suggestions.map(sug => {
    const queryParts = [
      sug.title,
      sug.location,
      inputs.date || new Date().toISOString().split('T')[0], // Include date
      "tickets",
      "showtimes"
    ];
    const query = queryParts.filter(Boolean).join(" ");
    const safeLink = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    return {
      ...sug,
      eventUrl: safeLink,
    };
  });
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
  // Unified state management
  const [mode, setMode] = useState("ai"); // 'ai' | 'manual'
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: defaultDate,
    time: "",
    endTime: "",
    location: "",
    visibility: "private", // 'private' | 'friends' | 'public'
    maxParticipants: 6,
    allowAutoJoin: false,
    steps: "",
  });
  
  // AI suggestion form inputs
  const [aiForm, setAiForm] = useState({
    date: defaultDate,
    timePreference: "",
    topic: "",
    location: "",
    participantsDescription: "",
  });
  
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const isEditMode = !!editActivity;
  const canSubmit = formData.title && formData.date && formData.time;

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

      // Determine visibility based on activity properties
      let visibility = "private";
      if (editActivity.visibility === "public") {
        visibility = "public";
      } else if (editActivity.visibility === "friends" || editActivity.maxParticipants > 1) {
        visibility = "friends";
      }

      // Always switch to manual mode for editing
      setMode("manual");
      setFormData({
        title: editActivity.title || "",
        description: editActivity.description || "",
        date: isoDate,
        time: parsedTime,
        endTime: parsedEndTime || editActivity.endTime || "",
        location: editActivity.location || "",
        visibility: visibility,
        maxParticipants: editActivity.maxParticipants || 6,
        allowAutoJoin: editActivity.allowAutoJoin || false,
        steps: editActivity.steps || "",
      });
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
                } else if (targetForm === "unified") {
                  setFormData((p) => ({ ...p, location: locationString }));
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

  const handleSave = () => {
    if (!canSubmit) return;
    
    const activityData = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      endTime: formData.endTime,
      location: formData.location,
      steps: formData.steps,
    };

    if (isEditMode) {
      // Update existing activity
      onUpdateActivity?.({
        ...activityData,
        visibility: formData.visibility,
        maxParticipants: formData.visibility === "private" ? 1 : formData.maxParticipants,
        allowAutoJoin: formData.visibility === "private" ? false : formData.allowAutoJoin,
        type: formData.visibility === "private" ? "solo" : "group",
      });
      // Reset after update
      resetModal();
    } else {
      // Create new activity
      if (formData.visibility === "private") {
        onCreateSolo?.({
          ...activityData,
          type: "solo",
        });
        // onCreateSolo handles modal closing via onComplete callback
      } else {
        onCreateGroup?.({
          ...activityData,
          visibility: formData.visibility,
          maxParticipants: formData.maxParticipants,
          allowAutoJoin: formData.allowAutoJoin,
          type: "group",
        });
        // onCreateGroup (addGroupActivity) handles modal closing internally
      }
    }
  };

  const resetModal = () => {
    setSuggestions([]);
    setError("");
    setIsLoading(false);
    // Don't reset mode - preserve user's last selection (AI vs Manual)
    setFormData({
      title: "",
      description: "",
      date: defaultDate,
      time: "",
      endTime: "",
      location: "",
      visibility: "private",
      maxParticipants: 6,
      allowAutoJoin: false,
      steps: "",
    });
    setAiForm({
      date: defaultDate,
      timePreference: "",
      topic: "",
      location: "",
      participantsDescription: "",
    });
  };

  const handleClose = () => {
    // If user is in manual mode and has suggestions, go back to AI view
    if (mode === "manual" && suggestions.length > 0) {
      setMode("ai");
      // Clear form but keep suggestions
      setFormData({
        title: "",
        description: "",
        date: defaultDate,
        time: "",
        endTime: "",
        location: "",
        visibility: "private",
        maxParticipants: 6,
        allowAutoJoin: false,
        steps: "",
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

  const aiSuggestionView = (
      <>
        {!isEditMode && (
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Generate new suggestions with the same inputs"
                    >
                      <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> 
                      {isLoading ? "Regenerating..." : "Regenerate"}
                    </button>
                    <button
                      onClick={handleBackToForm}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      ← Back to form
                    </button>
                  </div>
                </div>
                {suggestions.map((suggestion) => (
                  <ActivitySuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onEdit={(s) => {
                      const contextualSuggestion = withContext(s);
                      setFormData((prev) => ({
                        ...prev,
                        title: contextualSuggestion.title || "",
                        description: contextualSuggestion.description || "",
                        time: contextualSuggestion.time || "",
                        date: contextualSuggestion.date || aiForm.date,
                        location: contextualSuggestion.location || "",
                        steps: "",
                        endTime: "",
                      }));
                      setMode("manual");
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
        )}
      </>
    );

  const manualFormView = (
      <div className="space-y-3">
        {/* Show back button if user came from AI suggestions */}
        {suggestions.length > 0 && (
          <button
            onClick={() => {
              setMode("ai");
              // Clear form but keep suggestions
              setFormData({
                title: "",
                description: "",
                date: defaultDate,
                time: "",
                endTime: "",
                location: "",
                visibility: "private",
                maxParticipants: 6,
                allowAutoJoin: false,
                steps: "",
              });
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Back to suggestions
          </button>
        )}
        
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Title
          </label>
          <input
            value={formData.title}
            onChange={(e) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
          />
        </div>

        {/* Visibility Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Visibility
          </label>
          <select
            value={formData.visibility}
            onChange={(e) =>
              setFormData((p) => ({ ...p, visibility: e.target.value }))
            }
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
          >
            <option value="private">🔒 Private (Default)</option>
            <option value="friends">👥 Friends</option>
            <option value="public">🌐 Public</option>
          </select>
        </div>

        {/* Date & Time Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((p) => ({ ...p, date: e.target.value }))
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
              value={formData.time}
              onChange={(e) =>
                setFormData((p) => ({ ...p, time: e.target.value }))
              }
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              End time
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData((p) => ({ ...p, endTime: e.target.value }))
              }
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Location (optional)
          </label>
          <div className="flex gap-2">
            <input
              value={formData.location}
              onChange={(e) =>
                setFormData((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="Address or venue name"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
            <button
              type="button"
              onClick={() => handleGetCurrentLocation("unified")}
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

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 min-h-[80px]"
          />
        </div>

        {/* Steps (only for private activities) */}
        {formData.visibility === "private" && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Steps (optional)
            </label>
            <input
              value={formData.steps}
              onChange={(e) =>
                setFormData((p) => ({ ...p, steps: e.target.value }))
              }
              placeholder="Warmup, main task, cooldown"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
            />
          </div>
        )}

        {/* Capacity Section - Only show if NOT private */}
        {formData.visibility !== "private" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Max participants
              </label>
              <input
                type="number"
                min="2"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, maxParticipants: parseInt(e.target.value) || 6 }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={formData.allowAutoJoin}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, allowAutoJoin: e.target.checked }))
                }
                className="accent-blue-600"
              />
              Allow immediate join?
            </label>
          </>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSave}
          disabled={!canSubmit}
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {isEditMode ? "Update activity" : (formData.visibility === "private" ? "Save to My upcoming" : "Create & publish")}
        </button>
      </div>
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
          {/* Mode Toggle: AI Suggestion vs Manual Entry */}
          {!isEditMode && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setMode("ai");
                  setSuggestions([]);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border ${
                  mode === "ai"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Sparkles size={16} /> AI Suggestion
              </button>
              <button
                onClick={() => {
                  setMode("manual");
                  setSuggestions([]);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border ${
                  mode === "manual"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                📝 Manual Entry
              </button>
            </div>
          )}

          {/* Render appropriate view based on mode */}
          {mode === "ai" ? aiSuggestionView : manualFormView}
        </div>
      </div>
    </div>
  );
}

