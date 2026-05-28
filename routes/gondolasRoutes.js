const express = require("express");
const db = require("../banco");

const router = express.Router();

router.post("/gondolas", (req, res) => {
  const { nome } = req.body;

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