import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { easeOutQuint } from '../../lib/motion'
import styles from './FeatureTour.module.css'
import larpmaxxerPreview from '../../../../image.jpeg'

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
    description: 'Your corporate HQ. Feed, Network, J*bs, Messages, Notifications — everything a delusional professional needs.',
  },
  {
    id: 'composer',
    route: '/',
    zone: 'Feed',
    selector: '[data-tour="start-post"]',
    title: 'Feed Composer',
    description: 'Drop your hottest takes here. AI will judge your buzzword density and score your corporate theater in real time.',
  },
  {
    id: 'memelord',
    route: '/',
    zone: 'Feed',
    selector: '[data-tour="start-post"]',
    title: 'MemeLord Roast Memes',
    description: 'Every post gets sent to the MemeLord API which generates a personalized roast meme of your corporate cringe. It hits different.',
  },
  {
    id: 'games',
    route: '/',
    zone: 'Feed',
    selector: '[data-tour="daily-games"]',
    title: 'Daily Games',
    description: 'Buzzword Bingo, The Grind, and Thought Leadership — win these to pump ur LARP Rating. It\'s literally a grindset.',
  },
  {
    id: 'game-32bit',
    route: '/larpmaxxer',
    zone: 'Larp Dojo',
    selector: '[data-tour="larpmaxxer-game"]',
    title: '32-Bit Game Mode',
    description: 'This is LarpMaxxer, the 32-bit style practice game. Run sessions here whenever you want to train.',
    imageSrc: larpmaxxerPreview,
    imageAlt: 'LarpMaxxer 32-bit game preview',
  },
  {
    id: 'network',
    route: '/network',
    zone: 'Network',
    selector: '[data-tour="network-tabs"]',
    title: 'Network Hub',
    description: 'Connect with fellow larpers, farm aura, and see who\'s been stalking your profile. Networking is just LinkedIn speed dating.',
  },
  {
    id: 'jobs',
    route: '/jobs',
    zone: 'J*bs',
    selector: '[data-tour="jobs-board-header"]',
    title: 'J*bs Board',
    description: 'AI-generated fake jobs with absurd salaries and requirements. Apply instantly — they all say yes. It\'s corporate fantasy football.',
  },
  {
    id: 'messaging',
    route: '/messaging',
    zone: 'Messages',
    selector: '[data-tour="messaging-list"]',
    preferredPlacement: 'right',
    title: 'Messaging',
    description: 'Slide into professional DMs. Start group chats. Real-time WebSocket messaging so your networking is instant and inescapable.',
  },
  {
    id: 'notifications',
    route: '/notifications',
    zone: 'Notifications',
    selector: '[data-tour="notifications-card"]',
    title: 'Notifications',
    description: 'Every time someone acknowledges your existence on the platform, it shows up here. Dopamine on demand.',
  },
  {
    id: 'profile',
    route: '/me',
    zone: 'Me',
    selector: '[data-tour="profile-larpmaxxer"]',
    title: 'Profile + LarpMaxxer',
    description: 'Your public persona lives here. Hit LarpMaxxer to enter a 32-bit training sim where you roleplay corporate scenarios. Yes really.',
  },
  {
    id: 'elevenlabs',
    route: '/me',
    zone: 'Me',
    selector: '[data-tour="profile-larpmaxxer"]',
    title: 'ElevenLabs Voice Acting',
    description: 'The AI characters talk back to you OUT LOUD via ElevenLabs TTS. Gary Vee yells at you to crush it. The Corporate Buddha dispenses KPI koans. It\'s unhinged.',
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
            {step.imageSrc ? (
              <img className={styles.previewImage} src={step.imageSrc} alt={step.imageAlt ?? step.title} />
            ) : null}
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
