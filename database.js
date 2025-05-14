// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determina il percorso base per il database:
// 1. Usa DB_MOUNT_PATH se definito (per controllo esplicito del percorso del disco).
// 2. Altrimenti, usa RENDER_DISC_MOUNT_PATH (impostato da Render se il disco si chiama 'data').
// 3. Come fallback (per sviluppo locale o se nessuna variabile è impostata), usa la directory corrente ('.').
const basePath = process.env.DB_MOUNT_PATH || process.env.RENDER_DISC_MOUNT_PATH || '.';
const DBSOURCE = path.join(basePath, "watchnet.db");

console.log(`Percorso del database SQLite configurato: ${DBSOURCE}`);
if (basePath === '.') {
    console.warn("ATTENZIONE: Il database SQLite è configurato nella directory corrente. Su Render, questo NON sarà persistente a meno che basePath non punti a un disco montato.");
}
if (process.env.RENDER_DISC_MOUNT_PATH) {
    console.log(`RENDER_DISC_MOUNT_PATH rilevato: ${process.env.RENDER_DISC_MOUNT_PATH}`);
}
if (process.env.DB_MOUNT_PATH) {
    console.log(`DB_MOUNT_PATH rilevato: ${process.env.DB_MOUNT_PATH}`);
}


const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(`Errore apertura database su ${DBSOURCE}:`, err.message);
        // Se l'errore è SQLITE_CANTOPEN, il percorso potrebbe essere sbagliato o non scrivibile.
        if (err.code === 'SQLITE_CANTOPEN' && (process.env.RENDER_DISC_MOUNT_PATH || process.env.DB_MOUNT_PATH)) {
            console.error("Verifica che il 'Mount Path' del disco su Render e la variabile d'ambiente corrispondente siano corretti e che il servizio abbia i permessi per scrivere lì.");
        }
        throw err;
    } else {
        console.log(`Connesso con successo al database SQLite: ${DBSOURCE}`);

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            CONSTRAINT username_unique UNIQUE (username)
        )`, (err) => {
            if (err) {
                console.error("Errore creazione tabella 'users':", err.message);
            } else {
                console.log("Tabella 'users' verificata/creata con successo.");
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS watched_media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            tmdb_id INTEGER,
            media_type TEXT, -- 'movie' or 'tvshow'
            title TEXT,
            poster_path TEXT,
            release_date TEXT,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, tmdb_id, media_type)
        )`, (err) => {
            if (err) {
                console.error("Errore creazione tabella 'watched_media':", err.message);
            } else {
                console.log("Tabella 'watched_media' verificata/creata con successo.");
            }
        });
    }
});

module.exports = db;
