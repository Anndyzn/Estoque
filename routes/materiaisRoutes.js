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

router.post("/materiais", (req, res) => {
  const material = normalizarTexto(req.body.material);
  const cor = normalizarTexto(req.body.cor);
  const camisa = normalizarTexto(req.body.camisa);
  const renda = normalizarTexto(req.body.renda);
  const cor_renda = normalizarTexto(req.body.cor_renda);

  if (!material) {
    return res.status(400).json({ erro: "Informe o nome do material." });
  }

  db.get(
    `
    SELECT id
    FROM materiais
    WHERE UPPER(TRIM(COALESCE(material, ''))) = ?
    AND UPPER(TRIM(COALESCE(cor, ''))) = ?
    AND UPPER(TRIM(COALESCE(camisa, ''))) = ?
    AND UPPER(TRIM(COALESCE(renda, ''))) = ?
    AND UPPER(TRIM(COALESCE(cor_renda, ''))) = ?
    `,
    [material, cor, camisa, renda, cor_renda],
    (err, existente) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (existente) {
        return res.status(409).json({
          erro: "Este material já está cadastrado com os mesmos detalhes."
        });
      }

      db.run(
        `
        INSERT INTO materiais 
        (material, cor, camisa, renda, cor_renda)
        VALUES (?, ?, ?, ?, ?)
        `,
        [material, cor, camisa, renda, cor_renda],
        function (err) {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }

          notificarAtualizacao(req, "material-criado");

          res.json({
            id: this.lastID,
            material,
            cor,
            camisa,
            renda,
            cor_renda
          });
        }
      );
    }
  );
});

router.get("/materiais", (req, res) => {
  db.all(
    `
    SELECT *
    FROM materiais
    ORDER BY material, cor, camisa, renda, cor_renda
    `,
    [],
    (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json(rows);
    }
  );
});

router.put("/materiais/:id", (req, res) => {
  const id = Number(req.params.id);
  const material = normalizarTexto(req.body.material);
  const cor = normalizarTexto(req.body.cor);
  const camisa = normalizarTexto(req.body.camisa);
  const renda = normalizarTexto(req.body.renda);
  const cor_renda = normalizarTexto(req.body.cor_renda);

  if (!id) {
    return res.status(400).json({ erro: "Material invalido." });
  }

  if (!material) {
    return res.status(400).json({ erro: "Informe o nome do material." });
  }

  db.get(
    `
    SELECT id
    FROM materiais
    WHERE UPPER(TRIM(COALESCE(material, ''))) = ?
    AND UPPER(TRIM(COALESCE(cor, ''))) = ?
    AND UPPER(TRIM(COALESCE(camisa, ''))) = ?
    AND UPPER(TRIM(COALESCE(renda, ''))) = ?
    AND UPPER(TRIM(COALESCE(cor_renda, ''))) = ?
    AND id <> ?
    `,
    [material, cor, camisa, renda, cor_renda, id],
    (err, existente) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (existente) {
        return res.status(409).json({
          erro: "Este material ja esta cadastrado com os mesmos detalhes."
        });
      }

      db.run(
        `
        UPDATE materiais
        SET material = ?, cor = ?, camisa = ?, renda = ?, cor_renda = ?
        WHERE id = ?
        `,
        [material, cor, camisa, renda, cor_renda, id],
        function (err) {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }

          if (this.changes === 0) {
            return res.status(404).json({ erro: "Material nao encontrado." });
          }

          notificarAtualizacao(req, "material-editado");

          res.json({
            id,
            material,
            cor,
            camisa,
            renda,
            cor_renda
          });
        }
      );
    }
  );
});

module.exports = router;
