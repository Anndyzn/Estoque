const express = require("express");
const db = require("../banco");

const router = express.Router();

function notificarAtualizacao(req, origem) {
  const io = req.app.get("io");

  if (io) {
    io.emit("estoque:atualizado", { origem, data: new Date().toISOString() });
  }
}

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
            if (err.code === "SQLITE_CONSTRAINT") {
              return res.status(409).json({
                erro: "Esta gondola ja esta cadastrada."
              });
            }

            return res.status(500).json({ erro: err.message });
          }

          notificarAtualizacao(req, "gondola-criada");

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

router.put("/gondolas/:id", (req, res) => {
  const id = Number(req.params.id);
  const nome = normalizarTexto(req.body.nome);

  if (!id) {
    return res.status(400).json({ erro: "Gondola invalida." });
  }

  if (!nome) {
    return res.status(400).json({ erro: "Informe o nome da gondola." });
  }

  db.get(
    "SELECT id FROM gondolas WHERE UPPER(TRIM(nome)) = ? AND id <> ?",
    [nome, id],
    (err, existente) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (existente) {
        return res.status(409).json({
          erro: "Esta gondola ja esta cadastrada."
        });
      }

      db.run(
        "UPDATE gondolas SET nome = ? WHERE id = ?",
        [nome, id],
        function (err) {
          if (err) {
            if (err.code === "SQLITE_CONSTRAINT") {
              return res.status(409).json({
                erro: "Esta gondola ja esta cadastrada."
              });
            }

            return res.status(500).json({ erro: err.message });
          }

          if (this.changes === 0) {
            return res.status(404).json({ erro: "Gondola nao encontrada." });
          }

          notificarAtualizacao(req, "gondola-editada");

          res.json({ id, nome });
        }
      );
    }
  );
});

module.exports = router;
