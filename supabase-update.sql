-- ========================================
-- SCRIPT DE ACTUALIZACIÓN INCREMENTAL
-- Ejecutar este script en tu Supabase existente
-- ========================================

-- 1. AGREGAR CAMPO EDAD (solo si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'age'
    ) THEN
        ALTER TABLE profiles ADD COLUMN age INTEGER;
    END IF;
END $$;

-- 2. ACTUALIZAR FUNCIÓN handle_new_user para incluir edad
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, age)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'age')::INTEGER 
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR TABLA WEBPAY (solo si no existe)
CREATE TABLE IF NOT EXISTS webpay_transactions (
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

-- 4. AGREGAR COLUMNAS WEBPAY A PURCHASES (solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'webpay_token'
    ) THEN
        ALTER TABLE purchases ADD COLUMN webpay_token VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'webpay_buy_order'
    ) THEN
        ALTER TABLE purchases ADD COLUMN webpay_buy_order VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'webpay_authorization_code'
    ) THEN
        ALTER TABLE purchases ADD COLUMN webpay_authorization_code VARCHAR(255);
    END IF;
END $$;

-- 5. CREAR ÍNDICES (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_webpay_transactions_token ON webpay_transactions(token);
CREATE INDEX IF NOT EXISTS idx_webpay_transactions_user_id ON webpay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_webpay_transactions_status ON webpay_transactions(status);
CREATE INDEX IF NOT EXISTS idx_purchases_webpay_token ON purchases(webpay_token);

-- 6. HABILITAR RLS EN WEBPAY_TRANSACTIONS
ALTER TABLE webpay_transactions ENABLE ROW LEVEL SECURITY;

-- 7. CREAR POLÍTICAS RLS (DROP IF EXISTS para evitar errores)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias transacciones WebPay" ON webpay_transactions;
CREATE POLICY "Usuarios pueden ver sus propias transacciones WebPay" ON webpay_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear sus propias transacciones WebPay" ON webpay_transactions;
CREATE POLICY "Usuarios pueden crear sus propias transacciones WebPay" ON webpay_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema puede actualizar transacciones WebPay" ON webpay_transactions;
CREATE POLICY "Sistema puede actualizar transacciones WebPay" ON webpay_transactions
  FOR UPDATE USING (true);

-- 8. CREAR TRIGGER PARA UPDATED_AT (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'handle_updated_at_webpay' 
        AND event_object_table = 'webpay_transactions'
    ) THEN
        CREATE TRIGGER handle_updated_at_webpay BEFORE UPDATE ON webpay_transactions
          FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- 9. CREAR FUNCIÓN DE LIMPIEZA
CREATE OR REPLACE FUNCTION clean_expired_webpay_transactions()
RETURNS void AS $$
BEGIN
  DELETE FROM webpay_transactions 
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. MIGRACIÓN DE DATOS EXISTENTES
-- Crear perfiles para usuarios que no los tengan
INSERT INTO public.profiles (id, full_name, avatar_url, age)
SELECT 
    au.id,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.raw_user_meta_data->>'avatar_url' as avatar_url,
    CASE 
        WHEN au.raw_user_meta_data->>'age' IS NOT NULL 
        THEN (au.raw_user_meta_data->>'age')::INTEGER 
        ELSE NULL 
    END as age
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- 11. MOSTRAR RESUMEN DE LA ACTUALIZACIÓN
SELECT 
    'Usuarios totales' as tipo,
    COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
    'Perfiles totales' as tipo,
    COUNT(*) as cantidad
FROM public.profiles
UNION ALL
SELECT 
    'Perfiles con edad' as tipo,
    COUNT(*) as cantidad
FROM public.profiles 
WHERE age IS NOT NULL
UNION ALL
SELECT 
    'Tablas WebPay creadas' as tipo,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webpay_transactions') 
         THEN 1 ELSE 0 END as cantidad;
