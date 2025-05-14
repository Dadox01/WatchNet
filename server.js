// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Abilita CORS per tutte le richieste
app.use(express.json()); // Per parsare JSON bodies

// Serve i file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);

// Fallback per servire index.html per le route del frontend (se usi routing client-side)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});