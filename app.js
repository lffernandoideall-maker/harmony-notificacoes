const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
  res.send('✅ Servidor rodando no Cloud Run!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
