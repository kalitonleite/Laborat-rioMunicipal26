
import { Groq } from 'groq-sdk';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userId, history = [] } = req.body;

  try {
    // Fetch User Data from Neon
    const userQuery = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);
    const user = userQuery.rows[0];

    // Fetch Exam Data from Neon
    const examsQuery = await pool.query('SELECT * FROM exam_results WHERE patient_id = $1 ORDER BY date DESC LIMIT 5', [userId]);
    const exams = examsQuery.rows;

    const examContext = exams.length > 0 
      ? exams.map(e => `- ${e.exam_name} (${e.date}): ${e.result_data || 'Pendente'} (Status: ${e.status})`).join('\n')
      : 'Nenhum exame recente encontrado.';

    const systemPrompt = `
      Você é o Dr. IA, um médico assistente inteligente do Laboratório Municipal de Uarini.
      Objetivo: Ajudar o paciente a entender seus exames e responder dúvidas de saúde de forma acolhedora, profissional e clara.

      Contexto do Paciente:
      Nome: ${user?.name || 'Paciente'}
      Idade: ${user?.age || 'Não informada'}
      CPF: ${user?.cpf || 'Não informado'}

      Exames Recentes:
      ${examContext}

      Regras de Interpretação:
      1. Se o valor estiver "VALOR_NORMAL" ou dentro da referência, diga: "Seu exame está dentro do normal."
      2. Se for "VALOR_ALTO", diga: "Este valor está acima do ideal. Consulte um médico."
      3. Se for "VALOR_BAIXO", diga: "Este valor está abaixo do esperado."
      
      IMPORTANTE:
      - Sempre inclua a frase: "Este resultado deve ser avaliado por um profissional de saúde."
      - Seja conciso mas empático.
      - Use o dialeto regional (Amazonas/Uarini) se apropriado, mas mantenha o profissionalismo.
      - Se o usuário perguntar algo não relacionado a saúde ou ao laboratório, responda gentilmente que seu foco é assistência laboratorial.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Groq/Neon Error:', err);
    res.status(500).json({ error: 'Erro ao processar sua solicitação.' });
  }
}
