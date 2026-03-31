-- ============================================================================
-- ONBOARDING: Production Readiness
-- - explicit onboarding completion tracking
-- - storage bucket/policies for avatar uploads
-- ============================================================================

alter table public.profiles
    add column if not exists onboarding_completed_at timestamptz;

-- Backfill completion for obviously completed profiles.
update public.profiles
set onboarding_completed_at = coalesce(onboarding_completed_at, updated_at, now())
where onboarding_completed_at is null
  and (
    trim(coalesce(job, '')) <> 'Aspiring Thought Leader'
    or trim(coalesce(bio, '')) <> ''
    or jsonb_array_length(coalesce(skills, '[]'::jsonb)) > 0
    or jsonb_array_length(coalesce(experience, '[]'::jsonb)) > 0
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars"
    on storage.objects for select
    using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload own avatars" on storage.objects;
create policy "Authenticated users can upload own avatars"
    on storage.objects for insert
    with check (
        bucket_id = 'avatars'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "Authenticated users can update own avatars" on storage.objects;
create policy "Authenticated users can update own avatars"
    on storage.objects for update
    using (
        bucket_id = 'avatars'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "Authenticated users can delete own avatars" on storage.objects;
create policy "Authenticated users can delete own avatars"
    on storage.objects for delete
    using (
        bucket_id = 'avatars'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
