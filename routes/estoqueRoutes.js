const express = require("express");
const db = require("../banco");

const router = express.Router();

router.post("/movimentar", (req, res) => {
  const { material_id, gondola_id, tipo, quantidade } = req.body;

  if (!material_id || !gondola_id || !tipo || !quantidade) {
    return res.status(400).json({
      erro: "Dados incompletos."
    });
  }

  if (quantidade <= 0) {
    return res.status(400).json({
      erro: "Quantidade inválida."
    });
  }

  db.get(
    `
    SELECT * FROM estoque
    WHERE material_id = ?
    AND gondola_id = ?
    `,
    [material_id, gondola_id],
    (err, estoque) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (tipo === "SAIDA") {
        if (!estoque || estoque.quantidade < quantidade) {
          return res.status(400).json({
            erro: "Estoque insuficiente para realizar a saída."
          });
        }
      }

      const multiplicador = tipo === "SAIDA" ? -1 : 1;
      const novaQuantidade = estoque
        ? estoque.quantidade + quantidade * multiplicador
        : quantidade;

      if (estoque) {
        db.run(
          `
          UPDATE estoque
          SET quantidade = ?
          WHERE id = ?
          `,
          [novaQuantidade, estoque.id],
          (err) => {
            if (err) {
              return res.status(500).json({ erro: err.message });
            }

            registrarMovimentacao();
          }
        );
      } else {
        db.run(
          `
          INSERT INTO estoque
          (material_id, gondola_id, quantidade)
          VALUES (?, ?, ?)
          `,
          [material_id, gondola_id, novaQuantidade],
          (err) => {
            if (err) {
              return res.status(500).json({ erro: err.message });
            }

            registrarMovimentacao();
          }
        );
      }

      function registrarMovimentacao() {
        db.run(
          `
          INSERT INTO movimentacoes
          (material_id, gondola_id, tipo, quantidade)
          VALUES (?, ?, ?, ?)
          `,
          [material_id, gondola_id, tipo, quantidade],
          (err) => {
            if (err) {
              return res.status(500).json({ erro: err.message });
            }

            res.json({
              mensagem: "Movimentação realizada com sucesso."
            });
          }
        );
      }
    }
  );
});

router.get("/estoque", (req, res) => {
  db.all(
    `
    SELECT
      m.id AS material_id,
      m.material,
      m.cor,
      m.camisa,
      m.renda,
      m.cor_renda,
      COALESCE(GROUP_CONCAT(g.nome || ': ' || e.quantidade, ' / '), 'Sem gôndola') AS gondolas,
      COALESCE(SUM(e.quantidade), 0) AS quantidade
    FROM materiais m
    LEFT JOIN estoque e ON e.material_id = m.id
    LEFT JOIN gondolas g ON e.gondola_id = g.id
    GROUP BY
      m.id,
      m.material,
      m.cor,
      m.camisa,
      m.renda,
      m.cor_renda
    ORDER BY m.material
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


router.get("/movimentacoes", (req, res) => {
  db.all(
    `
    SELECT
      mov.id,
      mov.tipo,
      mov.quantidade,
      mov.data_movimentacao,
      m.material,
      m.cor,
      m.camisa,
      m.renda,
      m.cor_renda,
      g.nome AS gondola
    FROM movimentacoes mov
    JOIN materiais m ON mov.material_id = m.id
    JOIN gondolas g ON mov.gondola_id = g.id
    ORDER BY mov.data_movimentacao DESC
    LIMIT 20
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

router.get("/estoque/material/:id/gondolas", (req, res) => {
  const materialId = req.params.id;

  db.all(
    `
    SELECT 
      e.id,
      e.material_id,
      e.gondola_id,
      e.quantidade,
      g.nome AS gondola
    FROM estoque e
    JOIN gondolas g ON e.gondola_id = g.id
    WHERE e.material_id = ?
    AND e.quantidade > 0
    ORDER BY g.nome
    `,
    [materialId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      res.json(rows);
    }
  );
});

router.delete("/movimentacoes/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    `
    SELECT *
    FROM movimentacoes
    WHERE id = ?
    `,
    [id],
    (err, mov) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (!mov) {
        return res.status(404).json({
          erro: "Movimentação não encontrada."
        });
      }

      const ajuste =
        mov.tipo === "ENTRADA"
          ? -mov.quantidade
          : mov.quantidade;

      db.get(
        `
        SELECT *
        FROM estoque
        WHERE material_id = ?
        AND gondola_id = ?
        `,
        [mov.material_id, mov.gondola_id],
        (err, estoque) => {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }

          if (!estoque) {
            return res.status(400).json({
              erro: "Estoque não encontrado para desfazer."
            });
          }

          const novaQuantidade = estoque.quantidade + ajuste;

          if (novaQuantidade < 0) {
            return res.status(400).json({
              erro: "Não é possível desfazer. O estoque ficaria negativo."
            });
          }

          db.run(
            `
            UPDATE estoque
            SET quantidade = ?
            WHERE id = ?
            `,
            [novaQuantidade, estoque.id],
            (err) => {
              if (err) {
                return res.status(500).json({ erro: err.message });
              }

              db.run(
                `
                DELETE FROM movimentacoes
                WHERE id = ?
                `,
                [id],
                (err) => {
                  if (err) {
                    return res.status(500).json({ erro: err.message });
                  }

                  res.json({
                    mensagem: "Movimentação desfeita com sucesso."
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

router.post("/transferir", (req, res) => {
  const material_id = Number(req.body.material_id);
  const gondola_origem_id = Number(req.body.gondola_origem_id);
  const gondola_destino_id = Number(req.body.gondola_destino_id);
  const quantidade = Number(req.body.quantidade);

  if (!material_id || !gondola_origem_id || !gondola_destino_id || !quantidade) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  if (gondola_origem_id === gondola_destino_id) {
    return res.status(400).json({ erro: "Origem e destino não podem ser iguais." });
  }

  if (quantidade <= 0) {
    return res.status(400).json({ erro: "Quantidade inválida." });
  }

  db.get(
    `
    SELECT *
    FROM estoque
    WHERE material_id = ?
    AND gondola_id = ?
    `,
    [material_id, gondola_origem_id],
    (err, origem) => {
      if (err) return res.status(500).json({ erro: err.message });

      if (!origem || origem.quantidade < quantidade) {
        return res.status(400).json({
          erro: "Estoque insuficiente na gôndola de origem."
        });
      }

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(
          `
          UPDATE estoque
          SET quantidade = quantidade - ?
          WHERE material_id = ?
          AND gondola_id = ?
          `,
          [quantidade, material_id, gondola_origem_id]
        );

        db.run(
          `
          INSERT INTO estoque (material_id, gondola_id, quantidade)
          VALUES (?, ?, ?)
          ON CONFLICT(material_id, gondola_id)
          DO UPDATE SET quantidade = quantidade + excluded.quantidade
          `,
          [material_id, gondola_destino_id, quantidade],
          (err) => {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ erro: err.message });
            }

            db.run(
              `
              INSERT INTO movimentacoes
              (material_id, gondola_id, tipo, quantidade)
              VALUES (?, ?, ?, ?)
              `,
              [
                material_id,
                gondola_origem_id,
                `TRANSFERENCIA PARA GONDOLA ${gondola_destino_id}`,
                quantidade
              ],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ erro: err.message });
                }

                db.run("COMMIT");

                res.json({
                  mensagem: "Transferência realizada com sucesso."
                });
              }
            );
          }
        );
      });
    }
  );
});

module.exports = router;