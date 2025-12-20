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

export const callGemini = async (prompt, options = {}) => {
  const token = API_KEY;

  if (!token || token.trim() === "") {
    console.warn(
      "Gemini Call Skipped: No API Key found in environment variables (REACT_APP_GEMINI_KEY)."
    );
    return null;
  }

  // Enable Google Search by default for real-time information
  const enableGrounding = options.enableGrounding !== false;

  try {
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, // Extremely low to prevent hallucination and ensure factuality
      },
    };

    // Add Google Search tool if enabled
    if (enableGrounding) {
      requestBody.tools = [
        {
          googleSearch: {}
        },
      ];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return null;
    }
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

