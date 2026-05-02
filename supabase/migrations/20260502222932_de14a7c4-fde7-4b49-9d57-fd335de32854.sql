-- Adiciona coluna de cargo no perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo text;

-- Atualiza handle_new_user para conceder admin + cargo CTO para Naira
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, cargo)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email = 'naira.yurie@liberdademedicaedu.com.br'
         THEN 'Naira Yurie'
         ELSE COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email) END,
    NEW.email,
    CASE WHEN NEW.email = 'naira.yurie@liberdademedicaedu.com.br' THEN 'CTO' ELSE NULL END
  );

  IF NEW.email = 'naira.yurie@liberdademedicaedu.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Garante o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();