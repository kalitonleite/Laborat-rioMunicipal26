
import { GoogleGenAI } from "@google/genai";

// Standard initialization for the Gemini API.
// Always use the process.env.API_KEY directly in the constructor.

export const analyzeLabResult = async (resultText: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o seguinte resultado de exame laboratorial e forneça uma explicação simples para o paciente, destacando se há valores fora do comum e o que eles podem significar de forma geral (sempre recomendando consulta médica): ${resultText}`,
      config: {
        systemInstruction: "Você é um assistente médico especializado em explicar resultados laboratoriais de forma didática e cautelosa. Responda sempre em Português do Brasil.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Não foi possível analisar o resultado no momento.";
  }
};

export const suggestMedicalDiagnosis = async (resultText: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Baseado nestes resultados laboratoriais, sugira possíveis diagnósticos diferenciais e próximos exames confirmatórios para o médico revisar: ${resultText}`,
      config: {
        systemInstruction: "Você é um consultor médico sênior auxiliando outros profissionais de saúde. Responda sempre em Português do Brasil e use termos técnicos apropriados.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Medical Help Error:", error);
    return "Erro ao gerar sugestão médica.";
  }
};
