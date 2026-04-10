require('dotenv').config();
const { sql } = require('./api/db.js');

async function testSaude3dAPI(cpf, usuario_id) {
  const cleanCPF = (cpf || '').replace(/\D/g, '');
  console.log('Consultando CPF:', cleanCPF);
  
  const result = await sql.query(
    'SELECT * FROM exams WHERE patient_cpf = $1 ORDER BY date DESC',
    [cleanCPF]
  );
  const rows = result.rows || result;
  console.log(`\nExames encontrados: ${rows.length}`);

  const examToOrgan = {
    'TGO': 'figado',
    'TGP': 'figado',
    'AST': 'figado',
    'ALT': 'figado',
    'HEMOGRAMA': 'cerebro',
    'SANGUE': 'cerebro',
    'CREATININA': 'rins',
    'UREIA': 'rins',
    'GLICOSE': 'pancreas',
    'GLICEMIA': 'pancreas',
    'COLESTEROL': 'coracao',
    'TRIGLICERI': 'coracao',
    'BIOQUIMICA': 'corpo'
  };

  const mappedResults = [];
  rows.forEach(exam => {
    const nameUpper = (exam.exam_name || '').toUpperCase();
    let orgao = null;
    for (const [key, value] of Object.entries(examToOrgan)) {
      if (nameUpper.includes(key)) { orgao = value; break; }
    }
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
      orgao,
      status,
      data: exam.date,
      valor: exam.result_data ? exam.result_data.substring(0, 80) + '...' : 'Pendente',
      file_url: exam.file_url ? 'TEM PDF' : null
    });
  });

  console.log('\n--- Resultado da API saude3d ---');
  mappedResults.forEach(r => console.log(r));
}

testSaude3dAPI('81119119200', 'xxx').catch(console.error);
