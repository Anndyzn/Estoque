UPDATE estoque
SET quantidade = 0
WHERE material_id IN (
    SELECT id
    FROM materiais
    WHERE material = 'Camisa Premium'
);

DELETE FROM gondolas
WHERE id IN (17);
    

SELECT material
FROM materiais;

UPDATE materiais
SET
  material = UPPER(material),
  cor = UPPER(cor),
  camisa = UPPER(camisa),
  renda = UPPER(renda),
  cor_renda = UPPER(cor_renda);


UPDATE movimentacoes
SET data_movimentacao = datetime(data_movimentacao, '-3 hours');

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