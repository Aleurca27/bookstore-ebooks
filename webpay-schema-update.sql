-- Actualización del esquema para WebPay Plus
-- Ejecuta este script DESPUÉS del esquema principal

-- Tabla para transacciones de WebPay
CREATE TABLE webpay_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  buy_order VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  authorization_code VARCHAR(255),
  webpay_response JSONB,
  cart_items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar tabla de compras para incluir información de WebPay
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS webpay_token VARCHAR(255);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS webpay_buy_order VARCHAR(255);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS webpay_authorization_code VARCHAR(255);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_webpay_transactions_token ON webpay_transactions(token);
CREATE INDEX idx_webpay_transactions_user_id ON webpay_transactions(user_id);
CREATE INDEX idx_webpay_transactions_status ON webpay_transactions(status);
CREATE INDEX idx_purchases_webpay_token ON purchases(webpay_token);

-- Políticas de seguridad RLS para webpay_transactions
ALTER TABLE webpay_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias transacciones WebPay" ON webpay_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias transacciones WebPay" ON webpay_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo el sistema puede actualizar las transacciones (para confirmaciones)
CREATE POLICY "Sistema puede actualizar transacciones WebPay" ON webpay_transactions
  FOR UPDATE USING (true);

-- Trigger para updated_at en webpay_transactions
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON webpay_transactions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Función para limpiar transacciones expiradas (opcional)
CREATE OR REPLACE FUNCTION clean_expired_webpay_transactions()
RETURNS void AS $$
BEGIN
  -- Eliminar transacciones pendientes de más de 24 horas
  DELETE FROM webpay_transactions 
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE webpay_transactions IS 'Registro de transacciones de WebPay Plus';
COMMENT ON COLUMN webpay_transactions.token IS 'Token único de WebPay para la transacción';
COMMENT ON COLUMN webpay_transactions.buy_order IS 'Número de orden de compra';
COMMENT ON COLUMN webpay_transactions.session_id IS 'ID de sesión único';
COMMENT ON COLUMN webpay_transactions.webpay_response IS 'Respuesta completa de WebPay en formato JSON';
