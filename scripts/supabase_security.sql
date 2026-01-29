-- ==============================================================================
-- SCRIPT DE SEGURIDAD PARA BIOSALUD (Supabase RLS)
-- Autor: Sistema de Auditoría BioLab
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Copia todo este código.
-- 2. Ve a tu Dashboard de Supabase > SQL Editor.
-- 3. Pega el código y ejecútalo.
-- 4. IMPORTANTE: Verifica que la columna 'authId' en tu tabla 'users' se llame exactamente así.
--    Si en tu base de datos se llama 'auth_id' o 'authid', cambia las referencias en este script.
-- ==============================================================================

-- 1. Habilitar RLS (Row Level Security)
-- Esto activa el "cortafuegos" en las tablas. Por defecto, bloqueará todo acceso externo
-- hasta que definamos las políticas abajo.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Función de Seguridad: is_admin()
-- ------------------------------------------------------------------------------
-- Esta función verifica de forma segura si el usuario que hace la petición es Admin.
-- Usamos "SECURITY DEFINER" para que la función pueda leer la tabla users incluso
-- antes de que se apliquen las políticas de lectura.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE "authId" = auth.uid()  -- IMPORTANTE: Asegúrate de que la columna se llama "authId" (con comillas si es CamelCase)
    AND role = 'Admin'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Políticas para la tabla 'users'
-- ------------------------------------------------------------------------------

-- LECTURA: Permitir que cualquier usuario autenticado vea la lista de usuarios.
-- (Necesario para que el sistema muestre "Creado por: Juan Pérez" en los reportes)
DROP POLICY IF EXISTS "Usuarios pueden ver usuarios" ON public.users;
CREATE POLICY "Usuarios pueden ver usuarios"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- CREACIÓN: Solo los Administradores pueden registrar nuevos usuarios.
DROP POLICY IF EXISTS "Admins pueden crear usuarios" ON public.users;
CREATE POLICY "Admins pueden crear usuarios"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- EDICIÓN:
-- Regla 1: Un Admin puede editar a CUALQUIER usuario.
-- Regla 2: Un usuario normal puede editar sus PROPIOS datos (ej. actualizar lastLogin).
DROP POLICY IF EXISTS "Edición de usuarios" ON public.users;
CREATE POLICY "Edición de usuarios"
ON public.users FOR UPDATE
TO authenticated
USING ( public.is_admin() OR "authId" = auth.uid() )
WITH CHECK ( public.is_admin() OR "authId" = auth.uid() );

-- ELIMINACIÓN: Solo Admins pueden borrar usuarios.
DROP POLICY IF EXISTS "Admins pueden borrar usuarios" ON public.users;
CREATE POLICY "Admins pueden borrar usuarios"
ON public.users FOR DELETE
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Trigger Anti-Escalación de Privilegios
-- ------------------------------------------------------------------------------
-- Esta es la protección más crítica. Evita que un usuario técnico edite su propio
-- registro y cambie su rol a 'Admin' mediante una petición maliciosa.
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el usuario actual NO es admin...
  IF NOT public.is_admin() THEN
      -- Y está intentando cambiar la columna 'role' a un valor diferente...
      IF OLD.role IS DISTINCT FROM NEW.role THEN
          RAISE EXCEPTION 'ALERTA DE SEGURIDAD: No tienes permisos para modificar roles.';
      END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_role ON public.users;
CREATE TRIGGER trigger_protect_role
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- ------------------------------------------------------------------------------
-- 5. Políticas para la tabla 'settings'
-- ------------------------------------------------------------------------------

-- LECTURA: Todos necesitan leer la configuración para ver el Logo y Firmas en reportes.
DROP POLICY IF EXISTS "Todos ven configuración" ON public.settings;
CREATE POLICY "Todos ven configuración"
ON public.settings FOR SELECT
TO authenticated
USING (true);

-- MODIFICACIÓN: Solo Admins pueden cambiar configuraciones globales.
DROP POLICY IF EXISTS "Admins modifican configuración" ON public.settings;
CREATE POLICY "Admins modifican configuración"
ON public.settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

