import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../../../context/MockDataContext'
import Icon from '../../../components/Icon/Icon'
import { easeOutQuint } from '../../../lib/motion'
import styles from './AboutSection.module.css'

export default function AboutSection({ onNotice }) {
  const { currentUser, updateAbout } = useMockData()
  const [isEditing, setIsEditing] = useState(false)
  const [bioDraft, setBioDraft] = useState(currentUser.about)

  function handleStartEditing() {
    setBioDraft(currentUser.about)
    setIsEditing(true)
  }

  function handleCancelEditing() {
    setBioDraft(currentUser.about)
    setIsEditing(false)
  }

  function handleSave(event) {
    event.preventDefault()
    const result = updateAbout(bioDraft)
    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not update about section')
      return
    }

    setIsEditing(false)
    onNotice?.('About updated')
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>About</h2>
        {!isEditing ? (
          <button
            type="button"
            className={styles.editBtn}
            aria-label="Edit about"
            onClick={handleStartEditing}
          >
            <Icon name="pencil" size={18} />
          </button>
        ) : (
          <button
            type="button"
            className={styles.editBtn}
            aria-label="Cancel about edit"
            onClick={handleCancelEditing}
          >
            <Icon name="x" size={18} />
          </button>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {!isEditing ? (
          <Motion.div
            key="display"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: easeOutQuint }}
          >
            {currentUser.about
              ? <p className={styles.bio}>{currentUser.about}</p>
              : <p className={styles.emptyState}>no lore written yet. drop ur origin story. every founder has one (most are fiction).</p>
            }
          </Motion.div>
        ) : (
          <Motion.div
            key="editor"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18, ease: easeOutQuint }}
          >
            <div className={styles.editorWrapper}>
              <form className={styles.form} onSubmit={handleSave}>
                <textarea
                  className={styles.textarea}
                  value={bioDraft}
                  onChange={event => setBioDraft(event.target.value)}
                  autoFocus
                  placeholder="drop the lore here..."
                />
                <div className={styles.actions}>
                  <button type="submit" className={styles.saveBtn}>
                    Save
                  </button>
                  <button type="button" className={styles.cancelBtn} onClick={handleCancelEditing}>
                    Cancel
                  </button>
                </div>
              </form>
              <div className={styles.editorHint}>
                <Icon name="sparkles" size={12} />
                <span>drafting the lore</span>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

