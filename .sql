SELECT
    m.material,
    SUM(e.quantidade) AS saldo
FROM estoque e
JOIN materiais m ON m.id = e.material_id
WHERE TRIM(m.material) LIKE 'EDRE%'
GROUP BY m.id, m.material
ORDER BY m.material;