import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MockDataProvider } from '../../context/MockDataContext'
import Me from './Me'

describe('Me', () => {
  it('renders without crashing', () => {
    render(
      <MockDataProvider>
        <Me />
      </MockDataProvider>
    )
    expect(document.body).toBeTruthy()
  })
})
