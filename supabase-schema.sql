-- Esquema de base de datos para la tienda de ebooks
-- Ejecuta este script en tu panel de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de ebooks
CREATE TABLE ebooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cover_image TEXT,
  file_url TEXT,
  category VARCHAR(100),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,
  age INTEGER,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de compras
CREATE TABLE purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de carrito de compras
CREATE TABLE cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ebook_id)
);

-- Políticas de seguridad RLS (Row Level Security)

-- Ebooks: Todos pueden leer, solo admins pueden escribir
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ebooks son públicos para lectura" ON ebooks
  FOR SELECT USING (true);

CREATE POLICY "Solo admins pueden gestionar ebooks" ON ebooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Profiles: Los usuarios pueden ver y editar su propio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver todos los perfiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Purchases: Los usuarios solo pueden ver sus propias compras
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias compras" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias compras" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cart items: Los usuarios solo pueden gestionar su propio carrito
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden gestionar su propio carrito" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Función para crear perfil automáticamente al registrarse
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

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON ebooks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insertar datos de ejemplo
INSERT INTO ebooks (title, author, description, price, cover_image, category, featured) VALUES
('El Arte de la Programación', 'Juan Pérez', 'Una guía completa para convertirse en un programador experto.', 29.99, 'https://via.placeholder.com/300x400/6366f1/ffffff?text=El+Arte+de+la+Programación', 'Tecnología', true),
('Cocina Mediterránea', 'María García', 'Recetas auténticas de la cocina mediterránea con ingredientes frescos.', 19.99, 'https://via.placeholder.com/300x400/10b981/ffffff?text=Cocina+Mediterránea', 'Gastronomía', true),
('Historia del Arte Moderno', 'Carlos López', 'Un recorrido por los movimientos artísticos más importantes del siglo XX.', 24.99, 'https://via.placeholder.com/300x400/f59e0b/ffffff?text=Historia+del+Arte', 'Arte', false),
('Finanzas Personales', 'Ana Rodríguez', 'Aprende a gestionar tu dinero y planificar tu futuro financiero.', 22.99, 'https://via.placeholder.com/300x400/ef4444/ffffff?text=Finanzas+Personales', 'Negocios', true),
('Mindfulness y Meditación', 'David Sánchez', 'Técnicas prácticas para encontrar la paz interior en el mundo moderno.', 16.99, 'https://via.placeholder.com/300x400/8b5cf6/ffffff?text=Mindfulness', 'Bienestar', false);

-- ========================================
-- EXTENSIONES WEBPAY PLUS
-- ========================================

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
CREATE TRIGGER handle_updated_at_webpay BEFORE UPDATE ON webpay_transactions
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
