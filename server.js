// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth'); // Importa l'oggetto { router, authenticateToken }
const mediaRoutes = require('./routes/media'); // Importa direttamente il router

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve i file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes.router); // <-- MODIFICA CHIAVE: usa authRoutes.router
app.use('/api/media', mediaRoutes);

// Fallback per servire index.html per le route del frontend (se usi routing client-side)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});
