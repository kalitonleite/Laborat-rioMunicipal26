const { sql } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const body = await getBody(req);
    const { password } = body;

    if (!password) {
      return res.status(400).json({ error: 'Nova senha é obrigatória.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    if (!decoded.id) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await sql`
      UPDATE public.profiles SET password_hash = ${hash} WHERE id = ${decoded.id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ message: 'Senha atualizada com sucesso!' });
  } catch (err) {
    console.error('Update password error:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
