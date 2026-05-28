const express = require("express");
const db = require("../banco");

const router = express.Router();

router.post("/materiais", (req, res) => {
  const { material, cor, camisa, renda, cor_renda } = req.body;

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
});

router.get("/materiais", (req, res) => {
  db.all("SELECT * FROM materiais ORDER BY material", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json(rows);
  });
});

module.exports = router;