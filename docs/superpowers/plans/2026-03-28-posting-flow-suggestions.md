# Posting Flow — Suggestion Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the slot/template posting flow with inline suggestion cards — click an action button, pick a full pre-written post, edit freely, post.

**Architecture:** All changes are self-contained in `StartPost.jsx` and `StartPost.module.css`. The `ACTIONS` array is updated to use `suggestions` (full strings) instead of `template` (slot arrays). Template state and helpers are deleted; a single `activeSuggestions` state array drives card visibility.

**Tech Stack:** React (JSX), CSS Modules, Vitest + Testing Library

---

## File Map

| File | Change |
|---|---|
| `frontend/src/features/home/Feed/StartPost/StartPost.test.jsx` | Replace two template tests with four suggestion-card tests |
| `frontend/src/features/home/Feed/StartPost/StartPost.jsx` | Replace ACTIONS data, delete template state/helpers, replace templateBuilder JSX |
| `frontend/src/features/home/Feed/StartPost/StartPost.module.css` | Delete template/slot styles, add suggestion card styles |

---

## Task 1: Replace failing tests

**Files:**
- Modify: `frontend/src/features/home/Feed/StartPost/StartPost.test.jsx`

- [ ] **Step 1: Remove old template tests and write new ones**

Replace the last two `it(...)` blocks (lines 65–83) with:

```jsx
  it('clicking an action shows suggestion cards', () => {
    renderStartPost()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    expect(screen.getByTestId('suggestion-cards')).toBeInTheDocument()
    expect(screen.getAllByTestId('suggestion-card')).toHaveLength(3)
  })

  it('clicking a suggestion loads its text into the textarea', () => {
    renderStartPost()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    const cards = screen.getAllByTestId('suggestion-card')
    fireEvent.click(cards[0])
    expect(screen.getByLabelText('Post content')).toHaveValue(
      'Thrilled to share that I have accepted a role as Chief Vibe Strategist at Nimbus Dynamics. Grateful for everyone who believed in my journey. The ecosystem is ready for what comes next.'
    )
    expect(screen.queryByTestId('suggestion-cards')).not.toBeInTheDocument()
  })

  it('clicking the active action again dismisses suggestion cards', () => {
    renderStartPost()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    expect(screen.getByTestId('suggestion-cards')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    expect(screen.queryByTestId('suggestion-cards')).not.toBeInTheDocument()
  })

  it('cancel dismisses suggestion cards', () => {
    renderStartPost()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    expect(screen.getByTestId('suggestion-cards')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByTestId('suggestion-cards')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
cd frontend && npx vitest run src/features/home/Feed/StartPost/StartPost.test.jsx
```

Expected: the four new tests FAIL (suggestion-cards not found), the original five tests still pass.

---

## Task 2: Update ACTIONS data and rewrite StartPost logic

**Files:**
- Modify: `frontend/src/features/home/Feed/StartPost/StartPost.jsx`

- [ ] **Step 1: Replace the ACTIONS array**

Replace the entire `ACTIONS` constant (lines 14–147) with:

```js
const ACTIONS = [
  {
    icon: 'party',
    label: 'Celebrate fake promotion',
    postType: 'Career Lore',
    suggestions: [
      'Thrilled to share that I have accepted a role as Chief Vibe Strategist at Nimbus Dynamics. Grateful for everyone who believed in my journey. The ecosystem is ready for what comes next.',
      'Honored to announce my promotion to Senior Prompt Engineer. This one goes out to the mentors who saw my potential before I did. Onwards and upwards.',
      'Big news: I am joining Quantum Synergy Group as Principal Alignment Wizard. Massive thanks to the leadership team for backing this vision from day one.',
    ],
  },
  {
    icon: 'rocket',
    label: 'Announce stealth startup',
    postType: 'Stealth Build Update',
    suggestions: [
      'After months in stealth, we are launching Project Moonshot for founders. Our first mission: replace meetings with autonomous execution. The future ships today.',
      'Excited to bring SignalFlow OS out of stealth. Built for revenue teams who are tired of strategy decks that never ship. We compress a week of work into one workflow.',
      'Introducing AuraStack — built for ops leaders who believe compounding clarity is the only real moat. We have been heads-down. Now we are heads-up. Let us grow together.',
    ],
  },
  {
    icon: 'lightbulb',
    label: 'Share leadership insight',
    postType: 'Thought Leadership Incident',
    suggestions: [
      'Leadership insight: when uncertainty is high, optimize for clarity. This week we practiced it by documenting decisions in public, and it unlocked faster alignment across every team.',
      'The best teams optimize for fast feedback loops. We shipped smaller daily releases this week and the momentum was immediate. Clarity compounds.',
      'Ownership is a force multiplier. When we asked harder questions earlier, the whole org moved faster. Simple principle. Profound results.',
    ],
  },
  {
    icon: 'mirror',
    label: 'Reflect on your journey',
    postType: 'Aura Farming',
    suggestions: [
      'Looking back, my biggest shift was moving from waiting for permission to shipping before certainty. That mindset produced my most meaningful quarter yet.',
      'The moment I stopped chasing perfect plans and started learning in public, everything changed. Compounding confidence is the real north star.',
      'Choosing consistency over chasing perfect plans gave me a totally new level of execution. The journey is the product. Keep going.',
    ],
  },
]
```

- [ ] **Step 2: Delete helper functions**

Delete these three functions entirely (they were between the `ACTIONS` constant and the `POST_TYPES` constant):

```js
// DELETE these three:
const TEMPLATE_BLANK = label => `____${label.toUpperCase()}____`

function getTemplateSlots(template) { ... }

function buildTemplateDraft(template, slotValues) { ... }
```

- [ ] **Step 3: Replace template state with activeSuggestions**

In the `StartPost` function body, replace the three template state declarations:

```js
// REMOVE:
const [activeTemplate, setActiveTemplate] = useState(null)
const [slotValues, setSlotValues] = useState({})
const [activeSlotKey, setActiveSlotKey] = useState('')
```

With:

```js
// ADD:
const [activeSuggestions, setActiveSuggestions] = useState([])
const [activeActionLabel, setActiveActionLabel] = useState('')
```

- [ ] **Step 4: Replace handleActionClick**

Replace the existing `handleActionClick` function:

```js
// REMOVE:
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
```

With:

```js
// ADD:
function handleActionClick(action) {
  if (activeActionLabel === action.label) {
    setActiveSuggestions([])
    setActiveActionLabel('')
    return
  }
  setPostType(action.postType)
  setActiveSuggestions(action.suggestions)
  setActiveActionLabel(action.label)
  setError('')
  setIsFocused(true)
}
```

- [ ] **Step 5: Replace handleDraftChange**

The old `handleDraftChange` called `resetTemplateMode()`. Replace it:

```js
// REMOVE:
function handleDraftChange(event) {
  setDraft(event.target.value)
  if (activeTemplate) resetTemplateMode()
}
```

With:

```js
// ADD:
function handleDraftChange(event) {
  setDraft(event.target.value)
}
```

- [ ] **Step 6: Add handleSuggestionSelect and delete old slot handlers**

Delete these functions entirely:
- `applySlotValue`
- `handleSlotClick`
- `handleSuggestionClick`
- `resetTemplateMode`

Add this new function in their place:

```js
function handleSuggestionSelect(text) {
  setDraft(text)
  setActiveSuggestions([])
  setActiveActionLabel('')
  textareaRef.current?.focus()
}
```

- [ ] **Step 7: Update handleCancel to clear activeSuggestions**

Replace:

```js
function handleCancel() {
  setDraft('')
  setPhoto(null)
  if (fileInputRef.current) fileInputRef.current.value = ''
  resetTemplateMode()
  setError('')
  setIsFocused(false)
}
```

With:

```js
function handleCancel() {
  setDraft('')
  setPhoto(null)
  if (fileInputRef.current) fileInputRef.current.value = ''
  setActiveSuggestions([])
  setActiveActionLabel('')
  setError('')
  setIsFocused(false)
}
```

- [ ] **Step 8: Delete derived template variables at the bottom of the function body**

Remove these three lines (they were near the end of the function body, before the return):

```js
// DELETE:
const templateSlots = activeTemplate ? getTemplateSlots(activeTemplate.template) : []
const activeSlot = templateSlots.find(slot => slot.key === activeSlotKey) ?? templateSlots[0]
const activeSlotValue = activeSlot ? (slotValues[activeSlot.key] ?? '') : ''
```

- [ ] **Step 9: Replace templateBuilder JSX with suggestion cards**

In the JSX, find the `{activeTemplate ? (<div className={styles.templateBuilder}>...</div>) : null}` block inside `.expandableInner` and delete it entirely.

Then, between the photo preview block and the `.expandable` div, add:

```jsx
{activeSuggestions.length > 0 && (
  <div className={styles.suggestionCards} data-testid="suggestion-cards">
    {activeSuggestions.map((text, index) => (
      <button
        key={index}
        type="button"
        className={styles.suggestionCard}
        data-testid="suggestion-card"
        onClick={() => handleSuggestionSelect(text)}
      >
        {text}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 10: Run tests to verify all nine pass**

```bash
cd frontend && npx vitest run src/features/home/Feed/StartPost/StartPost.test.jsx
```

Expected: all 9 tests PASS.

- [ ] **Step 11: Commit**

```bash
cd frontend && git add src/features/home/Feed/StartPost/StartPost.jsx src/features/home/Feed/StartPost/StartPost.test.jsx
git commit -m "feat: replace template slot system with suggestion cards in StartPost"
```

---

## Task 3: Update CSS

**Files:**
- Modify: `frontend/src/features/home/Feed/StartPost/StartPost.module.css`

- [ ] **Step 1: Delete all template and slot styles**

Remove these entire class blocks from the CSS file:

```css
/* DELETE all of these: */
.templateBuilder { ... }
.templateHint { ... }
.templatePreview { ... }
.templateText { ... }
.slotBlank { ... }
.slotBlankFilled { ... }
.slotBlankActive { ... }
.slotEditor { ... }
.slotLabel { ... }
.slotInput { ... }
.slotInput:focus { ... }
.slotSuggestions { ... }
.slotSuggestion { ... }
.slotSuggestion:hover { ... }
```

- [ ] **Step 2: Add suggestion card styles**

Append to the end of `StartPost.module.css`:

```css
.suggestionCards {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 0;
  animation: slideDown 0.15s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.suggestionCard {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.suggestionCard:hover {
  background: rgba(10, 102, 194, 0.04);
  border-color: rgba(10, 102, 194, 0.3);
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add src/features/home/Feed/StartPost/StartPost.module.css
git commit -m "style: replace template/slot CSS with suggestion card styles"
```

---

## Done

All tests pass, template system is gone, suggestion cards are in. Verify visually by running `npm run dev` from the `frontend` directory and clicking any action button in the composer.
