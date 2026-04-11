const { Groq } = require('groq-sdk');
const { sql } = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pergunta, exame_id, usuario_id, history = [] } = req.body;

  // Autenticação (opcional mas recomendado)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error('JWT Verify Error in chat-exame:', err.message);
    }
  }

  try {
    let contextMessage = "O usuário está visualizando seu painel de saúde 3D.";
    
    if (exame_id) {
      let exam = null;
      try {
        const result = await sql.query('SELECT * FROM exams WHERE id = $1', [exame_id]);
        const rows = Array.isArray(result) ? result : (result.rows || []);
        if (rows.length > 0) exam = rows[0];
      } catch (e1) {
        try {
          const result2 = await sql.query('SELECT * FROM exam_results WHERE id = $1', [exame_id]);
          const rows2 = Array.isArray(result2) ? result2 : (result2.rows || []);
          if (rows2.length > 0) exam = rows2[0];
        } catch (e2) {
          console.error('Erro ao buscar exame em ambas as tabelas:', e2.message);
        }
      }

      if (exam) {
        contextMessage = `O usuário está perguntando especificamente sobre o exame ${exam.exam_name} realizado em ${exam.date}. Resultado: ${exam.result_data || 'Não informado'}.`;
      }
    }

    const systemPrompt = `
      Você é o Assistente Bio3D do Laboratório Municipal de Uarini.
      Seu objetivo é explicar exames laboratoriais de forma simples, didática e acolhedora.
      
      REGRAS CRÍTICAS:
      1. NÃO forneça diagnósticos.
      2. SEMPRE oriente o paciente a consultar um médico para avaliação definitiva.
      3. Explique os termos técnicos (ex: o que é Creatinina, o que o Fígado faz).
      4. Use uma linguagem que uma criança de 10 anos entenderia.
      5. Seja empático.
      
      Contexto Atual:
      ${contextMessage}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: pergunta }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.6,
      max_tokens: 800,
    });

    const reply = chatCompletion.choices[0].message.content;
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Erro na API Chat-Exame:', error);
    return res.status(500).json({ error: 'Desculpe, não consegui processar sua pergunta agora: ' + error.message });
  }
};
