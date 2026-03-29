from app.routers.feed import derive_buzzwords, derive_trending_delusions


def test_derive_trending_delusions_counts_and_sorts():
    posts = [
        {"post_type": "Career Lore"},
        {"post_type": "Humblebrag"},
        {"post_type": "Career Lore"},
        {"post_type": "Aura Farming"},
        {"post_type": "Career Lore"},
        {"post_type": "Humblebrag"},
    ]

    trending = derive_trending_delusions(posts)

    assert trending[0] == "Career Lore · 3 posts"
    assert trending[1] == "Humblebrag · 2 posts"
    assert "Aura Farming · 1 posts" in trending


def test_derive_buzzwords_detects_ranked_terms():
    posts = [
        {"content": "Need more synergy and alignment."},
        {"content": "Velocity and synergy matter for stakeholder impact."},
        {"content": "Roadmap, ownership, and ecosystem scale."},
    ]

    buzzwords = derive_buzzwords(posts)

    assert "Synergy" in buzzwords
    assert "Alignment" in buzzwords
    assert "Velocity" in buzzwords
