"""Seed the database with mock users and posts so judges see an active feed."""

import logging
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from passlib.context import CryptContext
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Profile, Post, Connection, Glaze, Comment

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_now = datetime.now(timezone.utc)


SEED_USERS = [
    {
        "id": "seed-chad-0001-0000-000000000001",
        "email": "chad@larp.io",
        "password": "chad1234",
        "display_name": "Chad Synergington III",
        "job": "Chief Disruption Evangelist",
        "bio": "Serial entrepreneur. 3x founder. Turned my morning routine into a SaaS. I don't network — I architect human connection pipelines. My LinkedIn headline once crashed a recruiter's browser. Thought leader by day, thought leader by night.",
        "avatar_url": None,
        "larp_rating": 4.2,
        "persona": "startup_billionaire",
        "skills": ["Synergy Optimization", "Disruptive Innovation", "Growth Hacking", "Blockchain Strategy", "AI-Driven Leadership", "Paradigm Shifting"],
        "experience": [
            {"title": "Chief Disruption Evangelist", "company": "SynergyOS", "duration": "2024 - Present"},
            {"title": "VP of Vibes", "company": "MoonShot Labs", "duration": "2022 - 2024"},
            {"title": "Founder & CEO", "company": "PivotPivotPivot Inc.", "duration": "2020 - 2022"},
        ],
    },
    {
        "id": "seed-priya-0002-0000-000000000002",
        "email": "priya@larp.io",
        "password": "priya1234",
        "display_name": "Priya 'The Optimizer' Sharma",
        "job": "Head of Strategic Buzzword Deployment",
        "bio": "Data-driven. Results-oriented. Passionate about leveraging cross-functional synergies to move the needle. My OKRs have OKRs. Once optimized a standup so hard it became a sitdown. Currently scaling my personal brand at 10x velocity.",
        "avatar_url": None,
        "larp_rating": 3.5,
        "persona": "consulting_clone",
        "skills": ["KPI Architecture", "OKR Optimization", "Stakeholder Whispering", "Full-Stack Management", "Agile Transformation", "Data-Driven Decision Making"],
        "experience": [
            {"title": "Head of Strategic Buzzword Deployment", "company": "BuzzCorp Global", "duration": "2023 - Present"},
            {"title": "Senior Synergy Analyst", "company": "McKinsey Parody Division", "duration": "2021 - 2023"},
        ],
    },
    {
        "id": "seed-devon-0003-0000-000000000003",
        "email": "devon@larp.io",
        "password": "devon1234",
        "display_name": "Devon 'Ship It' Chen",
        "job": "10x Thought Leadership Engineer",
        "bio": "I don't write code. I craft digital experiences that disrupt the fabric of reality. Full-stack visionary. My side projects have side projects. Currently building an AI that generates LinkedIn posts about building AI. It's turtles all the way down.",
        "avatar_url": None,
        "larp_rating": 2.8,
        "persona": "ai_founder",
        "skills": ["AI/ML Evangelism", "Cloud Architecture", "DevOps Philosophy", "Web3 Integration", "Startup Speed", "Vibe Coding"],
        "experience": [
            {"title": "10x Thought Leadership Engineer", "company": "FAANG Reject Academy", "duration": "2023 - Present"},
            {"title": "AI Founder (stealth)", "company": "Definitely Not a Wrapper Inc.", "duration": "2022 - 2023"},
            {"title": "Junior Dev Who Acts Senior", "company": "Stack Overflow Copypasta Ltd", "duration": "2020 - 2022"},
        ],
    },
    {
        "id": "seed-maya-0004-0000-000000000004",
        "email": "maya@larp.io",
        "password": "maya1234",
        "display_name": "Maya 'Manifest' Williams",
        "job": "Director of Corporate Mindfulness & Hustle",
        "bio": "Namaste and also please look at my metrics. I fuse ancient wisdom with modern hustle culture. My morning routine: meditate, journal, cold plunge, check Slack, manifest Series A funding. Holistic but make it corporate.",
        "avatar_url": None,
        "larp_rating": 2.1,
        "persona": "crypto_philosopher",
        "skills": ["Mindful Disruption", "Holistic KPIs", "Strategic Meditation", "Venture Manifesting", "Cross-Functional Healing"],
        "experience": [
            {"title": "Director of Corporate Mindfulness & Hustle", "company": "ZenScale Ventures", "duration": "2024 - Present"},
            {"title": "Chief Wellness Hacker", "company": "Grindful Inc.", "duration": "2022 - 2024"},
        ],
    },
]


SEED_POSTS = [
    # Chad's posts
    {
        "author_idx": 0,
        "content": "Just disrupted my own morning routine by waking up 15 minutes earlier. The ROI on those 15 minutes? Immeasurable. I used them to think about synergy. This is what separates founders from employees. You're welcome for the alpha. 🚀",
        "post_type": "Humblebrag",
        "buzzword_score": 8.7,
        "age_hours": 2,
    },
    {
        "author_idx": 0,
        "content": "Thrilled to announce that after months of leveraging cross-functional paradigm shifts, I've been promoted to Chief Disruption Evangelist. Some people climb ladders. I architect vertical mobility pipelines. #blessed #disruption #thoughtleadership",
        "post_type": "Announcement",
        "buzzword_score": 9.2,
        "age_hours": 18,
    },
    # Priya's posts
    {
        "author_idx": 1,
        "content": "Hot take: if your standup takes more than 2 minutes, you're not agile — you're just standing. I optimized our team's standup to 47 seconds. Productivity increased by 340%. The secret? I removed the 'talking' part. Data-driven decisions only. 📊",
        "post_type": "Hot Take",
        "buzzword_score": 7.9,
        "age_hours": 5,
    },
    {
        "author_idx": 1,
        "content": "Unpopular opinion: every meeting should require a business case, ROI projection, and at least three buzzwords in the invite title or it gets auto-declined. I built a Chrome extension for this. My calendar has never been cleaner. My colleagues have never been angrier.",
        "post_type": "Hot Take",
        "buzzword_score": 8.1,
        "age_hours": 26,
    },
    # Devon's posts
    {
        "author_idx": 2,
        "content": "Just shipped my side project at 3am. It's an AI-powered tool that generates LinkedIn posts about shipping side projects at 3am. We're currently in stealth mode (I'm telling everyone). Looking for a technical co-founder who also doesn't sleep. DM me. 💻",
        "post_type": "Career Lore",
        "buzzword_score": 7.4,
        "age_hours": 8,
    },
    {
        "author_idx": 2,
        "content": "Interviewer: 'Where do you see yourself in 5 years?'\nMe: 'Disrupting the interview process with AI so no one has to answer this question ever again.'\n\nI did not get the job but I did get 47 LinkedIn connection requests from recruiters. Net positive.",
        "post_type": "Career Lore",
        "buzzword_score": 6.8,
        "age_hours": 30,
    },
    # Maya's posts
    {
        "author_idx": 3,
        "content": "Reminder: your personal brand IS your pension. I've been manifesting thought leadership for 6 months and my aura has grown 200%. Traditional retirement accounts could never. The universe rewards those who post consistently. ✨🧘‍♀️",
        "post_type": "Hot Take",
        "buzzword_score": 7.1,
        "age_hours": 12,
    },
    {
        "author_idx": 3,
        "content": "Just completed a 10-day silent retreat where I wasn't allowed to check Slack. The withdrawal was real but I emerged with a 47-slide deck on 'Mindful Scalability.' My manager said it was 'concerning.' I said it was 'paradigm-shifting.' We agreed to disagree.",
        "post_type": "Humblebrag",
        "buzzword_score": 8.3,
        "age_hours": 40,
    },
]


SEED_COMMENTS = [
    {"post_idx": 0, "author_idx": 1, "content": "This is the kind of thought leadership the industry needs. The 15-minute ROI framework should be taught in business schools."},
    {"post_idx": 0, "author_idx": 3, "content": "I tried this but I used the 15 minutes to manifest instead. Different path, same disruptive energy. 🙏"},
    {"post_idx": 2, "author_idx": 0, "content": "47 seconds is still too long. I replaced our standup with a Slack emoji reaction. Green = fine. Fire = not fine. We've saved 7,000 hours annually."},
    {"post_idx": 4, "author_idx": 1, "content": "Stealth mode but telling everyone is the true founder paradox. Respect the hustle. 🫡"},
    {"post_idx": 6, "author_idx": 2, "content": "Your aura growth metrics are insane. What analytics platform are you using for that?"},
    {"post_idx": 7, "author_idx": 0, "content": "47 slides? Those are rookie numbers. My last 'quick sync' had 83 slides and a live demo."},
]


SEED_GLAZES = [
    {"post_idx": 0, "glazer_idx": 1, "content": "A true visionary who understands that time is the ultimate disruptable resource 🚀"},
    {"post_idx": 0, "glazer_idx": 2, "content": "The Elon Musk of morning routines, if Elon actually woke up early"},
    {"post_idx": 2, "glazer_idx": 0, "content": "Priya's optimization skills make McKinsey consultants weep with inadequacy 📊"},
    {"post_idx": 4, "glazer_idx": 3, "content": "The universe aligned to ship this at 3am. Cosmic product-market fit. ✨"},
    {"post_idx": 6, "glazer_idx": 1, "content": "200% aura growth is best-in-class. Most people plateau at 50%. Legendary."},
    {"post_idx": 7, "glazer_idx": 2, "content": "A 47-slide deck on mindfulness is the kind of contradiction the world desperately needs"},
]


async def seed_if_empty(db: AsyncSession) -> None:
    """Populate mock users, posts, comments, and glazes if the DB has no seed users."""
    # Check if already seeded
    result = await db.execute(
        select(func.count()).select_from(User).where(User.email == "chad@larp.io")
    )
    if result.scalar() > 0:
        logger.info("Seed data already present, skipping.")
        return

    logger.info("Seeding database with mock users and posts...")

    # Create users + profiles
    users = []
    for u in SEED_USERS:
        user = User(
            id=u["id"],
            email=u["email"],
            hashed_password=pwd_context.hash(u["password"]),
            display_name=u["display_name"],
            avatar_url=u["avatar_url"],
        )
        db.add(user)

        profile = Profile(
            id=u["id"],
            display_name=u["display_name"],
            job=u["job"],
            bio=u["bio"],
            avatar_url=u["avatar_url"],
            larp_rating=u["larp_rating"],
            persona=u["persona"],
            skills=u["skills"],
            experience=u["experience"],
            onboarding_completed_at=_now - timedelta(days=3),
        )
        db.add(profile)
        users.append(u)

    await db.flush()

    # Create posts
    posts = []
    for p in SEED_POSTS:
        post = Post(
            id=str(uuid4()),
            author_id=users[p["author_idx"]]["id"],
            content=p["content"],
            post_type=p["post_type"],
            buzzword_score=p["buzzword_score"],
            created_at=_now - timedelta(hours=p["age_hours"]),
        )
        db.add(post)
        posts.append(post)

    await db.flush()

    # Create comments
    for c in SEED_COMMENTS:
        comment = Comment(
            id=str(uuid4()),
            post_id=posts[c["post_idx"]].id,
            author_id=users[c["author_idx"]]["id"],
            content=c["content"],
            created_at=_now - timedelta(hours=1),
        )
        db.add(comment)

    # Create glazes
    for g in SEED_GLAZES:
        glaze = Glaze(
            id=str(uuid4()),
            post_id=posts[g["post_idx"]].id,
            glazer_id=users[g["glazer_idx"]]["id"],
            content=g["content"],
            glaze_type="organic",
            created_at=_now - timedelta(hours=1),
        )
        db.add(glaze)

    # Create connections between all seed users (accepted)
    for i, u1 in enumerate(users):
        for u2 in users[i + 1:]:
            conn = Connection(
                id=str(uuid4()),
                requester_id=u1["id"],
                addressee_id=u2["id"],
                status="accepted",
                created_at=_now - timedelta(days=2),
            )
            db.add(conn)

    await db.commit()
    logger.info("Seeded %d users, %d posts, %d comments, %d glazes.", len(users), len(posts), len(SEED_COMMENTS), len(SEED_GLAZES))
