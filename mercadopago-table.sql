-- Paso 2: Crear tabla para transacciones de MercadoPago
CREATE TABLE IF NOT EXISTS mercadopago_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
    preference_id VARCHAR(255),
    payment_id VARCHAR(255),
    external_reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
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
