-- CPR GESTION — SCHEMA SECURISE SUPABASE
-- A executer UNE FOIS dans Supabase > SQL Editor avec le role administrateur du projet.
-- Les tables sont uniquement accessibles aux administrateurs CPR explicitement autorises.

CREATE TABLE IF NOT EXISTS public.cpr_admins (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cpr_store (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cpr_store (id, payload, revision)
VALUES (1, '{}'::jsonb, 0)
ON CONFLICT (id) DO NOTHING;

-- Activer RLS sur TOUTES les tables du module CPR.
ALTER TABLE public.cpr_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpr_store ENABLE ROW LEVEL SECURITY;

-- Par defaut, aucun acces depuis le navigateur sans authentification.
REVOKE ALL ON TABLE public.cpr_admins FROM anon, authenticated;
REVOKE ALL ON TABLE public.cpr_store FROM anon, authenticated;
GRANT SELECT ON TABLE public.cpr_admins TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.cpr_store TO authenticated;

-- Chaque utilisateur peut UNIQUEMENT consulter sa propre autorisation admin.
DROP POLICY IF EXISTS cpr_admin_self_read ON public.cpr_admins;
CREATE POLICY cpr_admin_self_read ON public.cpr_admins
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

-- Les donnees CPR ne sont consultables et modifiables que par un compte admin explicite.
DROP POLICY IF EXISTS cpr_store_admin_read ON public.cpr_store;
CREATE POLICY cpr_store_admin_read ON public.cpr_store
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.cpr_admins AS admins
        WHERE admins.user_id = (select auth.uid())
    ));

DROP POLICY IF EXISTS cpr_store_admin_update ON public.cpr_store;
CREATE POLICY cpr_store_admin_update ON public.cpr_store
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.cpr_admins AS admins
        WHERE admins.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.cpr_admins AS admins
        WHERE admins.user_id = (select auth.uid())
    ));

-- Trigger de date de derniere modification (ne contient aucune donnee personnelle).
CREATE OR REPLACE FUNCTION public.cpr_store_timestamp()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS cpr_store_updated_at ON public.cpr_store;
CREATE TRIGGER cpr_store_updated_at
BEFORE UPDATE ON public.cpr_store
FOR EACH ROW EXECUTE FUNCTION public.cpr_store_timestamp();

-- IMPORTANT : ne pas inserer un utilisateur ici sans l'avoir cree dans Auth > Users.
-- Apres la creation de votre compte admin, executer en remplaçant l'e-mail :
--
-- INSERT INTO public.cpr_admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'VOTRE_EMAIL_ADMIN@EXEMPLE.FR'
-- ON CONFLICT (user_id) DO NOTHING;
--
-- Verifier ensuite dans Table Editor > cpr_admins que le compte apparait.
