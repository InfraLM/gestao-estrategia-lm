CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.profiles(user_id,display_name,email,cargo)
 VALUES(NEW.id,COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''),NULLIF(NEW.raw_user_meta_data->>'full_name',''),NEW.email),NEW.email,NULLIF(NEW.raw_user_meta_data->>'cargo',''));
 RETURN NEW;
END; $$;