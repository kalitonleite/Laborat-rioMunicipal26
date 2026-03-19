const { sql } = require('../db.js');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { cpf, name, role, sus_number, password } = req.body;

  if (!cpf || !name || !role) {
    return res.status(400).json({ error: 'CPF, Nome e Cargo são obrigatórios.' });
  }

  try {
    const rawPassword = password || cpf.replace(/\D/g, '').substring(0, 6);
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(rawPassword, salt);

    const result = await sql`
      INSERT INTO public.profiles (id, cpf, name, role, sus_number, password_hash)
      VALUES (gen_random_uuid(), ${cpf}, ${name}, ${role}, ${sus_number || null}, ${password_hash})
      RETURNING *
    `;

    return res.status(201).json({
      message: 'Usuário criado com sucesso!',
      temp_password: password ? undefined : rawPassword, 
      user: result[0]
    });

  } catch (err) {
    console.error('Registration error:', err);
    if (err.message?.includes('unique_cpf')) {
        return res.status(409).json({ error: 'Este CPF já está cadastrado no sistema.' });
    }
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
