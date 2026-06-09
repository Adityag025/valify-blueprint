import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { PATTERNS, validateUserRegex } from '../utils/safeRegex.js'
import { isString } from '../utils/typeChecks.js'
import { isRef } from '../schema/ref.js'

export class StringValidator extends BaseValidator {
  constructor() {
    super('string')
  }

  _checkType(value) {
    return isString(value)
  }

  required(message = null) {
    return this._addRule({
      name: 'required',
      code: ErrorCodes.ERR_REQUIRED,
      params: {},
      message,
      validate: (v) => v !== null && v !== undefined && v !== '',
    })
  }

  min(n, message = null) {
    return this._addRule({
      name: 'min',
      code: ErrorCodes.ERR_MIN,
      params: { min: n },
      message,
      validate: (v) => v.length >= n,
    })
  }

  max(n, message = null) {
    return this._addRule({
      name: 'max',
      code: ErrorCodes.ERR_MAX,
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
      message,
      validate: (v) => v.length === n,
    })
  }

  email(message = null) {
    return this._addRule({
      name: 'email',
      code: ErrorCodes.ERR_EMAIL,
      params: {},
      message,
      validate: (v) => PATTERNS.email.test(v),
    })
  }

  url(message = null) {
    return this._addRule({
      name: 'url',
      code: ErrorCodes.ERR_URL,
      params: {},
      message,
      validate: (v) => PATTERNS.url.test(v),
    })
  }

  uuid(message = null) {
    return this._addRule({
      name: 'uuid',
      code: ErrorCodes.ERR_UUID,
      params: {},
      message,
      validate: (v) => PATTERNS.uuid.test(v),
    })
  }

  regex(pattern, message = null) {
    validateUserRegex(pattern)
    return this._addRule({
      name: 'regex',
      code: ErrorCodes.ERR_REGEX,
      params: { pattern: pattern.toString() },
      message,
      validate: (v) => pattern.test(v),
    })
  }

  alpha(message = null) {
    return this._addRule({
      name: 'alpha',
      code: ErrorCodes.ERR_ALPHA,
      params: {},
      message,
      validate: (v) => PATTERNS.alpha.test(v),
    })
  }

  alphaNumeric(message = null) {
    return this._addRule({
      name: 'alphaNumeric',
      code: ErrorCodes.ERR_ALPHA_NUMERIC,
      params: {},
      message,
      validate: (v) => PATTERNS.alphaNumeric.test(v),
    })
  }

  lowercase(message = null) {
    return this._addRule({
      name: 'lowercase',
      code: ErrorCodes.ERR_LOWERCASE,
      params: {},
      message,
      validate: (v) => v === v.toLowerCase(),
    })
  }

  uppercase(message = null) {
    return this._addRule({
      name: 'uppercase',
      code: ErrorCodes.ERR_UPPERCASE,
      params: {},
      message,
      validate: (v) => v === v.toUpperCase(),
    })
  }

  contains(substring, message = null) {
    return this._addRule({
      name: 'contains',
      code: ErrorCodes.ERR_CONTAINS,
      params: { substring },
      message,
      validate: (v) => v.includes(substring),
    })
  }

  startsWith(prefix, message = null) {
    return this._addRule({
      name: 'startsWith',
      code: ErrorCodes.ERR_STARTS_WITH,
      params: { prefix },
      message,
      validate: (v) => v.startsWith(prefix),
    })
  }

  endsWith(suffix, message = null) {
    return this._addRule({
      name: 'endsWith',
      code: ErrorCodes.ERR_ENDS_WITH,
      params: { suffix },
      message,
      validate: (v) => v.endsWith(suffix),
    })
  }

  oneOf(values, message = null) {
    return this._addRule({
      name: 'oneOf',
      code: ErrorCodes.ERR_ONE_OF,
      params: { values: values.join(', ') },
      message,
      validate: (v) => values.includes(v),
    })
  }

  trim() {
    const clone = this._clone()
    clone._transforms = [...clone._transforms, (v) => (isString(v) ? v.trim() : v)]
    return clone
  }

  coerce() {
    const clone = this._clone()
    clone._transforms = [
      (v) => (v !== null && v !== undefined && !isString(v) ? String(v) : v),
      ...clone._transforms,
    ]
    return clone
  }

  equals(refOrValue, message = null) {
    return this._addRule({
      name: 'equals',
      code: ErrorCodes.ERR_CUSTOM,
      params: {},
      message,
      validate: (value, _params, ctx) => {
        const target = isRef(refOrValue) ? refOrValue.resolve(ctx) : refOrValue
        if (value === target) return true
        if (message) return false
        return isRef(refOrValue)
          ? `Must match ${refOrValue._path.join('.')}`
          : `Must equal "${target}"`
      },
    })
  }
}

export const string = () => new StringValidator()
