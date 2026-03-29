-- ============================================================================
-- LARP PLATFORM: Initial Schema
-- Satirical hyper-gamified professional networking
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null default 'Anonymous Larper',
    title text not null default 'Aspiring Thought Leader',
    bio text default '',
    avatar_url text,
    larp_rating numeric(10, 2) not null default 0.00,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on column public.profiles.larp_rating is
    'The sacred number. Higher = more prestigious corporate larping detected.';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Anonymous Larper'));
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. POSTS TABLE
-- ============================================================================
create table public.posts (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    post_type text not null default 'thought_leadership' check (post_type in (
        'thought_leadership', 'humble_brag', 'announcement', 'hot_take', 'glaze'
    )),
    buzzword_score numeric(10, 2) default 0.00,
    created_at timestamptz not null default now()
);

comment on column public.posts.buzzword_score is
    'AI-evaluated density of corporate buzzwords in this post.';

-- ============================================================================
-- 3. GLAZES TABLE (satirical compliments generated per post)
-- ============================================================================
create table public.glazes (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts(id) on delete cascade,
    glazer_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    glaze_type text not null default 'organic' check (glaze_type in (
        'organic', 'ai_generated', 'premium_glaze'
    )),
    created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. ROLEPLAY SESSIONS TABLE (LarpMaxxing hub)
-- ============================================================================
create table public.roleplay_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    character_id text not null,
    conversation_history jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger roleplay_sessions_updated_at
    before update on public.roleplay_sessions
    for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- ---- PROFILES ----
alter table public.profiles enable row level security;

create policy "Users can view all profiles"
    on public.profiles for select
    using (true);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- ---- POSTS: THE SOCIAL BLINDNESS RULE ----
-- When querying the feed, users can ONLY see posts from authors whose
-- LarpRating is less than or equal to their own. The elite are invisible
-- to the lower tiers. You cannot see what you have not earned.
alter table public.posts enable row level security;

create policy "Social Blindness: hide posts from higher-rated users"
    on public.posts for select
    using (
        (select p.larp_rating from public.profiles p where p.id = author_id)
        <=
        (select p.larp_rating from public.profiles p where p.id = auth.uid())
    );

create policy "Users can create posts"
    on public.posts for insert
    with check (auth.uid() = author_id);

create policy "Users can delete own posts"
    on public.posts for delete
    using (auth.uid() = author_id);

-- ---- GLAZES ----
alter table public.glazes enable row level security;

create policy "Glazes visible on visible posts"
    on public.glazes for select
    using (
        exists (
            select 1 from public.posts
            where posts.id = post_id
        )
    );

create policy "Users can create glazes"
    on public.glazes for insert
    with check (auth.uid() = glazer_id);

-- ---- ROLEPLAY SESSIONS ----
alter table public.roleplay_sessions enable row level security;

create policy "Users can manage own roleplay sessions"
    on public.roleplay_sessions for all
    using (auth.uid() = user_id);

-- ============================================================================
-- 6. INDEXES
-- ============================================================================
create index idx_posts_author on public.posts(author_id);
create index idx_posts_created on public.posts(created_at desc);
create index idx_glazes_post on public.glazes(post_id);
create index idx_profiles_larp_rating on public.profiles(larp_rating desc);
create index idx_roleplay_user on public.roleplay_sessions(user_id);

-- ============================================================================
-- 7. SERVICE ROLE FUNCTION: Update LarpRating (called from FastAPI)
-- ============================================================================
create or replace function public.update_larp_rating(
    target_user_id uuid,
    rating_delta numeric
)
returns numeric
language plpgsql
security definer
as $$
declare
    new_rating numeric;
begin
    update public.profiles
    set larp_rating = greatest(0, larp_rating + rating_delta)
    where id = target_user_id
    returning larp_rating into new_rating;

    return new_rating;
end;
$$;
