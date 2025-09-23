-- Actualizar el precio del ebook de la publicidad a $29.900 CLP
-- Esto requiere cambiar el precio de 0.5 USD a 29.9 USD en la base de datos

UPDATE public.ebooks
SET 
  price = 29.9,
  updated_at = NOW()
WHERE title = 'Ebook de la Publicidad';

-- Verificar el cambio
SELECT id, title, price, updated_at 
FROM public.ebooks 
WHERE title = 'Ebook de la Publicidad';
