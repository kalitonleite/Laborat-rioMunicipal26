const { put } = require('@vercel/blob');
const { IncomingForm } = require('formidable');
const fs = require('fs');

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // JWT auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'TOKEN_MISSING: O token do Vercel Blob não está configurado.' });
  }

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, flds, fls) => {
        if (err) reject(err);
        resolve([flds, fls]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'Arquivo não encontrado. Use o campo "file".' });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Tipo de arquivo não permitido. Use JPG, JPEG, PNG ou PDF.' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const contentType = file.mimetype;
    const filename = `scanner-${Date.now()}-${file.originalFilename || 'upload'}`;

    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return res.status(200).json({ url: blob.url, filename, contentType });

  } catch (err) {
    console.error('Scanner Upload Error:', err);
    return res.status(500).json({ error: 'Erro no upload: ' + err.message });
  }
};

handler.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = handler;
