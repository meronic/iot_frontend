/**
 * Utility helper functions for the IoT Device Monitoring Dashboard
 */

/**
 * Deep clone an object to avoid reference issues
 * @param {*} obj - The object to clone
 * @returns {*} A deep copy of the object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  // Handle Array objects
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item))
  }

  // Handle Object objects
  const clonedObj = {}
  Object.keys(obj).forEach((key) => {
    clonedObj[key] = deepClone(obj[key])
  })

  return clonedObj
}

/**
 * Ensure an object has required properties with default values
 * @param {Object} obj - The object to ensure completeness
 * @param {Object} defaults - Default values for missing properties
 * @returns {Object} The complete object with all properties
 */
export const ensureObjectCompleteness = (obj, defaults) => {
  if (!obj || typeof obj !== 'object') {
    return deepClone(defaults)
  }

  const result = deepClone(obj)

  // Merge in any missing properties from defaults
  Object.keys(defaults).forEach((key) => {
    if (result[key] === undefined) {
      result[key] = deepClone(defaults[key])
    } else if (
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      // Recursively ensure nested objects are complete
      result[key] = ensureObjectCompleteness(result[key], defaults[key])
    }
  })

  return result
}

/**
 * Format a number with thousands separators
 * @param {number} num - The number to format
 * @returns {string} - The formatted number
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

/**
 * Format a date as a readable string
 * @param {Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - The formatted date
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date)
}
