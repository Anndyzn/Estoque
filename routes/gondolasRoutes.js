const express = require("express");
const db = require("../banco");

const router = express.Router();

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

router.post("/gondolas", (req, res) => {
  const nome = normalizarTexto(req.body.nome);

  if (!nome) {
    return res.status(400).json({ erro: "Informe o nome da gôndola." });
  }

  db.get(
    "SELECT id FROM gondolas WHERE UPPER(TRIM(nome)) = ?",
    [nome],
    (err, existente) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (existente) {
        return res.status(409).json({
          erro: "Esta gôndola já está cadastrada."
        });
      }

      db.run(
        "INSERT INTO gondolas (nome) VALUES (?)",
        [nome],
        function (err) {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }

          res.json({
            id: this.lastID,
            nome
          });
        }
      );
    }
  );
});

router.get("/gondolas", (req, res) => {
  db.all("SELECT * FROM gondolas ORDER BY nome", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json(rows);
  });
});

module.exports = router;
