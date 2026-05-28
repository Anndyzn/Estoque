const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("estoque.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS gondolas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS materiais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT NOT NULL,
      cor TEXT,
      camisa TEXT,
      renda TEXT,
      cor_renda TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS estoque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      gondola_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (material_id) REFERENCES materiais(id),
      FOREIGN KEY (gondola_id) REFERENCES gondolas(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      gondola_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materiais(id),
      FOREIGN KEY (gondola_id) REFERENCES gondolas(id)
    )
  `);
});

module.exports = db;