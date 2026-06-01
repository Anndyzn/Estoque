UPDATE estoque
SET quantidade = 0
WHERE material_id IN (
    SELECT id
    FROM materiais
    WHERE material = 'Camisa Premium'
);

DELETE FROM movimentacoes
WHERE material_id IN (
    SELECT id
    FROM materiais
    WHERE material = 'Camisa Premium'
);

SELECT 
  m.material,
  m.cor,
  m.camisa,
  g.nome AS gondola,
  e.quantidade
FROM estoque e
JOIN materiais m ON m.id = e.material_id
JOIN gondolas g ON g.id = e.gondola_id
WHERE m.material LIKE '%Camisa Premium%';