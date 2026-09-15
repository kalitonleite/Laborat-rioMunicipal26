const { sql } = require('../db');

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
    const { cpf, role } = body;

    if (!cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório.' });
    }

    const cleanCPF = String(cpf).replace(/\D/g, '');

    let results;
    if (role) {
      results = await sql`SELECT id FROM public.profiles WHERE cpf = ${cleanCPF} AND role = ${role} LIMIT 1`;
    } else {
      results = await sql`SELECT id FROM public.profiles WHERE cpf = ${cleanCPF} LIMIT 1`;
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado para este acesso.' });
    }

    const user = results[0];

    // Remove a senha atual — próximo login usa os 6 primeiros dígitos do CPF
    await sql`UPDATE public.profiles SET password_hash = NULL WHERE id = ${user.id}`;

    return res.status(200).json({ message: 'Acesso resetado com sucesso!' });
  } catch (err) {
    console.error('Reset by CPF error:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
