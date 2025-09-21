-- Script para configurar MercadoPago en Supabase
-- Ejecutar este script en el Query Editor de Supabase

-- 1. Agregar columnas de MercadoPago a la tabla purchases existente
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS mercadopago_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS mercadopago_preference_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS mercadopago_external_reference VARCHAR(255);

-- 2. Crear tabla para almacenar transacciones de MercadoPago
CREATE TABLE IF NOT EXISTS mercadopago_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
    preference_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255),
    external_reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled, in_process
    amount DECIMAL(10,2) NOT NULL,
    currency_id VARCHAR(10) DEFAULT 'CLP',
    payment_method_id VARCHAR(100),
    payment_type_id VARCHAR(100),
    collector_id VARCHAR(100),
    payer_email VARCHAR(255),
    mercadopago_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_mercadopago_transactions_user_id ON mercadopago_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mercadopago_transactions_ebook_id ON mercadopago_transactions(ebook_id);
CREATE INDEX IF NOT EXISTS idx_mercadopago_transactions_preference_id ON mercadopago_transactions(preference_id);
CREATE INDEX IF NOT EXISTS idx_mercadopago_transactions_payment_id ON mercadopago_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_mercadopago_transactions_status ON mercadopago_transactions(status);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE mercadopago_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de seguridad para mercadopago_transactions
-- Los usuarios solo pueden ver sus propias transacciones
CREATE POLICY "Users can view own mercadopago transactions"
    ON mercadopago_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias transacciones
CREATE POLICY "Users can insert own mercadopago transactions"
    ON mercadopago_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Solo se pueden actualizar las transacciones propias (para webhooks)
CREATE POLICY "Users can update own mercadopago transactions"
    ON mercadopago_transactions FOR UPDATE
    USING (auth.uid() = user_id);

-- Los administradores pueden ver todas las transacciones
CREATE POLICY "Admins can view all mercadopago transactions"
    ON mercadopago_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Crear trigger para updated_at en mercadopago_transactions
CREATE TRIGGER update_mercadopago_transactions_updated_at
    BEFORE UPDATE ON mercadopago_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Crear vista para obtener transacciones con información del ebook
CREATE OR REPLACE VIEW mercadopago_transaction_details AS
SELECT 
    mt.*,
    e.title as ebook_title,
    e.author as ebook_author,
    e.cover_image as ebook_cover,
    up.email as user_email,
    up.full_name as user_name
FROM mercadopago_transactions mt
JOIN ebooks e ON mt.ebook_id = e.id
LEFT JOIN user_profiles up ON mt.user_id = up.user_id;

-- 9. Habilitar RLS para la vista
ALTER VIEW mercadopago_transaction_details SET (security_invoker = true);

-- 10. Crear política para la vista
CREATE POLICY "Users can view own transaction details"
    ON mercadopago_transaction_details FOR SELECT
    USING (auth.uid() = user_id);

-- Comentarios para recordar las credenciales de MercadoPago:
-- Public Key: APP_USR-c2104a09-00e7-4e07-8475-8bf44ed7a4a0
-- Client ID: 7433295818776236
-- Client Secret: bqx1R0XRJbe1qgYJoeXCF3lh3dcFu39j
-- Access Token: [Configurar en variables de entorno]
