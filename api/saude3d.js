
const { sql } = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { usuario_id, cpf } = req.query;

  // Autenticação (opcional mas recomendado)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error('JWT Verify Error in saude3d:', err.message);
      // Podemos prosseguir se quisermos ser menos rígidos na leitura, 
      // mas vamos registrar o erro.
    }
  }

  if (!usuario_id && !cpf) {
    return res.status(400).json({ error: 'usuario_id ou cpf é necessário' });
  }

  try {
    const cleanCPF = (cpf || '').replace(/\D/g, '');
    
    // Tentar buscar na tabela 'exams' (usada no PatientDashboard)
    // Se falhar, tentar 'exam_results' (usada no chat.js)
    let rows = [];
    try {
        const result = await sql.query(
            'SELECT * FROM exams WHERE patient_cpf = $1 OR patient_id = $2 ORDER BY date DESC',
            [cleanCPF, usuario_id]
        );
        rows = Array.isArray(result) ? result : (result.rows || []);
    } catch (e1) {
        console.warn('Tentativa em "exams" falhou, tentando "exam_results":', e1.message);
        try {
            const result2 = await sql.query(
                'SELECT * FROM exam_results WHERE patient_cpf = $1 OR patient_id = $2 ORDER BY date DESC',
                [cleanCPF, usuario_id]
            );
            rows = Array.isArray(result2) ? result2 : (result2.rows || []);
        } catch (e2) {
            console.error('Erro em ambas as tabelas:', e2.message);
            throw e2;
        }
    }

    const examToOrgan = {
      'TGO': 'figado',
      'TGP': 'figado',
      'HEMOGRAMA': 'cerebro',
      'CREATININA': 'rins',
      'GLICOSE': 'pancreas',
      'COLESTEROL': 'coracao'
    };

    const mappedResults = [];

    rows.forEach(exam => {
      const nameUpper = (exam.exam_name || '').toUpperCase();
      let orgao = null;

      for (const [key, value] of Object.entries(examToOrgan)) {
        if (nameUpper.includes(key)) {
          orgao = value;
          break;
        }
      }

      // Default para caso não mapeado
      orgao = orgao || 'corpo';

      let status = 'normal';
      const resultText = (exam.result_data || '').toUpperCase();
      
      if (resultText.includes('CRITICO') || resultText.includes('MUITO ALTO') || resultText.includes('MUITO BAIXO')) {
        status = 'critico';
      } else if (resultText.includes('ALTERADO') || resultText.includes('ALERTA') || resultText.includes('ALTO') || resultText.includes('BAIXO')) {
        status = 'alerta';
      }

      mappedResults.push({
        id: exam.id,
        exame_nome: exam.exam_name,
        orgao: orgao,
        status: status,
        data: exam.date,
        valor: exam.result_data || 'Pendente'
      });
    });

    return res.status(200).json(mappedResults);

  } catch (error) {
    console.error('Erro detalhado na API Saude3D:', error);
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
};
