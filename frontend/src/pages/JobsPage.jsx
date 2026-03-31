import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../context/MockDataContext'
import { springBouncy, easeOutQuint } from '../lib/motion'
import { generateListings } from '../utils/jobGenerator'
import styles from './JobsPage.module.css'

const PIPELINE_STEPS = [
  { label: 'Reviewing Application…' },
  { label: 'Screening Your Aura…' },
  { label: "You're Hired!" },
]

const CONFETTI_COLORS = ['#a78bfa', '#c4b5fd', '#e9d5ff', '#7c3aed', '#ddd6fe', '#9ca3af', '#e5e7eb']

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 5 + Math.random() * 7,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 120,
      isRect: Math.random() > 0.4,
    })), [])

  return (
    <div className={styles.confettiWrap}>
      {particles.map(p => (
        <Motion.div
          key={p.id}
          className={styles.confettiPiece}
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.isRect ? p.size * 0.55 : p.size,
            borderRadius: p.isRect ? '2px' : '50%',
            background: p.color,
          }}
          initial={{ y: -20, x: 0, rotate: p.rotation, opacity: 1, scale: 0 }}
          animate={{
            y: '110vh',
            x: p.drift,
            rotate: p.rotation + 540 + Math.random() * 360,
            opacity: [0, 1, 1, 1, 0],
            scale: [0, 1.2, 1, 1, 0.6],
          }}
          transition={{
            duration: 2.4 + Math.random() * 1.2,
            delay: p.delay,
            ease: [0.22, 0.68, 0.36, 1],
          }}
        />
      ))}
    </div>
  )
}

function HiringPipeline({ listing, onAccept, onClose }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 700)
    const t2 = setTimeout(() => setStep(2), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <Motion.div
      className={styles.pipelineOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Motion.div
        className={styles.pipelineModal}
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={springBouncy}
        onClick={e => e.stopPropagation()}
      >
        <p className={styles.pipelineCompany}>{listing.company}</p>
        <h3 className={styles.pipelineRole}>{listing.role}</h3>

        <div className={styles.pipelineSteps}>
          <Motion.div
            className={styles.pipelineProgress}
            initial={{ height: 0 }}
            animate={{ height: `${Math.min((step / (PIPELINE_STEPS.length - 1)) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: easeOutQuint }}
          />
          {PIPELINE_STEPS.map((s, i) => (
            <Motion.div
              key={i}
              className={[
                styles.pipelineStep,
                step === i ? styles.pipelineStepActive : '',
                step > i ? styles.pipelineStepDone : '',
              ].join(' ')}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: step >= i ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.15, ease: easeOutQuint }}
            >
              <span className={styles.pipelineStepIcon}>
                {step > i ? '✓' : i + 1}
              </span>
              <span className={styles.pipelineStepLabel}>{s.label}</span>
            </Motion.div>
          ))}
        </div>

        <AnimatePresence>
          {step >= 2 && (
            <Motion.div
              className={styles.hiredCta}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: easeOutQuint }}
            >
              <p className={styles.hiredMsg}>
                The ecosystem awaits your full bandwidth.
              </p>
              <button className={styles.startLarpBtn} onClick={onAccept}>
                Start LARPing
              </button>
              <button className={styles.passBtn} onClick={onClose}>
                Pass on this opportunity
              </button>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.div>
    </Motion.div>
  )
}

export default function JobsPage() {
  const { currentUser, jobOptions, updateCurrentJob } = useMockData()
  const [job, setJob] = useState('')
  const [status, setStatus] = useState(null) // 'updating' | 'success' | 'error'
  const [lastJob, setLastJob] = useState(null)
  const [listings, setListings] = useState(() => generateListings(6))
  const [applyingTo, setApplyingTo] = useState(null)

  function handleRefresh() {
    setListings(generateListings(6))
  }

  async function handleAccept() {
    if (!applyingTo) return
    const result = await updateCurrentJob(applyingTo.role)
    setApplyingTo(null)
    if (result.ok) {
      setLastJob(result.job)
      setStatus('success')
      setTimeout(() => setStatus(null), 4000)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!job.trim()) return
    setStatus('updating')
    const result = await updateCurrentJob(job)
    if (result.ok) {
      setLastJob(result.job)
      setJob('')
      setStatus('success')
      setTimeout(() => setStatus(null), 4000)
    } else {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.boardWrap} data-tour="jobs-board">

        {/* Board header */}
        <div className={styles.boardHeader}>
          <div>
            <h2 className={styles.heading}>J*bs</h2>
            <p className={styles.subheading}>
              Today's most prestigious opportunities, curated by the algorithm.
            </p>
          </div>
          <div className={styles.currentCompact}>
            <span className={styles.currentLabel}>Current larp</span>
            <span className={styles.currentValue}>{currentUser.job || 'Unassigned'}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.boardToolbar}>
          <span className={styles.boardCount}>{listings.length} openings</span>
          <button className={styles.refreshBtn} onClick={handleRefresh}>
            ↻ Refresh Listings
          </button>
        </div>

        {/* Grid */}
        <div className={styles.listingsGrid}>
          <AnimatePresence mode="popLayout">
            {listings.map((listing, i) => (
              <Motion.div
                key={listing.id}
                className={styles.jobCard}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94, y: -8 }}
                transition={{ ...springBouncy, delay: i * 0.06 }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: easeOutQuint } }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className={styles.jobCardTop}>
                  <div className={styles.jobMeta}>
                    <span className={styles.jobCompany}>{listing.company}</span>
                    <span className={styles.jobTag}>{listing.tag}</span>
                  </div>
                  <h3 className={styles.jobRole}>{listing.role}</h3>
                  <p className={styles.jobSalary}>{listing.salary}</p>
                </div>

                <ul className={styles.jobReqs}>
                  {listing.requirements.map((req, j) => (
                    <li key={j}>{req}</li>
                  ))}
                </ul>

                <div className={styles.jobPerks}>
                  {listing.perks.map((perk, j) => (
                    <span key={j} className={styles.jobPerk}>{perk}</span>
                  ))}
                </div>

                <Motion.button
                  className={styles.applyBtn}
                  onClick={() => setApplyingTo(listing)}
                  whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(167, 139, 250, 0.35)' }}
                  whileTap={{ scale: 0.96 }}
                  transition={springBouncy}
                >
                  Apply Now
                </Motion.button>
              </Motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Board-level success toast */}
        <AnimatePresence>
          {status === 'success' && (
            <>
              <Confetti />
              <Motion.div
                className={styles.boardSuccess}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={springBouncy}
              >
                You are now larping as <strong>&ldquo;{lastJob}&rdquo;</strong>. The ecosystem has been notified.
              </Motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hiring pipeline modal */}
        <AnimatePresence>
          {applyingTo && (
            <HiringPipeline
              key={applyingTo.id}
              listing={applyingTo}
              onAccept={handleAccept}
              onClose={() => setApplyingTo(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className={styles.divider}>
        <span className={styles.dividerLabel}>Or, define your own LARP</span>
      </div>

      {/* Custom title section */}
      <div className={styles.card}>
        <div className={styles.current}>
          <span className={styles.currentLabel}>Current larp:</span>
          <span className={styles.currentValue}>{currentUser.job || 'Unassigned'}</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter your new fake profession..."
            value={job}
            onChange={e => setJob(e.target.value)}
          />
          <Motion.button
            type="submit"
            className={styles.submitBtn}
            disabled={!job.trim() || status === 'updating'}
            whileTap={{ scale: 0.95 }}
            transition={springBouncy}
          >
            {status === 'updating' ? 'Rebranding...' : 'Claim Job'}
          </Motion.button>
        </form>

        <AnimatePresence mode="wait">
          {status === 'error' && (
            <Motion.p
              key="error"
              className={styles.error}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              Job update failed. Your delusion did not persist.
            </Motion.p>
          )}
        </AnimatePresence>

        <div className={styles.suggestions}>
          <p className={styles.suggestionsLabel}>Need inspiration? Pick a prebuilt larp:</p>
          <div className={styles.pills}>
            {jobOptions.map(t => (
              <button key={t} className={styles.pill} onClick={() => setJob(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
