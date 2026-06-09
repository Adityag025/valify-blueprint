import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { ErrorAggregator } from '../errors/ErrorAggregator.js'
import { isArray } from '../utils/typeChecks.js'

export class ArrayValidator extends BaseValidator {
  constructor(itemSchema = null) {
    super('array')
    this._itemSchema = itemSchema
  }

  _clone() {
    const clone = super._clone()
    clone._itemSchema = this._itemSchema
    return clone
  }

  _checkType(value) {
    return isArray(value)
  }

  validate(value, options = {}, field = '', path = []) {
    // Run base validation (nil check, type check, rules)
    const base = super.validate(value, options, field, path)
    if (!base.ok) return base

    // If no item schema, nothing more to validate
    if (!this._itemSchema || !isArray(base.value)) {
      return base
    }

    const aggregator = new ErrorAggregator()
    const coerced = []

    for (let i = 0; i < base.value.length; i++) {
      const item = base.value[i]
      const itemPath = [...path, String(i)]
      const itemResult = this._itemSchema.validate(item, options, String(i), itemPath)

      if (!itemResult.ok) {
        aggregator.addAll(itemResult.errors)
        if (options.abortEarly !== false) break
      } else {
        coerced.push(itemResult.value)
      }
    }

    if (aggregator.hasErrors()) {
      return { ok: false, value: undefined, errors: aggregator._errors }
    }

    return { ok: true, value: coerced, errors: [] }
  }

  async validateAsync(value, options = {}, field = '', path = []) {
    const syncResult = this.validate(value, options, field, path)
    if (!syncResult.ok && options.abortEarly !== false) return syncResult

    if (!this._itemSchema || !isArray(syncResult.value)) {
      // Run base async rules
      return super.validateAsync(value, options, field, path)
    }

    const aggregator = new ErrorAggregator()
    const coerced = []

    for (let i = 0; i < syncResult.value.length; i++) {
      if (options.signal?.aborted) break
      const item = syncResult.value[i]
      const itemPath = [...path, String(i)]
      const itemResult = await this._itemSchema.validateAsync(item, options, String(i), itemPath)

      if (!itemResult.ok) {
        aggregator.addAll(itemResult.errors)
        if (options.abortEarly !== false) break
      } else {
        coerced.push(itemResult.value)
      }
    }

    const allErrors = [...syncResult.errors, ...aggregator._errors]
    return {
      ok: allErrors.length === 0,
      value: allErrors.length === 0 ? coerced : undefined,
      errors: allErrors,
    }
  }

  required(message = null) {
    return this._addRule({
      name: 'required',
      code: ErrorCodes.ERR_REQUIRED,
      params: {},
      message,
      validate: (v) => v !== null && v !== undefined,
    })
  }

  minItems(n, message = null) {
    return this._addRule({
      name: 'minItems',
      code: ErrorCodes.ERR_MIN_ITEMS,
      params: { min: n },
      message,
      validate: (v) => v.length >= n,
    })
  }

  maxItems(n, message = null) {
    return this._addRule({
      name: 'maxItems',
      code: ErrorCodes.ERR_MAX_ITEMS,
      params: { max: n },
      message,
      validate: (v) => v.length <= n,
    })
  }

  length(n, message = null) {
    return this._addRule({
      name: 'length',
      code: ErrorCodes.ERR_LENGTH,
      params: { length: n },
      message: message || `Must have exactly ${n} items`,
      validate: (v) => v.length === n,
    })
  }

  unique(message = null) {
    return this._addRule({
      name: 'unique',
      code: ErrorCodes.ERR_UNIQUE,
      params: {},
      message,
      validate: (v) => {
        const seen = new Set()
        for (const item of v) {
          const key = typeof item === 'object' ? JSON.stringify(item) : item
          if (seen.has(key)) return false
          seen.add(key)
        }
        return true
      },
    })
  }

  contains(item, message = null) {
    return this._addRule({
      name: 'contains',
      code: ErrorCodes.ERR_CONTAINS,
      params: { substring: String(item) },
      message,
      validate: (v) =>
        v.some((el) =>
          typeof el === 'object' ? JSON.stringify(el) === JSON.stringify(item) : el === item
        ),
    })
  }

  every(fn, message = null) {
    return this._addRule({
      name: 'every',
      code: ErrorCodes.ERR_EVERY,
      params: {},
      message,
      validate: (v) => v.every(fn),
    })
  }

  some(fn, message = null) {
    return this._addRule({
      name: 'some',
      code: ErrorCodes.ERR_SOME,
      params: {},
      message,
      validate: (v) => v.some(fn),
    })
  }

  noEmpty(message = null) {
    return this._addRule({
      name: 'noEmpty',
      code: ErrorCodes.ERR_CUSTOM,
      params: {},
      message: message || 'Array must not contain empty strings',
      validate: (v) => v.every((item) => item !== ''),
    })
  }

  compact() {
    const clone = this._clone()
    clone._transforms = [...clone._transforms, (v) => (isArray(v) ? v.filter(Boolean) : v)]
    return clone
  }

  coerce() {
    const clone = this._clone()
    clone._transforms = [
      (v) => {
        if (typeof v === 'string') {
          try { return JSON.parse(v) } catch { return v }
        }
        return v
      },
      ...clone._transforms,
    ]
    return clone
  }
}

export const array = (itemSchema = null) => new ArrayValidator(itemSchema)
