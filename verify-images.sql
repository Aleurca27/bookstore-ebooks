-- Verificar el estado actual de las imágenes
SELECT 
    title,
    CASE 
        WHEN cover_image LIKE '%via.placeholder%' THEN '❌ Placeholder viejo'
        WHEN cover_image LIKE '%unsplash%' THEN '✅ Unsplash nueva'
        WHEN cover_image LIKE '%dummyimage%' THEN '✅ DummyImage nueva'
        ELSE '❓ Otra URL'
    END as image_status,
    cover_image
FROM ebooks 
ORDER BY created_at;
