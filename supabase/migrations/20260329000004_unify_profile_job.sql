alter table public.profiles
    add column if not exists job text;

update public.profiles
set job = coalesce(nullif(persona, ''), nullif(title, ''), 'Aspiring Thought Leader')
where job is null;

alter table public.profiles
    alter column job set default 'Aspiring Thought Leader';

update public.profiles
set job = 'Aspiring Thought Leader'
where trim(coalesce(job, '')) = '';

alter table public.profiles
    alter column job set not null;

