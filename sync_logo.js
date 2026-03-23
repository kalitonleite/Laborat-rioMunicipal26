const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const url = 'postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(url);

async function syncLogo() {
  try {
    const settings = await sql("SELECT value FROM lab_settings WHERE key = 'app_logo'");
    if (settings && settings.length > 0 && settings[0].value && settings[0].value.url) {
      const base64Data = settings[0].value.url;
      if (base64Data.startsWith('data:image/')) {
        const base64Image = base64Data.split(';base64,').pop();
        const buffer = Buffer.from(base64Image, 'base64');
        const logoPath = path.join('f:', 'LaboratorioMunicipal06', 'public', 'assets', 'logo-uarini.jpg');
        
        fs.writeFileSync(logoPath, buffer);
        console.log('Logo sincronizado com sucesso em ' + logoPath);
      } else {
        console.log('Logo no banco não é base64 válido.');
      }
    } else {
      console.log('Nenhum logo encontrado no banco.');
    }
  } catch (err) {
    console.error('Erro ao sincronizar logo:', err);
    process.exit(1);
  }
}

syncLogo();
