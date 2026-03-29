-- ============================================================================
-- FULL BACKEND INTEGRATION SUPPORT
-- - extend profiles for rich Me-page fields
-- - add comments + relarps tables for feed interactions
-- ============================================================================

-- ---- profiles extensions ----
alter table public.profiles
    add column if not exists cover_photo_url text,
    add column if not exists persona text default '',
    add column if not exists stats jsonb not null default '{"recruiterViews":0,"impressionVelocity":"Unknown","weeklyAuraGrowth":0,"weeklyAuraGrowthPct":"+0%"}'::jsonb,
    add column if not exists glazers jsonb not null default '[]'::jsonb,
    add column if not exists larp_status jsonb not null default '{"opportunities":[]}'::jsonb,
    add column if not exists experience jsonb not null default '[]'::jsonb,
    add column if not exists education jsonb not null default '[]'::jsonb,
    add column if not exists skills jsonb not null default '[]'::jsonb,
    add column if not exists larp_history jsonb not null default '[]'::jsonb,
    add column if not exists glazes_received jsonb not null default '[]'::jsonb;

-- ---- comments ----
create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts(id) on delete cascade,
    author_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "Users can view comments on visible posts" on public.comments;
create policy "Users can view comments on visible posts"
    on public.comments for select
    using (
        exists (
            select 1
            from public.posts
            where posts.id = post_id
        )
    );

drop policy if exists "Users can create own comments" on public.comments;
create policy "Users can create own comments"
    on public.comments for insert
    with check (auth.uid() = author_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
    on public.comments for delete
    using (auth.uid() = author_id);

create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_comments_created on public.comments(created_at desc);

-- ---- relarps ----
create table if not exists public.relarps (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    commentary text not null default '',
    created_at timestamptz not null default now(),
    unique (post_id, user_id)
);

alter table public.relarps enable row level security;

drop policy if exists "Users can view relarps on visible posts" on public.relarps;
create policy "Users can view relarps on visible posts"
    on public.relarps for select
    using (
        exists (
            select 1
            from public.posts
            where posts.id = post_id
        )
    );

drop policy if exists "Users can create own relarps" on public.relarps;
create policy "Users can create own relarps"
    on public.relarps for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own relarps" on public.relarps;
create policy "Users can delete own relarps"
    on public.relarps for delete
    using (auth.uid() = user_id);

create index if not exists idx_relarps_post on public.relarps(post_id);
create index if not exists idx_relarps_user on public.relarps(user_id);