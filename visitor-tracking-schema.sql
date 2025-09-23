-- Schema para tracking de visitantes en tiempo real
-- Ejecutar en Supabase SQL Editor

-- Tabla para almacenar visitas de páginas
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla para sesiones activas
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_views INTEGER DEFAULT 1,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_url ON page_visits(page_url);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);

-- RLS (Row Level Security)
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir inserción de visitas (sin autenticación)
CREATE POLICY "Allow anonymous visits" ON page_visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous sessions" ON active_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow session updates" ON active_sessions
  FOR UPDATE USING (true);

-- Políticas para admin (solo lectura)
CREATE POLICY "Admin can read visits" ON page_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('aleurca@gmail.com', 'contacto@emprendecl.com')
    )
  );

CREATE POLICY "Admin can read sessions" ON active_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('aleurca@gmail.com', 'contacto@emprendecl.com')
    )
  );

-- Función para limpiar sesiones inactivas (ejecutar cada hora)
CREATE OR REPLACE FUNCTION clean_inactive_sessions()
RETURNS void AS $$
BEGIN
  -- Eliminar sesiones inactivas por más de 30 minutos
  DELETE FROM active_sessions 
  WHERE last_activity < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de visitantes
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS TABLE (
  total_visits BIGINT,
  unique_visitors BIGINT,
  active_visitors BIGINT,
  visits_today BIGINT,
  visits_this_week BIGINT,
  visits_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM page_visits) as total_visits,
    (SELECT COUNT(DISTINCT session_id) FROM page_visits WHERE created_at >= NOW() - INTERVAL '24 hours') as unique_visitors,
    (SELECT COUNT(*) FROM active_sessions WHERE last_activity >= NOW() - INTERVAL '5 minutes') as active_visitors,
    (SELECT COUNT(*) FROM page_visits WHERE DATE(created_at) = CURRENT_DATE) as visits_today,
    (SELECT COUNT(*) FROM page_visits WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as visits_this_week,
    (SELECT COUNT(*) FROM page_visits WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as visits_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para incrementar page_views
CREATE OR REPLACE FUNCTION increment_page_views(session_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE active_sessions 
  SET 
    page_views = page_views + 1,
    last_activity = NOW()
  WHERE session_id = session_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
