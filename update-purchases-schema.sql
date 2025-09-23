-- Script para actualizar el esquema de compras con datos completos del cliente
-- Ejecutar en el SQL Editor de Supabase

-- 1. Actualizar tabla de compras (purchases) para incluir datos del cliente
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS webpay_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS webpay_buy_order VARCHAR(255),
ADD COLUMN IF NOT EXISTS webpay_authorization_code VARCHAR(255);

-- 2. Actualizar tabla de compras de invitados (guest_purchases) para incluir medio de pago
ALTER TABLE guest_purchases 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mercadopago';

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_purchases_customer_email ON purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_method ON purchases(payment_method);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_payment_method ON guest_purchases(payment_method);

-- 4. Crear vista para compras recientes con datos completos
CREATE OR REPLACE VIEW recent_purchases AS
SELECT 
    p.id,
    p.customer_name,
    p.customer_email,
    p.customer_phone,
    p.amount,
    p.payment_method,
    p.status,
    p.created_at,
    e.title as book_title,
    e.author as book_author,
    CASE 
        WHEN p.mercadopago_payment_id IS NOT NULL THEN 'MercadoPago'
        WHEN p.webpay_token IS NOT NULL THEN 'WebPay'
        ELSE 'Desconocido'
    END as payment_gateway,
    CASE 
        WHEN p.user_id IS NOT NULL THEN 'Usuario Registrado'
        ELSE 'Invitado'
    END as customer_type
FROM purchases p
LEFT JOIN ebooks e ON p.ebook_id = e.id
ORDER BY p.created_at DESC;

-- 5. Crear vista para compras de invitados con datos completos
CREATE OR REPLACE VIEW recent_guest_purchases AS
SELECT 
    gp.id,
    gp.name as customer_name,
    gp.email as customer_email,
    gp.phone as customer_phone,
    gp.amount,
    gp.payment_method,
    gp.status,
    gp.created_at,
    e.title as book_title,
    e.author as book_author,
    CASE 
        WHEN gp.mercado_pago_payment_id IS NOT NULL THEN 'MercadoPago'
        ELSE 'Desconocido'
    END as payment_gateway,
    'Invitado' as customer_type
FROM guest_purchases gp
LEFT JOIN ebooks e ON gp.ebook_id = e.id
ORDER BY gp.created_at DESC;

-- 6. Crear vista unificada de todas las compras
CREATE OR REPLACE VIEW all_recent_purchases AS
SELECT * FROM recent_purchases
UNION ALL
SELECT * FROM recent_guest_purchases
ORDER BY created_at DESC;

-- 7. Verificar que las tablas se actualizaron correctamente
SELECT 'Esquema de compras actualizado exitosamente' as status;
