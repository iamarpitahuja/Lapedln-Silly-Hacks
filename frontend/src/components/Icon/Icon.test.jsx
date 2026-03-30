import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Icon from './Icon'

describe('Icon', () => {
  it('renders a camera icon without returning null', () => {
    const { container } = render(<Icon name="camera" size={20} />)
    expect(container.firstChild).not.toBeNull()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
