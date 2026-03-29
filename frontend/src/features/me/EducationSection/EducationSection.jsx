import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../../../context/MockDataContext'
import { getInitials } from '../../../utils/strings'
import Icon from '../../../components/Icon/Icon'
import { easeOutQuint } from '../../../lib/motion'
import styles from './EducationSection.module.css'

const EMPTY_EDUCATION = {
  school: '',
  degree: '',
  dates: '',
  activities: '',
}

function toDraft(entry) {
  return {
    school: entry.school ?? '',
    degree: entry.degree ?? '',
    dates: entry.dates ?? '',
    activities: entry.activities ?? '',
  }
}

export default function EducationSection({ onNotice }) {
  const { currentUser, addEducation, updateEducation, removeEducation } = useMockData()
  const [isAdding, setIsAdding] = useState(false)
  const [newDraft, setNewDraft] = useState(EMPTY_EDUCATION)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(EMPTY_EDUCATION)

  function handleAddSubmit(event) {
    event.preventDefault()
    const result = addEducation(newDraft)
    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not add education')
      return
    }

    setNewDraft(EMPTY_EDUCATION)
    setIsAdding(false)
    onNotice?.('Education added')
  }

  function handleEditSubmit(event) {
    event.preventDefault()
    if (!editingId) return

    const result = updateEducation({
      id: editingId,
      updates: editDraft,
    })

    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not save education')
      return
    }

    setEditingId(null)
    setEditDraft(EMPTY_EDUCATION)
    onNotice?.('Education updated')
  }

  function handleDelete(id) {
    const result = removeEducation(id)
    onNotice?.(result.ok ? 'Education removed' : result.error)
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Education</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Add education"
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
                placeholder="Academy / Monastery / School"
                value={newDraft.school}
                onChange={event =>
                  setNewDraft(existing => ({ ...existing, school: event.target.value }))
                }
              />
              <input
                placeholder="Degree or Field of Study"
                value={newDraft.degree}
                onChange={event =>
                  setNewDraft(existing => ({ ...existing, degree: event.target.value }))
                }
              />
              <input
                placeholder="Years of Training"
                value={newDraft.dates}
                onChange={event => setNewDraft(existing => ({ ...existing, dates: event.target.value }))}
              />
              <textarea
                placeholder="Activities and Societies"
                value={newDraft.activities}
                onChange={event =>
                  setNewDraft(existing => ({ ...existing, activities: event.target.value }))
                }
              />
              <div className={styles.editorActions}>
                <button type="submit" className={styles.primaryBtn}>
                  Enroll
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setIsAdding(false)
                    setNewDraft(EMPTY_EDUCATION)
                  }}
                >
                  Discard
                </button>
              </div>
            </form>
          </Motion.div>
        )}
      </AnimatePresence>
      <div className={styles.entries}>
        {currentUser.education.length === 0 && (
          <p className={styles.emptyState}>No credentials listed. Add an institution to signal your intellectual capital.</p>
        )}
        {currentUser.education.map(entry => (
          <article key={entry.id} className={styles.entry}>
            <div className={styles.logoPlaceholder}>{getInitials(entry.school)}</div>
            <div className={styles.entryInfo}>
              <AnimatePresence mode="wait" initial={false}>
                {editingId === entry.id ? (
                  <Motion.div
                    key={`editor-${entry.id}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18, ease: easeOutQuint }}
                  >
                    <div className={styles.editorWrapper}>
                      <form className={styles.editor} onSubmit={handleEditSubmit}>
                        <input
                          placeholder="School"
                          value={editDraft.school}
                          onChange={event =>
                            setEditDraft(existing => ({ ...existing, school: event.target.value }))
                          }
                        />
                        <input
                          placeholder="Degree"
                          value={editDraft.degree}
                          onChange={event =>
                            setEditDraft(existing => ({ ...existing, degree: event.target.value }))
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
                          placeholder="Activities"
                          value={editDraft.activities}
                          onChange={event =>
                            setEditDraft(existing => ({ ...existing, activities: event.target.value }))
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
                              setEditDraft(EMPTY_EDUCATION)
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
                    key={`display-${entry.id}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: easeOutQuint }}
                  >
                    <div className={styles.rowHead}>
                      <p className={styles.school}>{entry.school}</p>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.rowBtn}
                          aria-label={`Edit ${entry.school}`}
                          onClick={() => {
                            setIsAdding(false)
                            setEditingId(entry.id)
                            setEditDraft(toDraft(entry))
                          }}
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.rowBtn}
                          aria-label={`Delete ${entry.school}`}
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                    <p className={styles.degree}>{entry.degree}</p>
                    <p className={styles.dates}>{entry.dates}</p>
                    {entry.activities && (
                      <p className={styles.activities}>Activities: {entry.activities}</p>
                    )}
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

