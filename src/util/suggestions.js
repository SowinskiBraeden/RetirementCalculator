const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function generateFact(factInput) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Generate a concise investment fact about "${factInput}". If "${factInput}" is not directly investment-related, provide a general, useful investment fact instead. Deliver only the fact itself, with no extra text or explanation.`,
  });
  return response.text;
}

async function generateSuggestions(totalUserAssetValue, plan) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Return an investment suggestion 3-5 based on the user's total asset value and their plan. Please do not include any extra text or explanation.
      
      Total User Asset Value: ${totalUserAssetValue}
      
      Plan: ${plan}`,
    });
    return response.text;
}

module.exports = {
    generateFact,
    generateSuggestions
};
