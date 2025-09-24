-- Script para actualizar el precio del libro a $25.000 CLP
-- Ejecutar en el SQL Editor de Supabase

-- Actualizar el precio del "Ebook de la Publicidad" a $25.000 CLP
-- Considerando que 1 USD = 1000 CLP (aproximadamente), entonces 25.000 CLP = 25 USD

UPDATE ebooks 
SET 
    price = 25.0,
    updated_at = NOW()
WHERE 
    title = 'Ebook de la Publicidad';

-- Verificar el cambio
SELECT 
    id,
    title,
    price,
    updated_at
FROM ebooks 
WHERE 
    title = 'Ebook de la Publicidad';

-- Mostrar mensaje de confirmación
SELECT 'Precio actualizado a $25.000 CLP exitosamente' as status;
