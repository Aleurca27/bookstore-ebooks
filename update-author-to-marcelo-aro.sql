-- Actualizar el autor del ebook de la publicidad a Marcelo Aro

UPDATE public.ebooks
SET 
  author = 'Marcelo Aro',
  updated_at = NOW()
WHERE title = 'Ebook de la Publicidad';

-- Verificar el cambio
SELECT id, title, author, updated_at 
FROM public.ebooks 
WHERE title = 'Ebook de la Publicidad';
