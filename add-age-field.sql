-- Script de actualización para agregar campo 'age' a bases de datos existentes
-- Ejecutar este script SOLO si tu base de datos ya existe y no tiene el campo age

-- Agregar columna age SOLO si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'age'
    ) THEN
        ALTER TABLE profiles ADD COLUMN age INTEGER;
    END IF;
END $$;

-- Actualizar la función handle_new_user para incluir age
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
