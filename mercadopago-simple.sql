-- Paso 1: Agregar columnas de MercadoPago a la tabla purchases
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS mercadopago_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS mercadopago_preference_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS mercadopago_external_reference VARCHAR(255);
