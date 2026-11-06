const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

const GEMINI_MODEL = 'gemini-1.5-flash';

const OCR_SYSTEM_PROMPT = `Você é um sistema OCR especializado em resultados laboratoriais clínicos.

SUA TAREFA: Analisar a imagem enviada (foto ou digitalização de resultado de exame laboratorial) e extrair TODOS os dados visíveis, estruturando-os em JSON.

REGRAS CRÍTICAS:
1. NUNCA invente valores, unidades ou referências. Se algo não estiver visível ou legível, omita o campo ou marque confiança baixa.
2. NUNCA substitua valores ilegíveis por estimativas.
3. Extraia: nome do exame, cada campo (analito), valor, unidade de medida, valor de referência (quando impresso no documento).
4. Identifique o tipo de exame (hemograma, glicemia, colesterol, ureia, creatinina, etc.).
5. Para cada campo extraído, informe um nível de confiança (0.0 a 1.0).
6. Responda APENAS em JSON válido, sem texto adicional.

FORMATO DE RESPOSTA:
{
  "tipo_exame": "nome do exame ou null",
  "paciente_nome": "nome do paciente se visível ou null",
  "paciente_idade": "idade se visível ou null",
  "paciente_sexo": "sexo se visível ou null",
  "data_exame": "data do exame se visível ou null",
  "laboratorio": "nome do laboratório se visível ou null",
  "campos": [
    {
      "nome": "nome do analito/exame",
      "valor": "valor numérico ou texto",
      "unidade": "unidade de medida",
      "referencia": "valor de referência impresso ou null",
      "confianca": 0.0 a 1.0
    }
  ],
  "texto_completo": "transcrição completa do texto visível",
  "confianca_geral": 0.0 a 1.0,
  "observacoes": "campos ilegíveis ou problemas encontrados"
}`;

async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
}

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authorized = await verifyToken(req);
  if (!authorized) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
  }

  try {
    let body;
    if (req.body && Object.keys(req.body).length > 0) {
      body = req.body;
    } else {
      body = JSON.parse(await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      }));
    }

    const { imageDataUrl, mimeType } = body;

    if (!imageDataUrl) {
      return res.status(400).json({ error: 'imageDataUrl é obrigatório.' });
    }

    // Extract base64 from data URL
    const base64Match = imageDataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!base64Match) {
      return res.status(400).json({ error: 'Formato de imageDataUrl inválido.' });
    }

    const imageBase64 = base64Match[2];

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: imageBase64
                  }
                },
                {
                  text: OCR_SYSTEM_PROMPT
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return res.status(500).json({ error: 'Erro na API Gemini: ' + errorText });
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let parsedResult;
    try {
      parsedResult = JSON.parse(textContent);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || textContent.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Não foi possível extrair JSON da resposta da IA.');
      }
    }

    return res.status(200).json({
      success: true,
      extracted: parsedResult
    });

  } catch (err) {
    console.error('OCR Error:', err);
    return res.status(500).json({ error: 'Erro no processamento OCR: ' + err.message });
  }
};

module.exports = handler;
