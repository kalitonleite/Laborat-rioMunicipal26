const { sql } = require('../db');
const bcrypt = require('bcryptjs');

async function getBody(req) {
    if (req.body && Object.keys(req.body).length > 0) return req.body;
    return new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
        });
    });
}

module.exports = async function handler(req, res) {
  try {
    const body = await getBody(req);
    const { cpf, name, role, sus_number, email, phone, password } = body;

    if (!cpf || !name || !role) {
      return res.status(400).json({ error: 'CPF, Nome e Cargo são obrigatórios.' });
    }

    const rawPassword = password || cpf.replace(/\D/g, '').substring(0, 6);
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(rawPassword, salt);

    const result = await sql`
      INSERT INTO public.profiles (id, cpf, name, role, sus_number, email, phone, password_hash)
      VALUES (gen_random_uuid(), ${cpf}, ${name}, ${role}, ${sus_number || null}, ${email || null}, ${phone || null}, ${password_hash})
      RETURNING *
    `;

    return res.status(201).json({
      message: 'Usuário criado com sucesso!',
      temp_password: password ? undefined : rawPassword, 
      user: result[0]
    });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
