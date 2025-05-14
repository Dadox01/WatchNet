// routes/media.js
const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth'); // Importa il middleware
const router = express.Router();

// Ottieni media visti per tipo (protetto)
router.get('/:type', authenticateToken, (req, res) => {
    const mediaType = req.params.type === 'movies' ? 'movie' : 'tvshow';
    const sql = `SELECT tmdb_id as id, title, poster_path, release_date, media_type
                 FROM watched_media
                 WHERE user_id = ? AND media_type = ?
                 ORDER BY added_at DESC`;
    db.all(sql, [req.user.id, mediaType], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Errore nel recupero dei media." });
        }
        // Simula la struttura che il frontend si aspetta da TMDB
        const formattedRows = rows.map(row => ({
            id: row.id, // tmdb_id
            title: row.title,
            name: mediaType === 'tvshow' ? row.title : undefined, // Per coerenza con TMDB
            poster_path: row.poster_path,
            release_date: mediaType === 'movie' ? row.release_date : undefined,
            first_air_date: mediaType === 'tvshow' ? row.release_date : undefined,
        }));
        res.json(formattedRows);
    });
});

// Aggiungi media visto (protetto)
router.post('/', authenticateToken, (req, res) => {
    const { tmdb_id, media_type, title, poster_path, release_date } = req.body;
    if (!tmdb_id || !media_type || !title) {
        return res.status(400).json({ message: "Dati del media incompleti." });
    }
    const sql = `INSERT INTO watched_media (user_id, tmdb_id, media_type, title, poster_path, release_date)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [req.user.id, tmdb_id, media_type, title, poster_path, release_date], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(409).json({ message: "Media già presente nella lista." });
            }
            return res.status(500).json({ message: "Errore nell'aggiunta del media." });
        }
        res.status(201).json({ message: "Media aggiunto con successo.", id: this.lastID });
    });
});

// Rimuovi media visto (protetto)
router.delete('/:tmdb_id/:type', authenticateToken, (req, res) => {
    const { tmdb_id, type } = req.params;
    const mediaType = type === 'movies' ? 'movie' : 'tvshow'; // 'movie' o 'tvshow'
    const sql = 'DELETE FROM watched_media WHERE user_id = ? AND tmdb_id = ? AND media_type = ?';
    db.run(sql, [req.user.id, tmdb_id, mediaType], function(err) {
        if (err) {
            return res.status(500).json({ message: "Errore nella rimozione del media." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Media non trovato nella lista." });
        }
        res.json({ message: "Media rimosso con successo." });
    });
});

module.exports = router;