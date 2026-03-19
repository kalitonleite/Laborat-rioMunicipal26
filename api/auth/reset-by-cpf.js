const { sql } = require('../db.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { cpf, role } = req.body;
  if (!cpf || !role) return res.status(400).json({ error: 'CPF e Cargo são obrigatórios.' });

  try {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    const result = await sql`
      DELETE FROM profiles 
      WHERE cpf = ${cleanCPF} AND role = ${role}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado para os dados informados.' });
    }

    return res.status(200).json({ message: 'Acesso removido com sucesso. Por favor, realize um novo cadastro.' });
  } catch (err) {
    console.error('Reset error:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
