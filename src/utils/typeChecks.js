export const isString = (v) => typeof v === 'string'
export const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v)
export const isBoolean = (v) => typeof v === 'boolean'
export const isArray = (v) => Array.isArray(v)
export const isNil = (v) => v === null || v === undefined
export const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export const isDate = (v) => {
  if (v instanceof Date) return !Number.isNaN(v.getTime())
  return false
}

export const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key)

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
export const safeKeys = (obj) => Object.keys(obj).filter((k) => !BLOCKED_KEYS.has(k))

export const createSafeMap = () => Object.create(null)
