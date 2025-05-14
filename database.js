// database.js (MODIFICATO PER RENDER)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Render imposterà RENDER_DISC_MOUNT_PATH se usi il nome 'data' per il disco.
// Altrimenti, puoi definire una tua variabile d'ambiente (es. APP_DATA_DIR)
// e impostarla sul percorso di mount del disco che definisci in Render.
// Qui usiamo un approccio flessibile.
const diskMountPath = process.env.RENDER_DISC_MOUNT_PATH || process.env.APP_DATA_DIR || '.';
const DBSOURCE = path.join(diskMountPath, "watchnet.db"); // Il file DB sarà in una cartella sul disco persistente

console.log(`Percorso del database SQLite: ${DBSOURCE}`); // Utile per il debug

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error("Errore apertura database:", err.message);
        throw err;
    } else {
        console.log('Connesso al database SQLite su disco persistente.');
        // ... il resto del tuo codice per creare le tabelle ...
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            CONSTRAINT username_unique UNIQUE (username)
        )`, (err) => {
            if (err) { console.log("Errore creazione tabella users", err); }
            else { console.log("Tabella 'users' verificata/creata."); }
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
            if (err) { console.log("Errore creazione tabella watched_media", err); }
            else { console.log("Tabella 'watched_media' verificata/creata."); }
        });
    }
});

module.exports = db;