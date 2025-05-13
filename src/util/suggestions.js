const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function generatePun() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Return a funny pun about investments, answer the pun only, no additional text.",
  });
  return response.text;
}

async function generateSuggestions() {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Return a mock investment suggestion 3-5 lines only",
    });
    return response.text;
}

module.exports = {
    generatePun,
    generateSuggestions
};
