import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchUserProfile } from '../../services/api'
import LarpRatingBadge from '../../components/LarpRatingBadge/LarpRatingBadge'
import Icon from '../../components/Icon/Icon'
import { getInitials } from '../../utils/strings'
import { useMockData } from '../../context/MockDataContext'
import styles from './PublicProfile.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function toArray(val) {
  return Array.isArray(val) ? val : []
}

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useMockData()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isOwnProfile = currentUser?.id === userId

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/me', { replace: true })
      return
    }

    async function load() {
      setLoading(true)
      try {
        const data = await fetchUserProfile(userId)
        setProfile(data)
      } catch {
        setError('Could not load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, isOwnProfile, navigate])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p className={styles.loading}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p className={styles.error}>{error || 'Profile not found'}</p>
        </div>
      </div>
    )
  }

  const name = profile.display_name || 'Anonymous Larper'
  const job = profile.job || profile.title || 'Aspiring Thought Leader'
  const bio = profile.bio || ''
  const avatar = profile.avatar_url || null
  const coverPhoto = profile.cover_photo_url || null
  const larpRating = Number(profile.larp_rating ?? 0)
  const stats = profile.stats ?? {}
  const experience = toArray(profile.experience)
  const education = toArray(profile.education)
  const skills = toArray(profile.skills)
  const larpHistory = toArray(profile.larp_history)
  const glazesReceived = toArray(profile.glazes_received)

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Hero */}
        <div className={styles.heroCard}>
          <div
            className={styles.coverPhoto}
            style={coverPhoto ? { backgroundImage: `url(${coverPhoto})` } : {}}
          />
          <div className={styles.heroBody}>
            <div className={styles.avatarWrap}>
              {avatar ? (
                <img src={avatar} alt={name} className={styles.avatarImg} />
              ) : (
                <div className={styles.avatar} style={{ background: getAvatarColor(name) }}>
                  {getInitials(name)}
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h1 className={styles.heroName}>{name}</h1>
              <p className={styles.heroHeadline}>{job}</p>
              <div className={styles.badgeRow}>
                <LarpRatingBadge rating={larpRating} size="small" />
              </div>
              <p className={styles.recruiterStat}>
                {stats.recruiterViews ?? 0} recruiters are monitoring their trajectory.
              </p>
            </div>
            <button
              className={styles.dmBtn}
              onClick={() => navigate(`/messaging?userId=${encodeURIComponent(userId)}`)}
            >
              <Icon name="message-square" size={16} />
              Message
            </button>
          </div>
        </div>

        {/* About */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          {bio
            ? <p className={styles.bio}>{bio}</p>
            : <p className={styles.emptyState}>This thought leader has yet to craft their personal brand narrative.</p>}
        </section>

        {/* Experience */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Experience</h2>
          {experience.length > 0 ? (
            <div className={styles.list}>
              {experience.map((exp, i) => (
                <div key={exp.id || i} className={styles.listItem}>
                  <div className={styles.logoPlaceholder}>
                    {(exp.company || '?')[0].toUpperCase()}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{exp.title}</span>
                    <span className={styles.itemSub}>{exp.company}</span>
                    {exp.dates ? <span className={styles.itemDates}>{exp.dates}</span> : null}
                    {exp.description ? <p className={styles.itemDesc}>{exp.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No experience listed. Still in stealth mode.</p>
          )}
        </section>

        {/* Education */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>
          {education.length > 0 ? (
            <div className={styles.list}>
              {education.map((edu, i) => (
                <div key={edu.id || i} className={styles.listItem}>
                  <div className={styles.logoPlaceholder}>
                    {(edu.school || '?')[0].toUpperCase()}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{edu.school}</span>
                    <span className={styles.itemSub}>{edu.degree}</span>
                    {edu.dates ? <span className={styles.itemDates}>{edu.dates}</span> : null}
                    {edu.activities ? <p className={styles.itemDesc}>{edu.activities}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No credentials listed. A self-made disruptor.</p>
          )}
        </section>

        {/* Skills */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          {skills.length > 0 ? (
            <div className={styles.skillsList}>
              {skills.map((skill, i) => (
                <div key={skill.id || i} className={styles.skillChip}>
                  <span className={styles.skillName}>{skill.name}</span>
                  {skill.endorsements > 0 ? (
                    <span className={styles.endorsements}>{skill.endorsements} endorsements</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No skills endorsed yet. Pure bandwidth.</p>
          )}
        </section>

        {/* Larp History */}
        {larpHistory.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Larp History</h2>
            <div className={styles.timeline}>
              {larpHistory.map((entry, i) => (
                <div key={entry.id || i} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineDate}>{entry.date}</span>
                    <span className={styles.timelineText}>
                      {entry.from} &rarr; {entry.to}
                    </span>
                    {entry.note ? <p className={styles.timelineNote}>{entry.note}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Glazes Received */}
        {glazesReceived.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Glazes Received</h2>
            <div className={styles.glazesList}>
              {glazesReceived.map((glaze, i) => (
                <div key={i} className={styles.glazeCard}>
                  <Icon name="sparkles" size={14} className={styles.glazeIcon} />
                  <p className={styles.glazeText}>{typeof glaze === 'string' ? glaze : glaze.content ?? ''}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
