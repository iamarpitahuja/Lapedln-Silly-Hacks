import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { easeOutQuint } from '../../lib/motion'
import styles from './FeatureTour.module.css'

const SPOTLIGHT_PADDING = 10
const PANEL_GAP = 16
const PANEL_EDGE_PADDING = 14
const PANEL_MAX_WIDTH = 500
const PANEL_MIN_HEIGHT = 220

const TOUR_STEPS = [
  {
    id: 'navigation',
    route: '/',
    zone: 'Feed',
    selector: '[data-tour="top-nav"]',
    title: 'Global Navigation',
    description: 'Use the top bar to jump between Feed, Network, Jobs, Messages, Notifications, and your profile.',
  },
  {
    id: 'composer',
    route: '/',
    zone: 'Feed',
    selector: '[data-tour="start-post"]',
    title: 'Feed Composer',
    description: 'Create posts, attach media, and publish updates from this composer.',
  },
  {
    id: 'memelord',
    route: '/',
    zone: 'Feed',
    selector: '[data-tour="start-post"]',
    title: 'MemeLord + Random Glaze',
    description: 'Posts can trigger MemeLord roast memes, and glaze suggestions are randomized for chaotic variety.',
  },
  {
    id: 'games',
    route: '/',
    zone: 'Feed',
    selector: '[data-tour="daily-games"]',
    title: 'Daily Games',
    description: 'Play mini-games each day to keep your progress and profile stats moving.',
  },
  {
    id: 'network',
    route: '/network',
    zone: 'Network',
    selector: '[data-tour="network-tabs"]',
    title: 'Network Hub',
    description: 'Manage suggestions, pending requests, and existing connections in one place.',
  },
  {
    id: 'jobs',
    route: '/jobs',
    zone: 'J*bs',
    selector: '[data-tour="jobs-board-header"]',
    title: 'Jobs Board',
    description: 'Apply to generated roles or define your own title whenever you want.',
  },
  {
    id: 'messaging',
    route: '/messaging',
    zone: 'Messages',
    selector: '[data-tour="messaging-list"]',
    preferredPlacement: 'right',
    title: 'Messaging',
    description: 'Open DMs and groups, then use the compose button to start new conversations.',
  },
  {
    id: 'notifications',
    route: '/notifications',
    zone: 'Notifications',
    selector: '[data-tour="notifications-card"]',
    title: 'Notifications',
    description: 'See connection requests, message activity, and updates that need your attention.',
  },
  {
    id: 'profile',
    route: '/me',
    zone: 'Me',
    selector: '[data-tour="profile-larpmaxxer"]',
    title: 'Profile + Training',
    description: 'Your profile is your public persona, and this shortcut takes you into LarpMaxxer practice.',
  },
  {
    id: 'elevenlabs',
    route: '/me',
    zone: 'Me',
    selector: '[data-tour="profile-larpmaxxer"]',
    title: 'ElevenLabs Voice Mode',
    description: 'Open LarpMaxxer from here and use speaker playback powered by the ElevenLabs TTS pipeline.',
  },
]

function measureSpotlight(selector) {
  if (!selector || typeof document === 'undefined') return null
  const target = document.querySelector(selector)
  if (!target) return null

  const rect = target.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const top = Math.max(0, rect.top - SPOTLIGHT_PADDING)
  const left = Math.max(0, rect.left - SPOTLIGHT_PADDING)
  const width = Math.min(window.innerWidth - left, rect.width + SPOTLIGHT_PADDING * 2)
  const height = Math.min(window.innerHeight - top, rect.height + SPOTLIGHT_PADDING * 2)

  return { top, left, width, height }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function computePanelPlacement(spotlightRect, panelHeight = PANEL_MIN_HEIGHT, preferredPlacement = null) {
  if (typeof window === 'undefined') {
    return {
      placement: 'floating',
      style: { left: '50%', bottom: '16px', transform: 'translateX(-50%)' },
    }
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const panelWidth = Math.min(PANEL_MAX_WIDTH, viewportWidth - PANEL_EDGE_PADDING * 2)

  if (!spotlightRect) {
    return {
      placement: 'floating',
      style: {
        left: '50%',
        bottom: '16px',
        width: `${panelWidth}px`,
        transform: 'translateX(-50%)',
      },
    }
  }

  const targetCenterX = spotlightRect.left + spotlightRect.width / 2
  const targetCenterY = spotlightRect.top + spotlightRect.height / 2
  const left = clamp(
    targetCenterX - panelWidth / 2,
    PANEL_EDGE_PADDING,
    viewportWidth - panelWidth - PANEL_EDGE_PADDING
  )
  const arrowLeft = clamp(targetCenterX - left, 26, panelWidth - 26)
  const topForSide = clamp(
    targetCenterY - panelHeight / 2,
    PANEL_EDGE_PADDING,
    viewportHeight - panelHeight - PANEL_EDGE_PADDING
  )
  const arrowTop = clamp(targetCenterY - topForSide, 26, panelHeight - 26)

  const rightLeft = spotlightRect.left + spotlightRect.width + PANEL_GAP
  const leftLeft = spotlightRect.left - panelWidth - PANEL_GAP
  const hasRightSpace = rightLeft + panelWidth <= viewportWidth - PANEL_EDGE_PADDING
  const hasLeftSpace = leftLeft >= PANEL_EDGE_PADDING

  if (preferredPlacement === 'right' && hasRightSpace) {
    return {
      placement: 'right',
      style: {
        top: `${Math.round(topForSide)}px`,
        left: `${Math.round(rightLeft)}px`,
        width: `${Math.round(panelWidth)}px`,
        '--tour-arrow-top': `${Math.round(arrowTop)}px`,
      },
    }
  }

  if (preferredPlacement === 'left' && hasLeftSpace) {
    return {
      placement: 'left',
      style: {
        top: `${Math.round(topForSide)}px`,
        left: `${Math.round(leftLeft)}px`,
        width: `${Math.round(panelWidth)}px`,
        '--tour-arrow-top': `${Math.round(arrowTop)}px`,
      },
    }
  }

  if (preferredPlacement === 'right' && hasLeftSpace) {
    return {
      placement: 'left',
      style: {
        top: `${Math.round(topForSide)}px`,
        left: `${Math.round(leftLeft)}px`,
        width: `${Math.round(panelWidth)}px`,
        '--tour-arrow-top': `${Math.round(arrowTop)}px`,
      },
    }
  }

  if (preferredPlacement === 'left' && hasRightSpace) {
    return {
      placement: 'right',
      style: {
        top: `${Math.round(topForSide)}px`,
        left: `${Math.round(rightLeft)}px`,
        width: `${Math.round(panelWidth)}px`,
        '--tour-arrow-top': `${Math.round(arrowTop)}px`,
      },
    }
  }

  const spaceAbove = spotlightRect.top - PANEL_EDGE_PADDING - PANEL_GAP
  const spaceBelow = viewportHeight - (spotlightRect.top + spotlightRect.height) - PANEL_EDGE_PADDING - PANEL_GAP

  const prefersBelow = spaceBelow >= panelHeight || spaceBelow >= spaceAbove
  const placement = prefersBelow ? 'below' : 'above'
  const computedTop = prefersBelow
    ? spotlightRect.top + spotlightRect.height + PANEL_GAP
    : spotlightRect.top - panelHeight - PANEL_GAP

  const top = clamp(computedTop, PANEL_EDGE_PADDING, viewportHeight - panelHeight - PANEL_EDGE_PADDING)

  return {
    placement,
    style: {
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(panelWidth)}px`,
      '--tour-arrow-left': `${Math.round(arrowLeft)}px`,
    },
  }
}

export default function FeatureTour({ isOpen, onFinish }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState(null)
  const [panelHeight, setPanelHeight] = useState(PANEL_MIN_HEIGHT)
  const panelRef = useRef(null)

  const step = TOUR_STEPS[stepIndex]
  const isLastStep = stepIndex === TOUR_STEPS.length - 1

  useEffect(() => {
    if (!isOpen || !step?.route) return
    if (location.pathname !== step.route) {
      navigate(step.route)
    }
  }, [isOpen, step?.route, location.pathname, navigate])

  useEffect(() => {
    if (!isOpen) return undefined

    let attempts = 0
    let hasScrolledToTarget = false

    const update = () => {
      const nextRect = measureSpotlight(step?.selector)
      setSpotlightRect(nextRect)

      if (!nextRect || hasScrolledToTarget) return false

      const target = document.querySelector(step.selector)
      if (target) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
        hasScrolledToTarget = true
      }
      return true
    }

    const interval = window.setInterval(() => {
      attempts += 1
      const found = update()
      if ((found && attempts >= 3) || attempts >= 30) {
        window.clearInterval(interval)
      }
    }, 120)

    const handleViewportChange = () => {
      setSpotlightRect(measureSpotlight(step?.selector))
    }

    handleViewportChange()
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [isOpen, step?.selector, location.pathname])

  const spotlightStyle = useMemo(() => {
    if (!spotlightRect) return null
    return {
      top: `${spotlightRect.top}px`,
      left: `${spotlightRect.left}px`,
      width: `${spotlightRect.width}px`,
      height: `${spotlightRect.height}px`,
    }
  }, [spotlightRect])

  const progress = ((stepIndex + 1) / TOUR_STEPS.length) * 100

  const closeTour = useCallback((completed) => {
    setStepIndex(0)
    setSpotlightRect(null)
    setPanelHeight(PANEL_MIN_HEIGHT)
    onFinish?.({ completed })
  }, [onFinish])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      closeTour(true)
      return
    }
    setStepIndex(prev => prev + 1)
  }, [isLastStep, closeTour])

  const handleBack = useCallback(() => {
    setStepIndex(prev => Math.max(0, prev - 1))
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    const updatePanelHeight = () => {
      if (!panelRef.current) return
      const rect = panelRef.current.getBoundingClientRect()
      if (!rect.height) return
      setPanelHeight(Math.max(PANEL_MIN_HEIGHT, Math.ceil(rect.height)))
    }

    updatePanelHeight()
    window.addEventListener('resize', updatePanelHeight)

    return () => {
      window.removeEventListener('resize', updatePanelHeight)
    }
  }, [isOpen, stepIndex])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        closeTour(false)
      } else if (event.key === 'ArrowRight') {
        handleNext()
      } else if (event.key === 'ArrowLeft') {
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeTour, handleNext, handleBack])

  const panelPlacement = useMemo(
    () => computePanelPlacement(spotlightRect, panelHeight, step?.preferredPlacement),
    [spotlightRect, panelHeight, step?.preferredPlacement]
  )

  const panelClassName = [
    styles.panel,
    panelPlacement.placement === 'above' ? styles.panelAbove : '',
    panelPlacement.placement === 'below' ? styles.panelBelow : '',
    panelPlacement.placement === 'right' ? styles.panelRight : '',
    panelPlacement.placement === 'left' ? styles.panelLeft : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Product tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: easeOutQuint }}
        >
          {spotlightStyle ? <div className={styles.spotlight} style={spotlightStyle} /> : null}

          <Motion.div
            ref={panelRef}
            className={panelClassName}
            style={panelPlacement.style}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: easeOutQuint }}
          >
            <div className={styles.progressTrack} aria-hidden="true">
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.metaRow}>
              <p className={styles.kicker}>Feature Tour • Step {stepIndex + 1} of {TOUR_STEPS.length}</p>
              <span className={styles.zoneChip}>{step.zone}</span>
            </div>
            <h2 className={styles.title}>{step.title}</h2>
            <p className={styles.description}>{step.description}</p>
            {!spotlightStyle ? (
              <p className={styles.missingTarget}>Waiting for this feature to render...</p>
            ) : null}
            <div className={styles.actions}>
              <button className={styles.skipButton} onClick={() => closeTour(false)}>
                Skip tour
              </button>
              <div className={styles.rightActions}>
                <button
                  className={styles.secondaryButton}
                  onClick={handleBack}
                  disabled={stepIndex === 0}
                >
                  Back
                </button>
                <button className={styles.primaryButton} onClick={handleNext}>
                  {isLastStep ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
