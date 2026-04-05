# LabLaudo - Carteirinha Digital SUS

O sistema de carteirinha digital foi implementado com sucesso! Aqui está um resumo do que foi entregue:

## 🚀 Funcionalidades
- **Carteirinha Digital Premium**: Design dark moderno com QR Code, foto e dados do SUS.
- **Painel Administrativo**: Gestão completa de pacientes, emissão de novos tokens e personalização total de cores/logo em tempo real.
- **Validação Pública**: Página de segurança que permite a qualquer pessoa validar a autenticidade do documento escaneando o QR Code.
- **Integração Neon + Vercel Blob**: Banco de dados real para persistência e armazenamento de arquivos de mídia.

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion.
- **Backend**: Vercel Serverless Functions (JS).
- **Banco de Dados**: Neon PostgreSQL.
- **Storage**: Vercel Blob (para fotos e logos).

## 📂 Novas Rotas
- `/admin/carteirinha`: Acesso administrativo para gerenciar o sistema. (Apenas Admin)
- `/carteirinha`: Visualização da carteirinha do próprio usuário logado.
- `/paciente/:id?token=...`: Página pública de validação (aberta via QR Code).

## 💡 Como usar
1. Acesse o **Admin Dashboard**.
2. Clique no novo card **"Gestão de Carteirinhas"** na aba Início.
3. Cadastre um paciente e clique em "Salvar".
4. O paciente poderá ver sua carteirinha acessando a rota `/carteirinha` ou clicando no banner na tela inicial do seu dashboard.
5. Escaneie o QR Code para testar a validação pública!

*Para o upload de fotos funcionar em produção, lembre-se de configurar a variável de ambiente `BLOB_READ_WRITE_TOKEN` no dashboard da Vercel.*
