const { sql } = require('../db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { cpf, password } = req.body;

  if (!cpf || !password) {
    return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
  }

  try {
    const results = await sql`SELECT * FROM public.profiles WHERE cpf = ${cpf} LIMIT 1`;
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado. Se for seu primeiro acesso, registre-se primeiro.' });
    }

    const user = results[0];

    if (!user.password_hash) {
      if (password === cpf.replace(/\D/g, '').substring(0, 6)) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);
          await sql`UPDATE public.profiles SET password_hash = ${hash} WHERE id = ${user.id}`;
          user.password_hash = hash;
      } else {
          return res.status(401).json({ error: 'Senha inválida. Tente os primeiros 6 dígitos do seu CPF.' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu CPF e senha.' });
    }

    await sql`UPDATE public.profiles SET last_login = now() WHERE id = ${user.id}`;

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        cpf: user.cpf,
        avatar: user.avatar
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno no servidor: ' + err.message });
  }
};
