// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

const JWT_SECRET = 'LA_TUA_CHIAVE_SEGRETA_MOLTO_SEGRETA'; // CAMBIALA!

// Middleware per verificare il token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user; // Aggiunge i dati dell'utente alla request
        next();
    });
};

// Registrazione
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ message: "Username e password (min 6 caratteri) richiesti." });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        db.run(sql, [username, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(409).json({ message: "Username già esistente." });
                }
                return res.status(500).json({ message: "Errore durante la registrazione." });
            }
            res.status(201).json({ message: "Utente registrato con successo.", userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ message: "Errore del server." });
    }
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], async (err, user) => {
        if (err) return res.status(500).json({ message: "Errore del server." });
        if (!user) return res.status(400).json({ message: "Credenziali non valide." });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ message: "Credenziali non valide." });

        const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' }); // Token valido 1 ora
        res.json({ accessToken, username: user.username });
    });
});

// Ottieni utente corrente (protetto)
router.get('/me', authenticateToken, (req, res) => {
    // req.user contiene { id, username } dal token
    const sql = 'SELECT id, username FROM users WHERE id = ?';
    db.get(sql, [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: "Utente non trovato." });
        }
        res.json(user);
    });
});

// Cambia password (protetto)
router.put('/me/password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Tutti i campi sono richiesti, nuova password min 6 caratteri." });
    }

    const sqlSelect = 'SELECT password_hash FROM users WHERE id = ?';
    db.get(sqlSelect, [req.user.id], async (err, user) => {
        if (err || !user) return res.status(500).json({ message: "Errore utente." });

        const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validCurrentPassword) {
            return res.status(400).json({ message: "Password attuale non corretta." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const sqlUpdate = 'UPDATE users SET password_hash = ? WHERE id = ?';
        db.run(sqlUpdate, [hashedNewPassword, req.user.id], function(updateErr) {
            if (updateErr) return res.status(500).json({ message: "Errore aggiornamento password." });
            res.json({ message: "Password modificata con successo." });
        });
    });
});

// Elimina profilo (protetto)
router.delete('/me', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM users WHERE id = ?';
    db.run(sql, [req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Errore eliminazione profilo." });
        // Verranno eliminati anche i watched_media grazie a ON DELETE CASCADE
        res.json({ message: "Profilo eliminato con successo." });
    });
});


module.exports = { router, authenticateToken }; // Esporta anche authenticateToken se serve in altri router