const { sql } = require('../db.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'A nova senha é obrigatória.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sql`
      UPDATE profiles 
      SET password_hash = ${hashedPassword} 
      WHERE id = ${decoded.id}
      RETURNING id
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
