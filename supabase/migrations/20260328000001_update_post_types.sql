alter table public.posts
    drop constraint if exists posts_post_type_check;

alter table public.posts
    alter column post_type set default 'Career Lore',
    add constraint posts_post_type_check check (post_type in (
        'Career Lore', 'Humblebrag', 'Thought Leadership Incident',
        'Aura Farming', 'Corporate Trauma Dump', 'Stealth Build Update', 'Personal Update'
    ));
