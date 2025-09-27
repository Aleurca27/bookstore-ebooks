-- Script para actualizar el precio del libro a 25.000 pesos chilenos
-- Ejecutar en el SQL Editor de Supabase

-- Actualizar el precio del "Ebook de la Publicidad" a 25.000 CLP
-- Conversión: 25.000 CLP ÷ 1.000 = 25 USD (asumiendo 1 USD = 1.000 CLP)
UPDATE ebooks 
SET 
    price = 25.00,
    updated_at = NOW()
WHERE 
    title = 'Ebook de la Publicidad' 
    OR id = '7ddb3a38-9697-466b-8980-f945d4026b3b';

-- Verificar el cambio
SELECT 
    id,
    title,
    author,
    price,
    updated_at
FROM ebooks 
WHERE 
    title = 'Ebook de la Publicidad' 
    OR id = '7ddb3a38-9697-466b-8980-f945d4026b3b';

-- Mostrar mensaje de confirmación
SELECT 'Precio actualizado a 25.000 CLP (25 USD) exitosamente' as status;

