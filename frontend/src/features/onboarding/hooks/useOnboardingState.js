import { useState } from 'react'

export function useOnboardingState(totalSteps = 7) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [direction, setDirection] = useState('forward')

  function advance(partialData = {}) {
    setFormData(prev => ({ ...prev, ...partialData }))
    setDirection('forward')
    setStep(prev => Math.min(totalSteps - 1, prev + 1))
  }

  function back() {
    setDirection('backward')
    setStep(prev => Math.max(0, prev - 1))
  }

  function skip() {
    setDirection('forward')
    setStep(prev => Math.min(totalSteps - 1, prev + 1))
  }

  return { step, formData, direction, advance, back, skip }
}
