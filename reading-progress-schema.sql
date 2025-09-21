-- Script para crear tabla de progreso de lectura
-- Ejecutar en el SQL Editor de Supabase

-- Crear tabla para el progreso de lectura
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_chapter INTEGER DEFAULT 1,
    total_chapters INTEGER DEFAULT 1,
    last_read TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ebook_id)
);

-- Crear índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_ebook_id ON reading_progress(ebook_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON reading_progress(last_read);

-- Habilitar RLS (Row Level Security)
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- Los usuarios solo pueden ver su propio progreso
CREATE POLICY "Users can view own reading progress"
    ON reading_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Los usuarios pueden insertar su propio progreso
CREATE POLICY "Users can insert own reading progress"
    ON reading_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio progreso
CREATE POLICY "Users can update own reading progress"
    ON reading_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Los administradores pueden ver todo el progreso
CREATE POLICY "Admins can view all reading progress"
    ON reading_progress FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reading_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_read = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
CREATE TRIGGER update_reading_progress_updated_at
    BEFORE UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_progress_updated_at();

-- Insertar algunos datos de ejemplo (opcional)
INSERT INTO reading_progress (user_id, ebook_id, progress, last_chapter, total_chapters) 
VALUES 
-- Reemplaza estos UUIDs con los reales de tu base de datos
-- ('user-uuid-aqui', 'ebook-uuid-aqui', 75, 6, 8),
-- ('user-uuid-aqui', 'ebook-uuid-aqui', 45, 3, 8)
ON CONFLICT (user_id, ebook_id) DO NOTHING;
