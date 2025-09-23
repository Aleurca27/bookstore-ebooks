-- Script para actualizar el precio del libro de publicidad a 500 pesos
-- Ejecutar en el SQL Editor de Supabase

UPDATE ebooks 
SET price = 0.50 
WHERE title ILIKE '%publicidad%';

-- Verificar el cambio
SELECT id, title, author, price 
FROM ebooks 
WHERE title ILIKE '%publicidad%';
