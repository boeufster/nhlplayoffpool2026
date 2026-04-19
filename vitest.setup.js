// Create a simple in-memory localStorage mock that doesn't use Base64
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: (key) => {
      try {
        return store.hasOwnProperty(key) ? store[key] : null
      } catch (e) {
        return null
      }
    },
    setItem: (key, value) => {
      try {
        // Ensure value is a string
        store[key] = String(value)
      } catch (e) {
        // Silently fail on storage errors
      }
    },
    removeItem: (key) => {
      try {
        delete store[key]
      } catch (e) {
        // Silently fail
      }
    },
    clear: () => {
      try {
        store = {}
      } catch (e) {
        // Silently fail
      }
    },
    key: (index) => {
      try {
        const keys = Object.keys(store)
        return keys[index] || null
      } catch (e) {
        return null
      }
    },
    get length() {
      try {
        return Object.keys(store).length
      } catch (e) {
        return 0
      }
    }
  }
})()

// Replace global localStorage with mock to avoid jsdom's Base64 issues
if (typeof global !== 'undefined') {
  global.localStorage = localStorageMock
}

// Also replace window.localStorage if in browser environment
if (typeof window !== 'undefined') {
  window.localStorage = localStorageMock
}

// Clear localStorage before each test suite
try {
  localStorage.clear()
} catch (e) {
  // Ignore
}

