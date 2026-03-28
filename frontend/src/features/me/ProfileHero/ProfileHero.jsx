import { useState } from 'react'
import { useMockData } from '../../../context/MockDataContext'
import LarpRatingBadge from '../../../components/LarpRatingBadge/LarpRatingBadge'
import Icon from '../../../components/Icon/Icon'
import { getInitials } from '../../../utils/strings'
import styles from './ProfileHero.module.css'

function toFormValues(currentUser) {
  return {
    name: currentUser.name,
    headline: currentUser.headline,
    persona: currentUser.persona,
  }
}

export default function ProfileHero({ onNotice }) {
  const { currentUser, updateProfile } = useMockData()
  const { name, headline, larpRating, persona, stats } = currentUser
  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState(toFormValues(currentUser))

  function handleStartEditing() {
    setFormValues(toFormValues(currentUser))
    setIsEditing(true)
  }

  function handleCancelEditing() {
    setFormValues(toFormValues(currentUser))
    setIsEditing(false)
  }

  function handleFormSubmit(event) {
    event.preventDefault()
    const result = updateProfile({
      name: formValues.name,
      headline: formValues.headline,
      persona: formValues.persona,
    })

    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not update profile')
      return
    }

    setIsEditing(false)
    onNotice?.('Profile updated')
  }

  return (
    <div className={styles.card}>
      <div className={styles.coverPhoto} />
      <div className={styles.heroBody}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{getInitials(name)}</div>
          {!isEditing ? (
            <button className={styles.editBtn} aria-label="Edit profile" onClick={handleStartEditing}>
              <Icon name="pencil" size={18} />
            </button>
          ) : (
            <button
              className={styles.editBtn}
              aria-label="Cancel profile edit"
              onClick={handleCancelEditing}
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
        {!isEditing ? (
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{name}</h1>
            <p className={styles.headline}>{headline}</p>
            <div className={styles.badgeRow}>
              <LarpRatingBadge rating={larpRating} size="small" />
            </div>
            <p className={styles.persona}>{persona}</p>
            <p className={styles.recruiterStat}>
              {stats.recruiterViews} recruiters are monitoring your trajectory.
            </p>
          </div>
        ) : (
          <div className={styles.editorWrapper}>
            <form className={styles.form} onSubmit={handleFormSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Real Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formValues.name}
                  onChange={event =>
                    setFormValues(existing => ({ ...existing, name: event.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Professional Headline</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formValues.headline}
                  onChange={event =>
                    setFormValues(existing => ({ ...existing, headline: event.target.value }))
                  }
                  placeholder="e.g. Senior Solutions Architect"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>RPG Persona</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formValues.persona}
                  onChange={event =>
                    setFormValues(existing => ({ ...existing, persona: event.target.value }))
                  }
                  placeholder="e.g. Level 14 Arcane Webweaver"
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveBtn}>
                  Save Profile
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCancelEditing}>
                  Discard
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
