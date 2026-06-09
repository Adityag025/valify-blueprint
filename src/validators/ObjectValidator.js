import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { ErrorAggregator } from '../errors/ErrorAggregator.js'
import { ValidationError } from '../errors/ValidationError.js'
import { localeEngine } from '../locales/LocaleEngine.js'
import { isObject, safeKeys } from '../utils/typeChecks.js'

export class ObjectValidator extends BaseValidator {
  constructor(shape = {}) {
    super('object')
    this._shape = shape
    this._exact = false      // reject unknown keys
    this._strip = false      // remove unknown keys from output
    this._allowUnknown = true
  }

  _clone() {
    const clone = super._clone()
    clone._shape = { ...this._shape }
    clone._exact = this._exact
    clone._strip = this._strip
    clone._allowUnknown = this._allowUnknown
    return clone
  }

  _checkType(value) {
    return isObject(value)
  }

  validate(value, options = {}, field = '', path = []) {
    const isEmpty = value === null || value === undefined

    if (isEmpty) {
      if (this._hasDefault) return { ok: true, value: this._defaultValue, errors: [] }
      if (!this._isRequired()) return { ok: true, value: undefined, errors: [] }
      return {
        ok: false,
        value: undefined,
        errors: [this._buildError(ErrorCodes.ERR_REQUIRED, value, 'required', {}, this._buildCtx(options, field, path), null)],
      }
    }

    if (!isObject(value)) {
      return {
        ok: false,
        value: undefined,
        errors: [this._buildError(ErrorCodes.ERR_TYPE, value, 'type', { type: 'object' }, this._buildCtx(options, field, path), null)],
      }
    }

    const ctx = this._buildCtx(options, field, path)
    ctx.checkCircular(value)

    const aggregator = new ErrorAggregator()
    const coerced = {}

    // Pass circular-ref tracking and depth into child validators
    const childOptions = { ...options, _seen: ctx._seen, _depth: ctx._depth }

    // Validate shape fields
    const shapeKeys = safeKeys(this._shape)
    for (const key of shapeKeys) {
      const validator = this._shape[key]
      const childValue = value[key]
      const childPath = [...path, key]
      const childResult = validator.validate(childValue, childOptions, key, childPath)

      if (!childResult.ok) {
        aggregator.addAll(childResult.errors)
        if (options.abortEarly !== false) {
          ctx.releaseCircular(value)
          return { ok: false, value: undefined, errors: aggregator._errors }
        }
      } else if (childResult.value !== undefined || Object.prototype.hasOwnProperty.call(value, key)) {
        coerced[key] = childResult.value
      }
    }

    // Handle unknown keys
    const inputKeys = safeKeys(value)
    for (const key of inputKeys) {
      if (shapeKeys.includes(key)) continue

      if (this._exact) {
        const msg = localeEngine.getMessage(
          ErrorCodes.ERR_UNKNOWN_KEY,
          { field: ctx.label || ctx.field || 'Object', key },
          ctx.locale
        )
        aggregator.add(
          new ValidationError({
            field: key,
            code: ErrorCodes.ERR_UNKNOWN_KEY,
            message: msg,
            value: value[key],
            rule: 'exact',
            path: [...path, key],
          })
        )
      } else if (!this._strip) {
        coerced[key] = value[key]
      }
    }

    ctx.releaseCircular(value)

    // Run any object-level rules
    if (!aggregator.hasErrors()) {
      const rules = this._rules.filter((r) => r.name !== 'required')
      const ctx2 = this._buildCtx(options, field, path)
      const ruleErrors = []
      for (const rule of rules) {
        let result
        try { result = rule.validate(coerced, rule.params, ctx2) } catch { result = false }
        if (result !== true) {
          // reuse RuleRunner message logic inline
          const params = { field: ctx2.label || ctx2.field || 'Value', ...rule.params }
          const message = typeof result === 'string'
            ? result
            : localeEngine.getMessage(rule.code, params, ctx2.locale)
          ruleErrors.push(new ValidationError({
            field: ctx2.field, code: rule.code, message,
            value: coerced, rule: rule.name, path: [...path],
          }))
          if (options.abortEarly !== false) break
        }
      }
      aggregator.addAll(ruleErrors)
    }

    return aggregator.toResult(coerced)
  }

  async validateAsync(value, options = {}, field = '', path = []) {
    const syncResult = this.validate(value, options, field, path)
    if (!syncResult.ok && options.abortEarly !== false) return syncResult
    if (!isObject(value)) return syncResult

    const aggregator = new ErrorAggregator()
    aggregator.addAll(syncResult.errors)
    const coerced = syncResult.ok ? { ...syncResult.value } : {}

    const shapeKeys = safeKeys(this._shape)
    for (const key of shapeKeys) {
      if (options.signal?.aborted) break
      const validator = this._shape[key]
      if (validator._asyncRules?.length === 0) continue

      const childValue = value[key]
      const childPath = [...path, key]
      const childResult = await validator.validateAsync(childValue, options, key, childPath)

      if (!childResult.ok) {
        aggregator.addAll(childResult.errors)
        if (options.abortEarly !== false) break
      } else {
        coerced[key] = childResult.value
      }
    }

    return aggregator.toResult(coerced)
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

  exact(message = null) {
    const clone = this._clone()
    clone._exact = true
    return clone
  }

  strip() {
    const clone = this._clone()
    clone._strip = true
    return clone
  }

  unknown(allow = true) {
    const clone = this._clone()
    clone._allowUnknown = allow
    clone._exact = !allow
    return clone
  }

  // Schema composition helpers

  extend(overrideShape) {
    const clone = this._clone()
    clone._shape = { ...this._shape, ...overrideShape }
    return clone
  }

  pick(...keys) {
    const clone = this._clone()
    clone._shape = keys.reduce((acc, k) => {
      if (this._shape[k]) acc[k] = this._shape[k]
      return acc
    }, {})
    return clone
  }

  omit(...keys) {
    const clone = this._clone()
    const filtered = Object.fromEntries(
      Object.entries(this._shape).filter(([k]) => !keys.includes(k))
    )
    clone._shape = filtered
    return clone
  }
}

export const object = (shape = {}) => new ObjectValidator(shape)
