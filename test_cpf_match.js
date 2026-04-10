require('dotenv').config();
const { sql } = require('./api/db.js');

(async () => {
  // Lista todos os perfis de pacientes (e seus CPFs) para confirmar o CPF correto
  const profiles = await sql.query("SELECT id, name, cpf, role FROM profiles WHERE role='PATIENT' LIMIT 10");
  const rows = profiles.rows || profiles;
  console.log('=== PACIENTES NO SISTEMA ===');
  rows.forEach(r => console.log(`Name: ${r.name}, CPF: ${r.cpf}, ID: ${r.id}`));

  // Lista todos os exames e seus CPFs
  const exams = await sql.query("SELECT patient_name, patient_cpf, exam_name FROM exams ORDER BY created_at DESC LIMIT 10");
  const examRows = exams.rows || exams;
  console.log('\n=== EXAMES NO SISTEMA ===');
  examRows.forEach(r => console.log(`Paciente: ${r.patient_name}, CPF: ${r.patient_cpf}, Exame: ${r.exam_name}`));
  
  // Verificar se CPFs batem
  console.log('\n=== CPFs ÚNICOS NOS EXAMES ===');
  const uniqueCPFs = [...new Set(examRows.map(r => r.patient_cpf))];
  uniqueCPFs.forEach(cpf => {
    const match = rows.find(r => r.cpf === cpf || r.cpf?.replace(/\D/g,'') === cpf?.replace(/\D/g,''));
    console.log(`CPF: ${cpf} ${match ? '✅ tem perfil' : '❌ SEM perfil'}`);
  });
})().catch(console.error);
