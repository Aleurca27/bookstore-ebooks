-- Script para actualizar el esquema de la base de datos para la nueva integración de pagos

-- 1. Actualizar tabla guest_purchases para incluir campos de la nueva integración
ALTER TABLE guest_purchases 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_data JSONB,
ADD COLUMN IF NOT EXISTS notification_data JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS book_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS book_price DECIMAL(10,2);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_guest_purchases_external_id ON guest_purchases(external_id);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_status ON guest_purchases(status);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_payment_method ON guest_purchases(payment_method);

-- 3. Actualizar tabla purchases para incluir campos similares (para usuarios registrados)
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_data JSONB,
ADD COLUMN IF NOT EXISTS notification_data JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS book_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS book_price DECIMAL(10,2);

-- 4. Crear índices para purchases
CREATE INDEX IF NOT EXISTS idx_purchases_external_id ON purchases(external_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_method ON purchases(payment_method);

-- 5. Crear tabla para logs de notificaciones de pago (opcional, para debugging)
CREATE TABLE IF NOT EXISTS payment_notifications (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    notification_data JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear índice para payment_notifications
CREATE INDEX IF NOT EXISTS idx_payment_notifications_external_id ON payment_notifications(external_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_processed_at ON payment_notifications(processed_at);

-- 7. Actualizar datos existentes si es necesario
UPDATE guest_purchases 
SET 
    book_title = 'Ebook de la Publicidad',
    book_price = 25.0,
    status = 'completed'
WHERE book_title IS NULL;

UPDATE purchases 
SET 
    book_title = 'Ebook de la Publicidad',
    book_price = 25.0,
    status = 'completed'
WHERE book_title IS NULL;

-- 8. Comentarios para documentar los nuevos campos
COMMENT ON COLUMN guest_purchases.external_id IS 'ID único externo generado para la transacción de pago';
COMMENT ON COLUMN guest_purchases.payment_id IS 'ID del pago en la plataforma de pago (MercadoPago/WebPay)';
COMMENT ON COLUMN guest_purchases.transaction_id IS 'ID de la transacción bancaria';
COMMENT ON COLUMN guest_purchases.payment_data IS 'Datos completos de la respuesta de inicialización del pago';
COMMENT ON COLUMN guest_purchases.notification_data IS 'Datos de la notificación de confirmación de pago';
COMMENT ON COLUMN guest_purchases.status IS 'Estado del pago: pending, completed, failed, cancelled';
COMMENT ON COLUMN guest_purchases.book_title IS 'Título del libro comprado';
COMMENT ON COLUMN guest_purchases.book_price IS 'Precio del libro en USD';

-- 9. Crear función para limpiar notificaciones antiguas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM payment_notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 10. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a guest_purchases
DROP TRIGGER IF EXISTS update_guest_purchases_updated_at ON guest_purchases;
CREATE TRIGGER update_guest_purchases_updated_at
    BEFORE UPDATE ON guest_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
