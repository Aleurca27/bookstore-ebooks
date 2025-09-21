-- ========================================
-- ACTUALIZAR CON IMAGEN PERSONALIZADA
-- Usando la imagen 2.png subida por el usuario
-- ========================================

-- PASO 1: Actualizar un libro con tu imagen personalizada
-- Usando la imagen desde tu propio proyecto en Vercel

UPDATE ebooks 
SET cover_image = 'https://bookstore-alejandro.vercel.app/images/book-cover-programming.png'
WHERE title = 'El Arte de la Programación';

-- PASO 2: Actualizar otros libros con imágenes alternativas más confiables
-- Usando servicios que no requieren CORS

UPDATE ebooks 
SET cover_image = 'https://picsum.photos/300/400?random=1'
WHERE title = 'Cocina Mediterránea';

UPDATE ebooks 
SET cover_image = 'https://picsum.photos/300/400?random=2'
WHERE title = 'Historia del Arte Moderno';

UPDATE ebooks 
SET cover_image = 'https://picsum.photos/300/400?random=3'
WHERE title = 'Finanzas Personales';

UPDATE ebooks 
SET cover_image = 'https://picsum.photos/300/400?random=4'
WHERE title = 'Mindfulness y Meditación';

-- PASO 3: Verificar los cambios
SELECT title, cover_image FROM ebooks ORDER BY created_at;
