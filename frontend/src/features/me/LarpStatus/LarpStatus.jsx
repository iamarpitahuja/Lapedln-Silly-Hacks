import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockData } from '../../../context/MockDataContext'
import Icon from '../../../components/Icon/Icon'
import styles from './LarpStatus.module.css'

function parseOpportunityDraft(value) {
  return value
    .split(/[\n,]/)
    .map(opportunity => opportunity.trim())
    .filter(Boolean)
}

export default function LarpStatus({ onNotice }) {
  const { currentUser, updateLarpStatus } = useMockData()
  const { job, larpStatus } = currentUser
  const opportunities = larpStatus?.opportunities ?? []
  const [isEditing, setIsEditing] = useState(false)
  const [opportunityDraft, setOpportunityDraft] = useState(opportunities.join('\n'))

  function syncDrafts() {
    setOpportunityDraft(opportunities.join('\n'))
  }

  function handleOpenEditor() {
    syncDrafts()
    setIsEditing(true)
  }

  function handleCancelEditor() {
    syncDrafts()
    setIsEditing(false)
  }

  function handleStatusSave(event) {
    event.preventDefault()
    const result = updateLarpStatus({
      opportunities: parseOpportunityDraft(opportunityDraft),
    })

    if (!result.ok) {
      onNotice?.(result.error ?? 'Could not update larp status')
      return
    }

    setIsEditing(false)
    onNotice?.('Larp status updated')
  }

  return (
    <div className={styles.card}>
      <div className={styles.banner}>
        <div className={styles.bannerHeader}>
          <div className={styles.headerInfo}>
            <span className={styles.dot} />
            <h2 className={styles.title}>Open to Larping</h2>
          </div>
          {!isEditing && (
            <button className={styles.editBtn} aria-label="Edit status" onClick={handleOpenEditor}>
              <Icon name="pencil" size={18} />
            </button>
          )}
        </div>
        
        {!isEditing ? (
          <div className={styles.displayArea}>
            {job
              ? <p className={styles.persona}>{job}</p>
              : <p className={styles.emptyState}>No active persona set. Define the role you are currently performing.</p>
            }
            <div className={styles.pills}>
              {opportunities.length > 0
                ? opportunities.map(type => (
                    <span key={type} className={styles.pill}>{type}</span>
                  ))
                : <p className={styles.emptyState}>No opportunity types listed. Add what roles you are open to.</p>
              }
            </div>
            <div className={styles.actions}>
              <span className={styles.btnOutlined}>Current larp is managed from J*bs</span>
              <button className={styles.btnFilled} onClick={handleOpenEditor}>
                Edit Target Larps
              </button>
              <Link to="/larpmaxxer" className={styles.btnTrain}>
                Train Your Larp
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.editorWrapper}>
            <form className={styles.form} onSubmit={handleStatusSave}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Larps (comma or newline separated)</label>
                <textarea
                  className={styles.textarea}
                  value={opportunityDraft}
                  onChange={event => setOpportunityDraft(event.target.value)}
                  placeholder="e.g. Finance Bro, VC Nepo Baby, AI Prompt Cowboy"
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveBtn}>
                  Save Status
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCancelEditor}>
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
