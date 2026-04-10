
const { sql } = require('./db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { usuario_id, cpf } = req.query;

  if (!usuario_id && !cpf) {
    return res.status(400).json({ error: 'usuario_id ou cpf é necessário' });
  }

  try {
    // Buscar exames reais do usuário
    // A tabela no Neon parece ser 'exams' baseado no PatientDashboard.tsx
    const cleanCPF = (cpf || '').replace(/\D/g, '');
    let query = 'SELECT * FROM exams WHERE patient_cpf = $1 OR patient_id = $2 ORDER BY date DESC';
    const exams = await sql(query, [cleanCPF, usuario_id]);

    // Mapeamento de exames para órgãos conforme solicitado
    const examToOrgan = {
      'TGO': 'figado',
      'TGP': 'figado',
      'HEMOGRAMA': 'cerebro',
      'CREATININA': 'rins',
      'GLICOSE': 'pancreas', // Adicionando alguns extras para ficar premium
      'COLESTEROL': 'coracao'
    };

    const mappedResults = [];

    exams.forEach(exam => {
      const nameUpper = (exam.exam_name || '').toUpperCase();
      let orgao = null;

      // Tenta encontrar o órgão correspondente
      for (const [key, value] of Object.entries(examToOrgan)) {
        if (nameUpper.includes(key)) {
          orgao = value;
          break;
        }
      }

      if (orgao) {
        // Lógica de status simplificada baseada no resultData ou status do banco
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
      }
    });

    // Se não houver exames mapeados, vamos retornar alguns exemplos simulados se o usuário for novo
    // para não deixar o 3D vazio na primeira visualização (opcional, mas melhora UX)
    /*
    if (mappedResults.length === 0) {
        mappedResults.push(
            { id: 'sim-1', exame_nome: 'Hemograma (Simulado)', orgao: 'cerebro', status: 'normal', data: '10/04/2026', valor: 'Normal' },
            { id: 'sim-2', exame_nome: 'TGO/TGP (Simulado)', orgao: 'figado', status: 'alerta', data: '10/04/2026', valor: 'Levemente Alterado' }
        );
    }
    */

    return res.status(200).json(mappedResults);

  } catch (error) {
    console.error('Erro na API Saude3D:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
