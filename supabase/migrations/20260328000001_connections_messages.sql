-- ============================================================================
-- CONNECTIONS TABLE
-- LinkedIn-style connection requests (pending → accepted/declined)
-- ============================================================================
create table public.connections (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references public.profiles(id) on delete cascade,
    addressee_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'declined')),
    created_at timestamptz not null default now(),
    unique (requester_id, addressee_id),
    check (requester_id <> addressee_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- Direct messages. Conversation = normalized (min_id, max_id) pair.
-- Supabase Realtime enabled below.
-- ============================================================================
create table public.messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid not null references public.profiles(id) on delete cascade,
    receiver_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    read boolean not null default false,
    created_at timestamptz not null default now(),
    check (sender_id <> receiver_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY — CONNECTIONS
-- ============================================================================
alter table public.connections enable row level security;

create policy "Users can see their own connections"
    on public.connections for select
    using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send connection requests"
    on public.connections for insert
    with check (auth.uid() = requester_id);

create policy "Addressee can update status (accept/decline)"
    on public.connections for update
    using (auth.uid() = addressee_id);

create policy "Requester can delete (withdraw) connections"
    on public.connections for delete
    using (auth.uid() = requester_id);

-- ============================================================================
-- ROW LEVEL SECURITY — MESSAGES
-- ============================================================================
alter table public.messages enable row level security;

create policy "Users can see their own messages"
    on public.messages for select
    using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
    on public.messages for insert
    with check (auth.uid() = sender_id);

create policy "Receiver can mark messages as read"
    on public.messages for update
    using (auth.uid() = receiver_id);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_connections_requester on public.connections(requester_id);
create index idx_connections_addressee on public.connections(addressee_id);
create index idx_connections_status on public.connections(status);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_receiver on public.messages(receiver_id);
create index idx_messages_created on public.messages(created_at desc);

-- ============================================================================
-- ENABLE SUPABASE REALTIME ON MESSAGES
-- ============================================================================
alter publication supabase_realtime add table public.messages;
