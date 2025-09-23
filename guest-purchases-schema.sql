-- Script para crear tabla de compras de invitados
-- Ejecutar en el SQL Editor de Supabase

-- Crear tabla para compras de invitados (sin registro)
CREATE TABLE IF NOT EXISTS guest_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    access_password VARCHAR(50) NOT NULL UNIQUE,
    mercado_pago_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_guest_purchases_email ON guest_purchases(email);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_ebook_id ON guest_purchases(ebook_id);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_access_password ON guest_purchases(access_password);
CREATE INDEX IF NOT EXISTS idx_guest_purchases_status ON guest_purchases(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE guest_purchases ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- Todos pueden insertar (para crear compras)
CREATE POLICY "Anyone can create guest purchases"
    ON guest_purchases FOR INSERT
    WITH CHECK (true);

-- Solo se puede leer con la contraseña correcta
CREATE POLICY "Read guest purchases with correct password"
    ON guest_purchases FOR SELECT
    USING (true); -- Temporalmente permitir lectura para testing

-- Solo admins pueden actualizar (usando service role)
CREATE POLICY "Only service role can update guest purchases"
    ON guest_purchases FOR UPDATE
    USING (true); -- Temporalmente permitir todas las actualizaciones

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_guest_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
CREATE TRIGGER update_guest_purchases_updated_at
    BEFORE UPDATE ON guest_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_purchases_updated_at();

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla guest_purchases creada exitosamente' as status;
