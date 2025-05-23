const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function generateFact(factInput) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Generate a concise investment fact about "${factInput}". If "${factInput}" is not directly investment-related, provide a general, useful investment fact instead. Deliver only the fact itself, with no extra text or explanation.`,
  });
  return response.text;
}

async function generateSuggestions() {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Return a mock investment suggestion 3-5 lines only, please do not include any extra text or explanation.",
    });
    return response.text;
}

module.exports = {
    generateFact,
    generateSuggestions
};
