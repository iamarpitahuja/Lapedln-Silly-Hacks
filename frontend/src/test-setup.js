import '@testing-library/jest-dom'

if (!globalThis.IntersectionObserver) {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }

  globalThis.IntersectionObserver = MockIntersectionObserver
}
