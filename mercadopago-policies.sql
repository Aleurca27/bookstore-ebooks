-- Paso 3: Configurar seguridad para la tabla mercadopago_transactions

-- Habilitar RLS
ALTER TABLE mercadopago_transactions ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean sus propias transacciones
CREATE POLICY "Users can view own mercadopago transactions"
    ON mercadopago_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Política para que usuarios inserten sus propias transacciones
CREATE POLICY "Users can insert own mercadopago transactions"
    ON mercadopago_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para actualizar transacciones (para webhooks)
CREATE POLICY "Users can update own mercadopago transactions"
    ON mercadopago_transactions FOR UPDATE
    USING (auth.uid() = user_id);
