/*
# Create Ditto community data tables

1. New Tables
- `ditto_posts` stores community reflections shared on the public feed.
- `ditto_posts.id` is the unique post identifier.
- `ditto_posts.author_name` stores the display name shown to the community.
- `ditto_posts.author_handle` stores the display handle shown to the community.
- `ditto_posts.author_mode` records whether the post was shared publicly or incognito.
- `ditto_posts.body` stores the reflection text.
- `ditto_posts.milestone` stores an optional achieved mission label.
- `ditto_posts.created_at` stores when the reflection was shared.
- `mood_updates` stores a person's daily check-in for the shared mood board.
- `mood_updates.id` is the unique check-in identifier.
- `mood_updates.display_name` stores the name or alias shown on the board.
- `mood_updates.mood` stores the selected mood key.
- `mood_updates.created_at` stores when the check-in was made.

2. Security
- Row level security is enabled on both tables.
- This prototype intentionally has no sign-in screen, so anon and authenticated users can read and create shared community content.
- Update and delete policies are included for complete CRUD behavior in the no-auth prototype.

3. Important Notes
- The tables are intentionally shared because the app currently has no account system.
- The frontend still uses a display mode switcher so people can choose how their name appears without creating an account.
*/

CREATE TABLE IF NOT EXISTS public.ditto_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_handle text NOT NULL,
  author_mode text NOT NULL DEFAULT 'incognito' CHECK (author_mode IN ('public', 'incognito')),
  body text NOT NULL,
  milestone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mood_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  mood text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ditto_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read ditto posts" ON public.ditto_posts;
CREATE POLICY "Public can read ditto posts" ON public.ditto_posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create ditto posts" ON public.ditto_posts;
CREATE POLICY "Public can create ditto posts" ON public.ditto_posts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update ditto posts" ON public.ditto_posts;
CREATE POLICY "Public can update ditto posts" ON public.ditto_posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete ditto posts" ON public.ditto_posts;
CREATE POLICY "Public can delete ditto posts" ON public.ditto_posts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can read mood updates" ON public.mood_updates;
CREATE POLICY "Public can read mood updates" ON public.mood_updates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create mood updates" ON public.mood_updates;
CREATE POLICY "Public can create mood updates" ON public.mood_updates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update mood updates" ON public.mood_updates;
CREATE POLICY "Public can update mood updates" ON public.mood_updates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete mood updates" ON public.mood_updates;
CREATE POLICY "Public can delete mood updates" ON public.mood_updates FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS ditto_posts_created_at_idx ON public.ditto_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS mood_updates_created_at_idx ON public.mood_updates (created_at DESC);
