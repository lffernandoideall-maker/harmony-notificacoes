require('dotenv').config();

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar Firebase
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FCM_PROJECT_ID
});

// Armazenar tokens (em produção, usar banco de dados)
let tokens = [];

// ROTA 1: Salvar token
app.post('/api/salvar-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ ok: false, error: 'Token não fornecido' });
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log(`✅ Token salvo: ${token.substring(0, 20)}...`);
  }

  res.json({ ok: true, msg: 'Token salvo', totalTokens: tokens.length });
});

// ROTA 2: Enviar notificação
app.post('/api/enviar-notificacao', async (req, res) => {
  const { titulo, corpo, dados } = req.body;

  if (!titulo || !corpo) {
    return res.status(400).json({ ok: false, error: 'Título e corpo obrigatórios' });
  }

  if (tokens.length === 0) {
    return res.status(400).json({ ok: false, error: 'Nenhum token registrado' });
  }

  try {
    const message = {
  notification: {
    title: titulo,
    body: corpo
  },

      data: dados || {}
    };

    const resultados = [];

    for (const token of tokens) {
      try {
        const response = await admin.messaging().send({
          ...message,
          token: token
        });

        resultados.push({
          token: token.substring(0, 20) + '...',
          ok: true,
          messageId: response
        });

        console.log(`✅ Notificação enviada para: ${token.substring(0, 20)}...`);
      } catch (err) {
        resultados.push({
          token: token.substring(0, 20) + '...',
          ok: false,
          error: err.message
        });

        console.error(`❌ Erro ao enviar para ${token.substring(0, 20)}...`, err.message);
      }
    }

    res.json({ ok: true, enviadas: resultados.length, resultados });

  } catch (err) {
    console.error('❌ Erro ao enviar notificações:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ROTA 3: Listar tokens (apenas para debug)
app.get('/api/tokens', (req, res) => {
  res.json({ tokens: tokens.length, lista: tokens.map(t => t.substring(0, 20) + '...') });
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
