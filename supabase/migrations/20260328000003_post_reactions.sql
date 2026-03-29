-- ============================================================================
-- POST REACTIONS (LIKE / LOVE)
-- ============================================================================

create table if not exists public.post_reactions (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    reaction_type text not null check (reaction_type in ('like', 'love')),
    created_at timestamptz not null default now(),
    unique (post_id, user_id, reaction_type)
);

alter table public.post_reactions enable row level security;

drop policy if exists "Users can view reactions on visible posts" on public.post_reactions;
create policy "Users can view reactions on visible posts"
    on public.post_reactions for select
    using (
        exists (
            select 1
            from public.posts
            where posts.id = post_id
        )
    );

drop policy if exists "Users can create own reactions" on public.post_reactions;
create policy "Users can create own reactions"
    on public.post_reactions for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reactions" on public.post_reactions;
create policy "Users can delete own reactions"
    on public.post_reactions for delete
    using (auth.uid() = user_id);

create index if not exists idx_post_reactions_post on public.post_reactions(post_id);
create index if not exists idx_post_reactions_user on public.post_reactions(user_id);
