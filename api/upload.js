const { put } = require('@vercel/blob');
const { IncomingForm } = require('formidable');
const fs = require('fs');

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Ensure BLOB_READ_WRITE_TOKEN is set
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'TOKEN_MISSING: O token do Vercel Blob não está configurado nas variáveis de ambiente da Vercel.' });
  }

  try {
    const form = new IncomingForm();
    
    // Parse form
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // In modern formidable, files.file could be an array
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      console.log('No file found. Field names:', Object.keys(files));
      return res.status(400).json({ error: 'Arquivo não encontrado. Use o campo "file".' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const contentType = file.mimetype;
    const filename = file.originalFilename || `upload-${Date.now()}`;

    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return res.status(200).json({ url: blob.url });

  } catch (err) {
    console.error('Upload Error Details:', err);
    return res.status(500).json({ 
      error: 'Erro Interno no Upload: ' + err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
};

handler.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = handler;
