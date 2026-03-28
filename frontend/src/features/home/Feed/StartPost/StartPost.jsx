import { useState, useEffect, useRef } from 'react'
import { useMockData } from '../../../../context/MockDataContext'
import Icon from '../../../../components/Icon/Icon'
import { getInitials } from '../../../../utils/strings'
import styles from './StartPost.module.css'

const PLACEHOLDERS = [
  'What impossible milestone are you reflecting on today?',
  'Share a lesson from your made-up founder arc.',
  'Announce a role you technically never interviewed for.',
  'What thought leadership can you offer the ecosystem today?',
]

const ACTIONS = [
  {
    icon: 'party',
    label: 'Celebrate fake promotion',
    postType: 'Career Lore',
    template: [
      { kind: 'text', value: 'Thrilled to share that I have been promoted to ' },
      {
        kind: 'slot',
        key: 'roleTitle',
        label: 'role title',
        options: [
          'Senior Prompt Engineer',
          'Chief Vibe Strategist',
          'Principal Alignment Wizard',
        ],
      },
      { kind: 'text', value: ' at ' },
      {
        kind: 'slot',
        key: 'companyName',
        label: 'company name',
        options: ['Nimbus Dynamics', 'Stealthly Labs', 'Quantum Synergy Group'],
      },
      { kind: 'text', value: '. Massive thanks to ' },
      {
        kind: 'slot',
        key: 'gratitudeGroup',
        label: 'who to thank',
        options: ['my mentors', 'the leadership team', 'everyone who believed early'],
      },
      { kind: 'text', value: ' for backing this journey.' },
    ],
  },
  {
    icon: 'rocket',
    label: 'Announce stealth startup',
    postType: 'Stealth Build Update',
    template: [
      { kind: 'text', value: 'After months in stealth, we are launching ' },
      {
        kind: 'slot',
        key: 'productName',
        label: 'product name',
        options: ['Project Moonshot', 'SignalFlow OS', 'AuraStack'],
      },
      { kind: 'text', value: ' for ' },
      {
        kind: 'slot',
        key: 'targetAudience',
        label: 'target audience',
        options: ['founders', 'revenue teams', 'ops leaders'],
      },
      { kind: 'text', value: '. Our first mission: ' },
      {
        kind: 'slot',
        key: 'missionClaim',
        label: 'big claim',
        options: [
          'replace meetings with autonomous execution',
          'turn strategy into shipping by default',
          'compress a week of work into one workflow',
        ],
      },
      { kind: 'text', value: '.' },
    ],
  },
  {
    icon: 'lightbulb',
    label: 'Share leadership insight',
    postType: 'Thought Leadership Incident',
    template: [
      { kind: 'text', value: 'Leadership insight: when uncertainty is high, optimize for ' },
      {
        kind: 'slot',
        key: 'principle',
        label: 'core principle',
        options: ['clarity', 'ownership', 'fast feedback loops'],
      },
      { kind: 'text', value: '. This week we practiced it by ' },
      {
        kind: 'slot',
        key: 'behavior',
        label: 'team behavior',
        options: [
          'documenting decisions in public',
          'shipping smaller daily releases',
          'asking harder questions earlier',
        ],
      },
      { kind: 'text', value: ', and it unlocked ' },
      {
        kind: 'slot',
        key: 'outcome',
        label: 'outcome',
        options: ['faster alignment', 'cleaner execution', 'real momentum'],
      },
      { kind: 'text', value: '.' },
    ],
  },
  {
    icon: 'mirror',
    label: 'Reflect on your journey',
    postType: 'Aura Farming',
    template: [
      { kind: 'text', value: 'Looking back, my biggest shift was moving from ' },
      {
        kind: 'slot',
        key: 'oldMindset',
        label: 'old mindset',
        options: ['playing safe', 'waiting for permission', 'chasing perfect plans'],
      },
      { kind: 'text', value: ' to ' },
      {
        kind: 'slot',
        key: 'newMindset',
        label: 'new mindset',
        options: ['shipping before certainty', 'learning in public', 'choosing consistency'],
      },
      { kind: 'text', value: '. That mindset produced ' },
      {
        kind: 'slot',
        key: 'reflectionResult',
        label: 'result',
        options: [
          'my most meaningful quarter yet',
          'compounding confidence',
          'a totally new level of execution',
        ],
      },
      { kind: 'text', value: '.' },
    ],
  },
]

const POST_TYPES = [
  'Career Lore',
  'Humblebrag',
  'Thought Leadership Incident',
  'Aura Farming',
  'Corporate Trauma Dump',
  'Stealth Build Update',
  'Personal Update',
]

const MAX_POST_LENGTH = 500
const TEMPLATE_BLANK = label => `____${label.toUpperCase()}____`

function getTemplateSlots(template) {
  return template.filter(segment => segment.kind === 'slot')
}

function buildTemplateDraft(template, slotValues) {
  return template
    .map(segment => {
      if (segment.kind === 'text') return segment.value
      const slotValue = slotValues[segment.key]
      return slotValue?.trim() ? slotValue : TEMPLATE_BLANK(segment.label)
    })
    .join('')
}

export default function StartPost() {
  const { currentUser, createPost } = useMockData()
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [postType, setPostType] = useState(POST_TYPES[0])
  const [draft, setDraft] = useState('')
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [slotValues, setSlotValues] = useState({})
  const [activeSlotKey, setActiveSlotKey] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const showFooter = isFocused || draft.trim().length > 0

  function handleContainerBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      if (!draft.trim()) setIsFocused(false)
    }
  }

  function resetTemplateMode() {
    setActiveTemplate(null)
    setSlotValues({})
    setActiveSlotKey('')
  }

  function handleActionClick(action) {
    const templateSlots = getTemplateSlots(action.template)
    setPostType(action.postType)
    setActiveTemplate(action)
    setSlotValues({})
    setActiveSlotKey(templateSlots[0]?.key ?? '')
    setDraft(buildTemplateDraft(action.template, {}))
    setError('')
    setIsFocused(true)
    textareaRef.current?.focus()
  }

  function handleDraftChange(event) {
    setDraft(event.target.value)
    if (activeTemplate) resetTemplateMode()
  }

  function applySlotValue(slotKey, rawValue) {
    if (!activeTemplate || !slotKey) return

    const nextSlotValues = { ...slotValues }
    if (rawValue.trim()) {
      nextSlotValues[slotKey] = rawValue
    } else {
      delete nextSlotValues[slotKey]
    }

    setSlotValues(nextSlotValues)
    setDraft(buildTemplateDraft(activeTemplate.template, nextSlotValues))
  }

  function handleSlotClick(slotKey) {
    setActiveSlotKey(slotKey)
  }

  function handleSuggestionClick(value) {
    applySlotValue(activeSlotKey, value)
  }

  function handleCancel() {
    setDraft('')
    resetTemplateMode()
    setError('')
    setIsFocused(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    const result = createPost({ content: draft, type: postType })

    if (!result.ok) {
      setError(result.error ?? 'Could not publish this post. Please try again.')
      setIsSubmitting(false)
      return
    }

    setDraft('')
    resetTemplateMode()
    setError('')
    setIsFocused(false)
    setIsSubmitting(false)
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleSubmit(event)
    }
  }

  const charactersRemaining = MAX_POST_LENGTH - draft.length
  const isPostDisabled = !draft.trim() || isSubmitting
  const templateSlots = activeTemplate ? getTemplateSlots(activeTemplate.template) : []
  const activeSlot = templateSlots.find(slot => slot.key === activeSlotKey) ?? templateSlots[0]
  const activeSlotValue = activeSlot ? (slotValues[activeSlot.key] ?? '') : ''

  return (
    <div className={styles.card} onBlur={handleContainerBlur}>
      <div className={styles.row}>
        <div className={styles.avatar}>{getInitials(currentUser.name)}</div>
        <textarea
          ref={textareaRef}
          aria-label="Post content"
          className={`${styles.textarea} ${showFooter ? '' : styles.textareaResting}`}
          value={draft}
          onChange={handleDraftChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_POST_LENGTH}
          placeholder={
            showFooter
              ? 'Write your most career-defining paragraph...'
              : PLACEHOLDERS[placeholderIndex]
          }
          style={{ '--placeholder-key': placeholderIndex }}
          rows={showFooter ? 4 : 1}
        />
      </div>

      <div className={`${styles.expandable} ${showFooter ? styles.expanded : ''}`}>
        {showFooter ? (
          <div className={styles.expandableInner}>
            <div className={styles.composerHeader}>
              <label htmlFor="post-type" className={styles.typeLabel}>Post type</label>
              <select
                id="post-type"
                className={styles.typeSelect}
                value={postType}
                onChange={event => setPostType(event.target.value)}
              >
                {POST_TYPES.map(typeOption => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
            </div>
            {activeTemplate ? (
              <div className={styles.templateBuilder}>
                <p className={styles.templateHint}>
                  Template mode: click each blank, then pick or type what goes there.
                </p>
                <div className={styles.templatePreview}>
                  {activeTemplate.template.map((segment, index) => {
                    if (segment.kind === 'text') {
                      return (
                        <span key={`${segment.kind}-${index}`} className={styles.templateText}>
                          {segment.value}
                        </span>
                      )
                    }

                    const slotValue = slotValues[segment.key]
                    const isFilled = !!slotValue?.trim()
                    const isActive = activeSlot?.key === segment.key
                    return (
                      <button
                        key={segment.key}
                        type="button"
                        className={`${styles.slotBlank} ${isFilled ? styles.slotBlankFilled : ''} ${
                          isActive ? styles.slotBlankActive : ''
                        }`}
                        onClick={() => handleSlotClick(segment.key)}
                      >
                        {isFilled ? slotValue : TEMPLATE_BLANK(segment.label)}
                      </button>
                    )
                  })}
                </div>

                {activeSlot ? (
                  <div className={styles.slotEditor}>
                    <label htmlFor="template-slot-input" className={styles.slotLabel}>
                      Fill in: {activeSlot.label}
                    </label>
                    <input
                      id="template-slot-input"
                      type="text"
                      className={styles.slotInput}
                      value={activeSlotValue}
                      onChange={event => applySlotValue(activeSlot.key, event.target.value)}
                      placeholder={`Type your ${activeSlot.label}...`}
                    />
                    <div className={styles.slotSuggestions}>
                      {activeSlot.options.map(option => (
                        <button
                          key={option}
                          type="button"
                          className={styles.slotSuggestion}
                          onClick={() => handleSuggestionClick(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className={styles.composerMeta}>
              <p className={styles.metaHint}>Press Ctrl/Cmd + Enter to publish</p>
              <span
                className={`${styles.charCount} ${
                  charactersRemaining < 40 ? styles.charCountWarn : ''
                }`}
              >
                {charactersRemaining}
              </span>
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.composerActions}>
              <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.publishBtn}
                disabled={isPostDisabled}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.actions}>
        {ACTIONS.map(action => (
          <button
            key={action.label}
            type="button"
            className={styles.action}
            onClick={() => handleActionClick(action)}
          >
            <span className={styles.actionIcon}>
              <Icon name={action.icon} size={20} />
            </span>
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
