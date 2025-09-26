-- Script para agregar columnas necesarias para validación de pagos

-- Agregar columnas a guest_purchases para validación de pagos
ALTER TABLE guest_purchases 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_data JSONB,
ADD COLUMN IF NOT EXISTS notification_data JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS book_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS book_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS webhook_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_validation TIMESTAMP WITH TIME ZONE;

-- Agregar columnas a purchases para validación de pagos
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_data JSONB,
ADD COLUMN IF NOT EXISTS notification_data JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS book_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS book_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS webhook_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_validation TIMESTAMP WITH TIME ZONE;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_guest_purchases_external_id ON guest_purchases(external_id);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_payment_id ON guest_purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_status ON guest_purchases(status);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_webhook_processed ON guest_purchases(webhook_processed);

CREATE INDEX IF NOT EXISTS idx_purchases_external_id ON purchases(external_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_webhook_processed ON purchases(webhook_processed);

-- Crear tabla para logs de validación de pagos
CREATE TABLE IF NOT EXISTS payment_validation_logs (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL,
    api_response JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para payment_validation_logs
CREATE INDEX IF NOT EXISTS idx_payment_validation_logs_payment_id ON payment_validation_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_validation_logs_created_at ON payment_validation_logs(created_at);

-- Actualizar datos existentes
UPDATE guest_purchases 
SET 
    book_title = 'Ebook de la Publicidad',
    book_price = 25.0,
    status = 'completed',
    webhook_processed = TRUE
WHERE book_title IS NULL;

UPDATE purchases 
SET 
    book_title = 'Ebook de la Publicidad',
    book_price = 25.0,
    status = 'completed',
    webhook_processed = TRUE
WHERE book_title IS NULL;

-- Comentarios para documentar
COMMENT ON COLUMN guest_purchases.external_id IS 'ID único externo generado para la transacción de pago';
COMMENT ON COLUMN guest_purchases.payment_id IS 'ID del pago en la plataforma de pago (MercadoPago/WebPay)';
COMMENT ON COLUMN guest_purchases.status IS 'Estado del pago: pending, completed, failed, cancelled';
COMMENT ON COLUMN guest_purchases.payment_data IS 'Datos completos de la respuesta de validación del pago';
COMMENT ON COLUMN guest_purchases.webhook_processed IS 'Indica si el webhook ha sido procesado correctamente';
COMMENT ON COLUMN guest_purchases.last_validation IS 'Última vez que se validó el pago con la API externa';

-- Crear función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_validation_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM payment_validation_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Crear función para actualizar timestamp de validación
CREATE OR REPLACE FUNCTION update_validation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_validation = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar last_validation
DROP TRIGGER IF EXISTS update_guest_purchases_validation_timestamp ON guest_purchases;
CREATE TRIGGER update_guest_purchases_validation_timestamp
    BEFORE UPDATE ON guest_purchases
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION update_validation_timestamp();

DROP TRIGGER IF EXISTS update_purchases_validation_timestamp ON purchases;
CREATE TRIGGER update_purchases_validation_timestamp
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION update_validation_timestamp();
