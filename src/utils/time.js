// Time helpers shared across the intervention flows
export const timeToMins = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const minsToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export const addMinutes = (time, mins) => minsToTime(timeToMins(time) + mins);

export const formatSeconds = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatQuickTaskDuration = (minutes, { long = false } = {}) => {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    const suffix = seconds === 1 ? "" : "s";
    return long ? `${seconds} second${suffix}` : `${seconds}s`;
  }
  return long ? `${minutes} min` : `${minutes}m`;
};

/**
 * Parses a formatted date string (e.g., "Mon, Nov 18") to ISO format (YYYY-MM-DD).
 * If the date is already in ISO format, returns it as is.
 * Handles year inference for dates that may be in the next year.
 *
 * @param {string} dateStr - The date string to parse
 * @param {string} defaultDate - The default date to return if parsing fails
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const parseFormattedDate = (dateStr, defaultDate = "") => {
  if (!dateStr) return defaultDate;

  // If already in ISO format, return as is
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  try {
    // Try to parse formatted date like "Mon, Nov 18" or "Sat, Dec 13"
    // We need to add a year to make it parseable
    const currentYear = new Date().getFullYear();
    const dateWithYear = `${dateStr}, ${currentYear}`;
    let parsed = new Date(dateWithYear);

    // If the parsed date is more than 30 days in the past, assume it's for next year
    // This handles cases where the activity is scheduled for next year
    const now = new Date();
    const daysDiff = (parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < -30) {
      parsed = new Date(`${dateStr}, ${currentYear + 1}`);
    }

    // Check if parsing was successful
    if (!isNaN(parsed.getTime())) {
      // Format as YYYY-MM-DD
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (err) {
    console.error("Error parsing date:", err);
  }

  return defaultDate;
};

/**
 * Parses a time string (e.g., "9:30 AM" or "09:30 AM") to HH:MM format (24-hour).
 * Supports both 12-hour format with AM/PM and 24-hour format.
 *
 * @param {string} timeStr - The time string to parse
 * @returns {string} Time in HH:MM format (24-hour), or empty string if parsing fails
 */
export const parseTimeString = (timeStr) => {
  if (!timeStr) return "";

  // Trim whitespace
  timeStr = timeStr.trim();

  // If already in HH:MM format (24-hour with 2-digit hours), return as is
  if (timeStr.match(/^\d{2}:\d{2}$/)) {
    return timeStr;
  }

  try {
    // Match patterns like "9:30 AM", "09:30 AM", "9:30AM", etc.
    // Also handle ranges like "9:30 AM - 11:00 AM"
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = timeStr.match(timePattern);

    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3].toUpperCase();

      // Convert to 24-hour format
      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      // Format as HH:MM
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }

    // Try to match 24-hour format patterns like "19:30" or "9:30" (without AM/PM)
    const hour24Match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (hour24Match) {
      const hours = parseInt(hour24Match[1], 10);
      const minutes = hour24Match[2];
      // Ensure hours are valid (0-23)
      if (hours >= 0 && hours <= 23) {
        return `${String(hours).padStart(2, "0")}:${minutes}`;
      }
    }
  } catch (err) {
    console.error("Error parsing time:", err);
  }

  return "";
};

/**
 * Parses a time range string (e.g., "9:30 AM - 11:00 AM") and extracts start and end times.
 * If no range is found, returns only the start time.
 *
 * @param {string} timeStr - The time range string to parse
 * @returns {Object} Object with start and end times in HH:MM format: { start: string, end: string }
 */
export const parseTimeRange = (timeStr) => {
  if (!timeStr) return { start: "", end: "" };

  // Check if it's a range (contains " - ")
  const rangeMatch = timeStr.match(/(.+?)\s*-\s*(.+)/);

  if (rangeMatch) {
    const startTime = parseTimeString(rangeMatch[1].trim());
    const endTime = parseTimeString(rangeMatch[2].trim());
    return { start: startTime, end: endTime };
  }

  // Single time value
  const startTime = parseTimeString(timeStr);
  return { start: startTime, end: "" };
};

