-- ========================================
-- ACTUALIZAR IMÁGENES DE LIBROS
-- Usando imágenes temáticas de Unsplash
-- ========================================

-- 1. El Arte de la Programación (Tecnología) - Imagen de código/programación
UPDATE ebooks 
SET cover_image = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop&crop=center'
WHERE title = 'El Arte de la Programación';

-- 2. Cocina Mediterránea (Gastronomía) - Imagen de comida mediterránea
UPDATE ebooks 
SET cover_image = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=400&fit=crop&crop=center'
WHERE title = 'Cocina Mediterránea';

-- 3. Historia del Arte Moderno (Arte) - Imagen de arte/museo
UPDATE ebooks 
SET cover_image = 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop&crop=center'
WHERE title = 'Historia del Arte Moderno';

-- 4. Finanzas Personales (Negocios) - Imagen de finanzas/dinero
UPDATE ebooks 
SET cover_image = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&crop=center'
WHERE title = 'Finanzas Personales';

-- 5. Mindfulness y Meditación (Bienestar) - Imagen de meditación/zen
UPDATE ebooks 
SET cover_image = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop&crop=center'
WHERE title = 'Mindfulness y Meditación';

-- ALTERNATIVA: Si prefieres imágenes más simples y consistentes
-- Puedes usar estas URLs de placeholder con colores temáticos:

-- UPDATE ebooks SET cover_image = 'https://dummyimage.com/300x400/4f46e5/ffffff.png&text=Programación' WHERE title = 'El Arte de la Programación';
-- UPDATE ebooks SET cover_image = 'https://dummyimage.com/300x400/059669/ffffff.png&text=Cocina' WHERE title = 'Cocina Mediterránea';
-- UPDATE ebooks SET cover_image = 'https://dummyimage.com/300x400/dc2626/ffffff.png&text=Arte' WHERE title = 'Historia del Arte Moderno';
-- UPDATE ebooks SET cover_image = 'https://dummyimage.com/300x400/ea580c/ffffff.png&text=Finanzas' WHERE title = 'Finanzas Personales';
-- UPDATE ebooks SET cover_image = 'https://dummyimage.com/300x400/7c3aed/ffffff.png&text=Mindfulness' WHERE title = 'Mindfulness y Meditación';

-- Verificar las actualizaciones
SELECT title, cover_image, category, price FROM ebooks ORDER BY created_at;
