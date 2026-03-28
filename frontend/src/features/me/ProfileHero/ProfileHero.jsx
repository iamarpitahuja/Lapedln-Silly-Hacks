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
    avatar: currentUser.avatar ?? '',
    coverPhoto: currentUser.coverPhoto ?? '',
  }
}

export default function ProfileHero({ onNotice }) {
  const { currentUser, updateProfile } = useMockData()
  const { name, headline, larpRating, persona, stats, avatar, coverPhoto } = currentUser
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

  function handleFileUpload(event, type) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onNotice?.('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target.result
      if (type === 'avatar') {
        setFormValues(prev => ({ ...prev, avatar: dataUrl }))
      } else {
        setFormValues(prev => ({ ...prev, coverPhoto: dataUrl }))
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleFormSubmit(event) {
    event.preventDefault()
    const result = await updateProfile({
      name: formValues.name,
      headline: formValues.headline,
      persona: formValues.persona,
      avatar: formValues.avatar,
      coverPhoto: formValues.coverPhoto,
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
      <div
        className={styles.coverPhoto}
        style={
          isEditing && formValues.coverPhoto
            ? { backgroundImage: `url(${formValues.coverPhoto})` }
            : coverPhoto
              ? { backgroundImage: `url(${coverPhoto})` }
              : {}
        }
      >
        {isEditing && (
          <label className={styles.uploadOverlay} title="Upload cover photo">
            <Icon name="camera" size={24} />
            <input
              type="file"
              className={styles.hiddenInput}
              accept="image/*"
              onChange={e => handleFileUpload(e, 'cover')}
            />
          </label>
        )}
      </div>
      <div className={styles.heroBody}>
        <div className={styles.avatarWrap}>
          {isEditing ? (
            <div className={styles.avatarEditContainer}>
              {formValues.avatar ? (
                <img src={formValues.avatar} alt="Avatar preview" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatar}>{getInitials(name)}</div>
              )}
              <label className={styles.avatarUploadOverlay} title="Upload profile picture">
                <Icon name="camera" size={20} />
                <input
                  type="file"
                  className={styles.hiddenInput}
                  accept="image/*"
                  onChange={e => handleFileUpload(e, 'avatar')}
                />
              </label>
            </div>
          ) : avatar ? (
            <img src={avatar} alt={name} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatar}>{getInitials(name)}</div>
          )}
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Profile Image</label>
                <div className={styles.inputWithAction}>
                  <input
                    type="text"
                    className={styles.input}
                    value={formValues.avatar}
                    onChange={event =>
                      setFormValues(existing => ({ ...existing, avatar: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                  <label className={styles.inlineUploadBtn}>
                    <Icon name="camera" size={16} />
                    <span>Upload</span>
                    <input
                      type="file"
                      className={styles.hiddenInput}
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'avatar')}
                    />
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Banner Image</label>
                <div className={styles.inputWithAction}>
                  <input
                    type="text"
                    className={styles.input}
                    value={formValues.coverPhoto}
                    onChange={event =>
                      setFormValues(existing => ({ ...existing, coverPhoto: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                  <label className={styles.inlineUploadBtn}>
                    <Icon name="camera" size={16} />
                    <span>Upload</span>
                    <input
                      type="file"
                      className={styles.hiddenInput}
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'cover')}
                    />
                  </label>
                </div>
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
