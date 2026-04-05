const { put } = require('@vercel/blob');
const { IncomingForm } = require('formidable');
const fs = require('fs');

// Vercel serverless functions don't support traditional multipart/form-data easily 
// but formidable can help. However, for Vercel, it's often easier to send JSON or raw body.
// But let's try to support multipart.

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
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

    const file = files.file; // The field name is 'file'
    if (!file) {
      return res.status(400).json({ error: 'Arquivo não encontrado no formulário' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const contentType = file.mimetype;
    const filename = file.originalFilename || `upload-${Date.now()}`;

    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType
    });

    return res.status(200).json({ url: blob.url });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Erro no upload: ' + err.message });
  }
};
