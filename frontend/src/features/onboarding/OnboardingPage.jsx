import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { easeOutQuint } from '../../lib/motion'
import { updateProfilePatch, updateJob, fetchProfile } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useOnboardingState } from './hooks/useOnboardingState'
import SynergizingLoader from './components/SynergizingLoader'
import StepName from './steps/StepName'
import StepJob from './steps/StepJob'
import StepAvatar from './steps/StepAvatar'
import StepBio from './steps/StepBio'
import StepExperience from './steps/StepExperience'
import StepSkills from './steps/StepSkills'
import StepWelcome from './steps/StepWelcome'
import styles from './OnboardingPage.module.css'

const SLIDE_VARIANTS = {
  enter: direction => ({
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: direction => ({
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
}

function makeEntityId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `entity-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function normalizeSkills(rawSkills = []) {
  if (!Array.isArray(rawSkills)) return []

  return rawSkills
    .map(skill => {
      if (typeof skill === 'string') {
        const name = skill.trim()
        if (!name) return null
        return { id: makeEntityId(), name, endorsements: 0 }
      }
      if (!skill || typeof skill !== 'object') return null
      const name = String(skill.name ?? '').trim()
      if (!name) return null
      return {
        id: String(skill.id ?? makeEntityId()),
        name,
        endorsements: Number(skill.endorsements ?? 0),
      }
    })
    .filter(Boolean)
}

function normalizeExperience(rawExperience = []) {
  if (!Array.isArray(rawExperience)) return []

  return rawExperience
    .map(entry => {
      if (!entry || typeof entry !== 'object') return null

      const title = String(entry.title ?? '').trim()
      const company = String(entry.company ?? '').trim()
      const start = String(entry.start ?? '').trim()
      const end = String(entry.end ?? '').trim()
      const explicitDates = String(entry.dates ?? '').trim()
      const computedDates = explicitDates || (
        start
          ? `${start}${end ? ` - ${end}` : ' - Present'}`
          : (end || '')
      )
      const description = String(entry.description ?? '').trim()

      if (!title && !company && !computedDates && !description) return null

      return {
        id: String(entry.id ?? makeEntityId()),
        title,
        company,
        dates: computedDates,
        description,
      }
    })
    .filter(Boolean)
}

export default function OnboardingPage({ onComplete }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { step, formData, direction, advance } = useOnboardingState()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [larpRating, setLarpRating] = useState(0)
  const existingDisplayName = String(user?.display_name ?? '').trim()
  const hasExistingName = Boolean(existingDisplayName && existingDisplayName !== 'Anonymous Larper')
  const includeNameStep = !hasExistingName
  const profileStepCount = includeNameStep ? 6 : 5

  async function persistAndAdvance(partialData = {}, { finalize = false } = {}) {
    const merged = { ...formData, ...partialData }
    setSaving(true)
    setSaveError(null)
    try {
      const { job, ...profileFields } = merged
      const payload = { ...profileFields }
      if (Object.prototype.hasOwnProperty.call(profileFields, 'experience')) {
        payload.experience = normalizeExperience(profileFields.experience)
      }
      if (Object.prototype.hasOwnProperty.call(profileFields, 'skills')) {
        payload.skills = normalizeSkills(profileFields.skills)
      }

      if (finalize) {
        payload.onboarding_completed_at = new Date().toISOString()
      }

      const requests = [updateProfilePatch(payload)]
      const hasJobInThisStep = Object.prototype.hasOwnProperty.call(partialData, 'job')
      if (hasJobInThisStep && typeof job === 'string' && job.trim()) {
        requests.push(updateJob(job.trim()))
      }

      await Promise.all(requests)

      if (finalize) {
        try {
          const profile = await fetchProfile()
          setLarpRating(profile.larp_rating ?? 0)
        } catch {
          setLarpRating(0)
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('profile:refresh'))
        }
      }

      advance(partialData)
    } catch (err) {
      setSaveError(err.message || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEnter = useCallback(() => {
    onComplete?.()
    navigate('/')
  }, [onComplete, navigate])

  const steps = [
    ...(includeNameStep
      ? [<StepName key="name" stepNumber={1} totalSteps={profileStepCount} onNext={data => persistAndAdvance(data)} />]
      : []),
    <StepJob
      key="job"
      stepNumber={includeNameStep ? 2 : 1}
      totalSteps={profileStepCount}
      onNext={data => persistAndAdvance(data)}
    />,
    <StepAvatar
      key="avatar"
      stepNumber={includeNameStep ? 3 : 2}
      totalSteps={profileStepCount}
      onNext={data => persistAndAdvance(data)}
      onSkip={() => persistAndAdvance({})}
      displayName={formData.display_name ?? existingDisplayName}
    />,
    <StepBio
      key="bio"
      stepNumber={includeNameStep ? 4 : 3}
      totalSteps={profileStepCount}
      onNext={data => persistAndAdvance(data)}
      onSkip={() => persistAndAdvance({})}
    />,
    <StepExperience
      key="experience"
      stepNumber={includeNameStep ? 5 : 4}
      totalSteps={profileStepCount}
      onNext={data => persistAndAdvance(data)}
      onSkip={() => persistAndAdvance({})}
    />,
    <StepSkills
      key="skills"
      stepNumber={includeNameStep ? 6 : 5}
      totalSteps={profileStepCount}
      onNext={data => persistAndAdvance(data, { finalize: true })}
      onSkip={() => persistAndAdvance({}, { finalize: true })}
    />,
    <StepWelcome key="welcome" larpRating={larpRating} onEnter={handleEnter} />,
  ]

  return (
    <div className={styles.page}>
      {saving && (
        <SynergizingLoader
          message="Synergizing your professional essence..."
          error={saveError}
          onRetry={() => setSaveError(null)}
        />
      )}
      {!saving && saveError ? (
        <p className={styles.saveError} role="alert">{saveError}</p>
      ) : null}
      <div className={styles.stepArea}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: easeOutQuint }}
            className={styles.stepFrame}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
