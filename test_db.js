require('dotenv').config();
const { sql } = require('./api/db.js');

(async () => {
  try {
    // Check tables
    const tables = await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const rows = tables.rows || tables;
    console.log('Tables:', rows.map(r => r.table_name));

    // Check exams table columns
    const cols = await sql.query("SELECT column_name FROM information_schema.columns WHERE table_name='exams'");
    const colRows = cols.rows || cols;
    console.log('Cols in exams:', colRows.map(r => r.column_name));

    // Count exams
    const count = await sql.query('SELECT COUNT(*) FROM exams');
    const countRows = count.rows || count;
    console.log('Total exams:', countRows[0].count);

    // List exams
    const exams = await sql.query('SELECT id, patient_name, patient_cpf, exam_name, result_data, file_url FROM exams ORDER BY id DESC LIMIT 5');
    const examRows = exams.rows || exams;
    console.log('\n--- Last 5 Exams ---');
    examRows.forEach(e => {
      console.log(`Name: ${e.patient_name}, CPF: ${e.patient_cpf}, Exam: ${e.exam_name}, Result: ${e.result_data?.substring(0, 50)}..., PDF: ${e.file_url ? 'YES' : 'NO'}`);
    });
  } catch(e) {
    console.error('ERROR:', e.message);
  }
})();
