// Gemini API helper is isolated here to keep App.js lighter
let API_KEY = "";
try {
  API_KEY = process.env.REACT_APP_GEMINI_KEY;
} catch (e) {
  // process may be undefined in some environments; ignore.
}

// Expose the key so consumers can safely check availability instead of
// referencing an undefined global in the UI layer.
export const GEMINI_API_KEY = API_KEY;

export const callGemini = async (prompt) => {
  const token = API_KEY;

  if (!token || token.trim() === "") {
    console.warn(
      "Gemini Call Skipped: No API Key found in environment variables (REACT_APP_GEMINI_KEY)."
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

