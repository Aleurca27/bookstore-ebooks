-- Script simplificado para agregar columnas necesarias a guest_purchases

-- Agregar columnas faltantes a guest_purchases
ALTER TABLE guest_purchases 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_data JSONB,
ADD COLUMN IF NOT EXISTS notification_data JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS book_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS book_price DECIMAL(10,2);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_guest_purchases_external_id ON guest_purchases(external_id);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_status ON guest_purchases(status);

-- Actualizar datos existentes
UPDATE guest_purchases 
SET 
    book_title = 'Ebook de la Publicidad',
    book_price = 25.0,
    status = 'completed'
WHERE book_title IS NULL;

-- Comentarios para documentar
COMMENT ON COLUMN guest_purchases.external_id IS 'ID único externo generado para la transacción de pago';
COMMENT ON COLUMN guest_purchases.payment_id IS 'ID del pago en la plataforma de pago';
COMMENT ON COLUMN guest_purchases.status IS 'Estado del pago: pending, completed, failed, cancelled';
COMMENT ON COLUMN guest_purchases.book_title IS 'Título del libro comprado';
COMMENT ON COLUMN guest_purchases.book_price IS 'Precio del libro en USD';
