-- Script para agregar el ebook de publicidad
-- Ejecutar en el SQL Editor de Supabase

INSERT INTO ebooks (title, author, description, price, cover_image, category, featured) VALUES
('Ebook de la Publicidad', 'Carlos López', 'Una guía completa para dominar el marketing digital y escalar tu negocio online. Incluye estrategias probadas, casos de estudio reales y herramientas prácticas para emprendedores chilenos.', 29.90, '/images/portala libro.png', 'Marketing', true);

-- Verificar que se insertó correctamente
SELECT id, title, author FROM ebooks WHERE title ILIKE '%publicidad%';
