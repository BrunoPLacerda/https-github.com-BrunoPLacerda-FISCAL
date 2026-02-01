
import { GoogleGenAI } from "@google/genai";
import { SummaryStats } from "./types";

export const getFiscalAnalysis = async (stats: SummaryStats): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const prompt = `
      Analise os seguintes dados consolidados de faturamento e impostos (ISS):
      - Total de Serviços (Bruto): R$ ${stats.totalServicos.toLocaleString('pt-BR')}
      - Total de Deduções: R$ ${stats.totalDeducoes.toLocaleString('pt-BR')}
      - Total de ISS Apurado: R$ ${stats.totalIss.toLocaleString('pt-BR')}
      - Serviços Dentro de Campos (3301009): R$ ${stats.dentroServicos.toLocaleString('pt-BR')}
      - Serviços Fora de Campos: R$ ${stats.foraServicos.toLocaleString('pt-BR')}
      - Quantidade de Notas Válidas: ${stats.count - stats.cancelledCount}

      Crie um resumo executivo profissional. Comente sobre o peso das deduções em relação ao faturamento bruto e se a carga tributária de ISS está condizente com a média (geralmente entre 2% e 5%).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor tributário especializado em legislação municipal e NFSe.",
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao processar análise inteligente.";
  }
};
