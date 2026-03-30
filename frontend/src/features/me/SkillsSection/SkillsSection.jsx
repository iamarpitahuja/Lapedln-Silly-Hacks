import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../../../context/MockDataContext'
import Icon from '../../../components/Icon/Icon'
import { easeOutQuint } from '../../../lib/motion'
import styles from './SkillsSection.module.css'

export default function SkillsSection({ onNotice }) {
  const { currentUser, addSkill, removeSkill, endorseSkill } = useMockData()
  const [isAdding, setIsAdding] = useState(false)
  const [skillDraft, setSkillDraft] = useState('')

  function handleAddSkill(event) {
    event.preventDefault()
    if (!skillDraft.trim()) return

    const result = addSkill({ name: skillDraft })
    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not add skill')
      return
    }

    setSkillDraft('')
    setIsAdding(false)
    onNotice?.('Skill added')
  }

  function handleEndorse(skillId) {
    const result = endorseSkill(skillId)
    onNotice?.(result.ok ? 'Endorsement request sent' : result.error)
  }

  function handleRemove(skillId) {
    const result = removeSkill(skillId)
    onNotice?.(result.ok ? 'Skill removed' : result.error)
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Skills & Endorsements</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Add skill"
            onClick={() => setIsAdding(true)}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isAdding && (
          <Motion.div
            className={styles.editorWrapper}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18, ease: easeOutQuint }}
          >
            <form className={styles.skillForm} onSubmit={handleAddSkill}>
              <input
                type="text"
                placeholder="Skill name (e.g. Fireball, Excel)"
                value={skillDraft}
                onChange={event => setSkillDraft(event.target.value)}
                autoFocus
              />
              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryBtn}>
                  Save Skill
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setIsAdding(false)
                    setSkillDraft('')
                  }}
                >
                  Discard
                </button>
              </div>
            </form>
          </Motion.div>
        )}
      </AnimatePresence>
      <div className={styles.skills}>
        {currentUser.skills.length === 0 && (
          <p className={styles.emptyState}>No skills listed. Add your first endorsable competency.</p>
        )}
        {currentUser.skills.map(skill => (
          <article key={skill.id} className={styles.skillRow}>
            <div className={styles.skillInfo}>
              <p className={styles.skillName}>{skill.name}</p>
              <p className={styles.endorseCount}>
                <Icon name="sparkles" size={12} className={styles.sparkleIcon} />
                {skill.endorsements} endorsements
              </p>
            </div>
            <div className={styles.skillActions}>
              <button
                type="button"
                className={styles.endorseBtn}
                onClick={() => handleEndorse(skill.id)}
              >
                Ask for Endorsement
              </button>
              <button
                type="button"
                className={styles.removeBtn}
                aria-label={`Remove ${skill.name}`}
                onClick={() => handleRemove(skill.id)}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

