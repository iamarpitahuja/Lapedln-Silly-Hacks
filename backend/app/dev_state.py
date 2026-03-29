"""
In-memory user profile for dev mode. Replaces Supabase reads/writes
when no database is available. Resets on server restart.
"""

DEV_PROFILE = {
    "id": "00000000-0000-0000-0000-000000000000",
    "display_name": "Arjun Malhotra",
    "job": "Finance Bro",
    "bio": "Stealth Founder / Ex-McKinsey Adjacent",
    "avatar_url": None,
    "larp_rating": 67.2,
}

DEV_POSTS = []


def get_profile():
    return {**DEV_PROFILE}


def update_profile(updates: dict):
    DEV_PROFILE.update(updates)
    return {**DEV_PROFILE}


def add_post(post: dict):
    DEV_POSTS.insert(0, post)
    return post


def get_posts():
    return list(DEV_POSTS)
