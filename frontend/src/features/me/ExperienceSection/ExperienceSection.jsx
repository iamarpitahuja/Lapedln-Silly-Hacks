import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../../../context/MockDataContext'
import { getInitials } from '../../../utils/strings'
import Icon from '../../../components/Icon/Icon'
import { easeOutQuint } from '../../../lib/motion'
import styles from './ExperienceSection.module.css'

const EMPTY_EXPERIENCE = {
  title: '',
  company: '',
  dates: '',
  description: '',
}

function toDraft(entry) {
  return {
    title: entry.title ?? '',
    company: entry.company ?? '',
    dates: entry.dates ?? '',
    description: entry.description ?? '',
  }
}

export default function ExperienceSection({ onNotice }) {
  const { currentUser, addExperience, updateExperience, removeExperience } = useMockData()
  const [isAdding, setIsAdding] = useState(false)
  const [newDraft, setNewDraft] = useState(EMPTY_EXPERIENCE)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(EMPTY_EXPERIENCE)

  function handleAddSubmit(event) {
    event.preventDefault()
    const result = addExperience(newDraft)
    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not add experience')
      return
    }

    setNewDraft(EMPTY_EXPERIENCE)
    setIsAdding(false)
    onNotice?.('Experience added')
  }

  function handleEditSubmit(event) {
    event.preventDefault()
    if (!editingId) return

    const result = updateExperience({
      id: editingId,
      updates: editDraft,
    })

    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not save experience')
      return
    }

    setEditingId(null)
    setEditDraft(EMPTY_EXPERIENCE)
    onNotice?.('Experience updated')
  }

  function handleDelete(id) {
    const result = removeExperience(id)
    onNotice?.(result.ok ? 'Experience removed' : result.error)
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Experience</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Add experience"
            onClick={() => {
              setIsAdding(true)
              setEditingId(null)
            }}
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
            <form className={styles.editor} onSubmit={handleAddSubmit}>
              <input
                placeholder="Title (e.g. Chief Warlock)"
                value={newDraft.title}
                onChange={event => setNewDraft(existing => ({ ...existing, title: event.target.value }))}
              />
              <input
                placeholder="Guild / Company"
                value={newDraft.company}
                onChange={event => setNewDraft(existing => ({ ...existing, company: event.target.value }))}
              />
              <input
                placeholder="Dates of service"
                value={newDraft.dates}
                onChange={event => setNewDraft(existing => ({ ...existing, dates: event.target.value }))}
              />
              <textarea
                placeholder="what did you even do there..."
                value={newDraft.description}
                onChange={event =>
                  setNewDraft(existing => ({ ...existing, description: event.target.value }))
                }
              />
              <div className={styles.editorActions}>
                <button type="submit" className={styles.primaryBtn}>
                  Save the W
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setIsAdding(false)
                    setNewDraft(EMPTY_EXPERIENCE)
                  }}
                >
                  Discard
                </button>
              </div>
            </form>
          </Motion.div>
        )}
      </AnimatePresence>
      <div className={styles.roles}>
        {currentUser.experience.length === 0 && (
          <p className={styles.emptyState}>no W's logged yet. add ur first fake role.</p>
        )}
        {currentUser.experience.map(role => (
          <article key={role.id} className={styles.role}>
            <div className={styles.logoPlaceholder}>{getInitials(role.company)}</div>
            <div className={styles.roleInfo}>
              <AnimatePresence mode="wait" initial={false}>
                {editingId === role.id ? (
                  <Motion.div
                    key={`editor-${role.id}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18, ease: easeOutQuint }}
                  >
                    <div className={styles.editorWrapper}>
                      <form className={styles.editor} onSubmit={handleEditSubmit}>
                        <input
                          placeholder="Title"
                          value={editDraft.title}
                          onChange={event =>
                            setEditDraft(existing => ({ ...existing, title: event.target.value }))
                          }
                        />
                        <input
                          placeholder="Company"
                          value={editDraft.company}
                          onChange={event =>
                            setEditDraft(existing => ({ ...existing, company: event.target.value }))
                          }
                        />
                        <input
                          placeholder="Dates"
                          value={editDraft.dates}
                          onChange={event =>
                            setEditDraft(existing => ({ ...existing, dates: event.target.value }))
                          }
                        />
                        <textarea
                          placeholder="Description"
                          value={editDraft.description}
                          onChange={event =>
                            setEditDraft(existing => ({ ...existing, description: event.target.value }))
                          }
                        />
                        <div className={styles.editorActions}>
                          <button type="submit" className={styles.primaryBtn}>
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => {
                              setEditingId(null)
                              setEditDraft(EMPTY_EXPERIENCE)
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </Motion.div>
                ) : (
                  <Motion.div
                    key={`display-${role.id}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: easeOutQuint }}
                  >
                    <div className={styles.rowHead}>
                      <p className={styles.roleTitle}>{role.title}</p>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.rowBtn}
                          aria-label={`Edit ${role.title}`}
                          onClick={() => {
                            setIsAdding(false)
                            setEditingId(role.id)
                            setEditDraft(toDraft(role))
                          }}
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.rowBtn}
                          aria-label={`Delete ${role.title}`}
                          onClick={() => handleDelete(role.id)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                    <p className={styles.company}>{role.company}</p>
                    <p className={styles.dates}>{role.dates}</p>
                    <p className={styles.description}>{role.description}</p>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

