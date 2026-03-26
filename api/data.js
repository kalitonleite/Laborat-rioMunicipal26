const { sql } = require('./db');
const jwt = require('jsonwebtoken');

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
  try {
    const body = await getBody(req);
    const { table, action, id, filter, order, data } = body;

    const isPublicCheck = (table === 'authorization_codes' && action === 'select') ||
                          (table === 'lab_settings' && action === 'select') ||
                          (table === 'qr_codes' && action === 'select') ||
                          (table === 'appointments' && (action === 'select' || action === 'update') && filter && filter.id);

    if (!isPublicCheck) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
      }

      const token = authHeader.split(' ')[1];
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      }
    }

    if (!table) return res.status(400).json({ error: 'O nome da tabela é obrigatório.' });

    const allowedTables = ['profiles', 'exams', 'campaigns', 'appointments', 'lab_settings', 'doctor_notes', 'authorization_codes', 'qr_codes'];
    if (!allowedTables.includes(table)) {
      return res.status(403).json({ error: 'Acesso negado: Tabela não permitida.' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido.' });
    }

    if (action === 'select') {
      let query = `SELECT * FROM public.${table}`;
      const params = [];
      
      if (filter) {
        const keys = Object.keys(filter);
        if (keys.length > 0) {
          query += ' WHERE ' + keys.map((key) => {
              params.push(filter[key]);
              return `${key} = $${params.length}`;
          }).join(' AND ');
        }
      }

      const orderClause = order ? ` ORDER BY ${order.column} ${order.ascending ? 'ASC' : 'DESC'}` : '';
      const result = await sql.query(query + orderClause, params);
      const rows = Array.isArray(result) ? result : (result.rows || []);
      return res.status(200).json(rows);
    }

    if (action === 'insert') {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const query = `INSERT INTO public.${table} (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
        const result = await sql.query(query, values);
        const rows = Array.isArray(result) ? result : (result.rows || []);
        return res.status(201).json(rows);
    }

    if (action === 'update') {
        if (!id && !filter) return res.status(400).json({ error: 'ID ou filtro é necessário para atualização.' });
        const keys = Object.keys(data);
        const values = Object.values(data);
        let query = `UPDATE public.${table} SET ` + keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        
        const filterKeys = filter ? Object.keys(filter) : ['id'];
        const filterValues = filter ? Object.values(filter) : [id];
        
        query += ' WHERE ' + filterKeys.map((key) => {
            values.push(filterValues[filterKeys.indexOf(key)]);
            return `${key} = $${values.length}`;
        }).join(' AND ');

        query += ' RETURNING *';
        const result = await sql.query(query, values);
        const rows = Array.isArray(result) ? result : (result.rows || []);
        return res.status(200).json(rows);
    }

    if (action === 'delete') {
        if (!id && !filter) return res.status(400).json({ error: 'ID ou filtro é necessário para exclusão.' });
        const filterKeys = filter ? Object.keys(filter) : ['id'];
        const filterValues = filter ? Object.values(filter) : [id];
        const query = `DELETE FROM public.${table} WHERE ` + filterKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ') + ' RETURNING *';
        const result = await sql.query(query, filterValues);
        const rows = Array.isArray(result) ? result : (result.rows || []);
        return res.status(200).json(rows);
    }

    return res.status(400).json({ error: 'Ação inválida.' });

  } catch (err) {
    console.error('Data API Database Error:', err);
    return res.status(500).json({ error: 'Erro no banco de dados: ' + err.message });
  }
};
