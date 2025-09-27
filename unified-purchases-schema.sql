-- Script para unificar la lógica de compras en una sola tabla
-- Eliminar distinción entre usuarios registrados e invitados

-- 1. Agregar columnas necesarias a la tabla purchases existente
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(255),
ADD COLUMN IF NOT EXISTS access_password VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS mercadopago_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS mercadopago_status_detail VARCHAR(100);

-- 2. Crear índice para optimizar búsquedas por email
CREATE INDEX IF NOT EXISTS idx_purchases_customer_email ON purchases(customer_email);

-- 3. Actualizar políticas RLS para permitir acceso por email
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can create own purchases" ON purchases;

-- Nueva política: usuarios pueden ver sus propias compras por user_id O por email
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (
    auth.uid() = user_id OR 
    customer_email = auth.jwt() ->> 'email'
  );

-- Nueva política: cualquiera puede crear compras (para invitados)
CREATE POLICY "Anyone can create purchases" ON purchases
  FOR INSERT WITH CHECK (true);

-- Los administradores pueden ver todas las compras
CREATE POLICY "Admins can view all purchases" ON purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 4. Crear vista unificada para obtener compras con información completa
CREATE OR REPLACE VIEW purchase_details AS
SELECT 
    p.*,
    e.title as ebook_title,
    e.author as ebook_author,
    e.cover_image as ebook_cover,
    e.file_url as ebook_file_url,
    up.full_name as user_name,
    au.email as user_email
FROM purchases p
JOIN ebooks e ON p.ebook_id = e.id
LEFT JOIN profiles up ON p.user_id = up.id
LEFT JOIN auth.users au ON p.user_id = au.id;

-- 5. Configurar la vista para usar security_invoker
ALTER VIEW purchase_details SET (security_invoker = true);

-- Nota: Las vistas no necesitan políticas RLS separadas,
-- heredan las políticas de las tablas subyacentes

-- 6. Función para generar contraseña de acceso
CREATE OR REPLACE FUNCTION generate_access_password()
RETURNS TEXT AS $$
BEGIN
  RETURN substring(md5(random()::text) from 1 for 12);
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para generar contraseña automáticamente si no se proporciona
CREATE OR REPLACE FUNCTION set_access_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es una compra de invitado (sin user_id) y no tiene contraseña, generarla
  IF NEW.user_id IS NULL AND NEW.access_password IS NULL THEN
    NEW.access_password := generate_access_password();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_access_password_trigger
  BEFORE INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION set_access_password();

-- Comentarios de documentación
COMMENT ON COLUMN purchases.customer_email IS 'Email del cliente (para invitados)';
COMMENT ON COLUMN purchases.customer_name IS 'Nombre del cliente (para invitados)';
COMMENT ON COLUMN purchases.customer_phone IS 'Teléfono del cliente (para invitados)';
COMMENT ON COLUMN purchases.access_password IS 'Contraseña de acceso (para invitados)';
COMMENT ON COLUMN purchases.payment_method IS 'Método de pago usado';
COMMENT ON COLUMN purchases.mercadopago_status IS 'Estado del pago en MercadoPago';
COMMENT ON COLUMN purchases.mercadopago_status_detail IS 'Detalle del estado del pago';
