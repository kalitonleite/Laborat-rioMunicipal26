const { sql } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

async function getBody(req) {
    if (req.body && Object.keys(req.body).length > 0) return req.body;
    return new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                resolve(parsed);
            } catch (e) {
                resolve({});
            }
        });
    });
}

module.exports = async function handler(req, res) {
  try {
    const body = await getBody(req);
    const { cpf, password } = body;

    if (!cpf || !password) {
      return res.status(400).json({ 
        error: 'CPF e senha são obrigatórios.',
        debug: { has_body: !!body, keys: Object.keys(body) }
      });
    }

    const results = await sql`SELECT * FROM public.profiles WHERE cpf = ${cpf} LIMIT 1`;
    if (results.length === 0) return res.status(401).json({ error: 'Usuário não encontrado.' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash || '');
    
    // If no password_hash, check if it's the first login (first 6 digits)
    if (!user.password_hash) {
        const first6 = cpf.replace(/\D/g, '').substring(0, 6);
        if (password === first6) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            await sql`UPDATE public.profiles SET password_hash = ${hash} WHERE id = ${user.id}`;
            // Proceed to login
        } else {
            return res.status(401).json({ error: 'Senha inválida para primeiro acesso.' });
        }
    } else if (!isMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (user.role === 'PENDING_MEDICAL' || user.role === 'PENDING_RECEPTION') {
        return res.status(403).json({ error: 'Seu acesso ainda está aguardando liberação do gestor.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, role: user.role, cpf: user.cpf }
    });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
