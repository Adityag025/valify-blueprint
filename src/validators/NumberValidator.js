import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { isNumber } from '../utils/typeChecks.js'

export class NumberValidator extends BaseValidator {
  constructor() {
    super('number')
  }

  _checkType(value) {
    return isNumber(value)
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

  min(n, message = null) {
    return this._addRule({
      name: 'min',
      code: ErrorCodes.ERR_MIN,
      params: { min: n },
      message,
      validate: (v) => v >= n,
    })
  }

  max(n, message = null) {
    return this._addRule({
      name: 'max',
      code: ErrorCodes.ERR_MAX,
      params: { max: n },
      message,
      validate: (v) => v <= n,
    })
  }

  integer(message = null) {
    return this._addRule({
      name: 'integer',
      code: ErrorCodes.ERR_INTEGER,
      params: {},
      message,
      validate: (v) => Number.isInteger(v),
    })
  }

  float(message = null) {
    return this._addRule({
      name: 'float',
      code: ErrorCodes.ERR_FLOAT,
      params: {},
      message,
      validate: (v) => !Number.isInteger(v),
    })
  }

  positive(message = null) {
    return this._addRule({
      name: 'positive',
      code: ErrorCodes.ERR_POSITIVE,
      params: {},
      message,
      validate: (v) => v > 0,
    })
  }

  negative(message = null) {
    return this._addRule({
      name: 'negative',
      code: ErrorCodes.ERR_NEGATIVE,
      params: {},
      message,
      validate: (v) => v < 0,
    })
  }

  nonNegative(message = null) {
    return this._addRule({
      name: 'nonNegative',
      code: ErrorCodes.ERR_NON_NEGATIVE,
      params: {},
      message,
      validate: (v) => v >= 0,
    })
  }

  between(min, max, message = null) {
    return this._addRule({
      name: 'between',
      code: ErrorCodes.ERR_MIN,
      params: { min, max },
      message: message || `Value must be between ${min} and ${max}`,
      validate: (v) => v >= min && v <= max,
    })
  }

  multipleOf(n, message = null) {
    return this._addRule({
      name: 'multipleOf',
      code: ErrorCodes.ERR_MULTIPLE_OF,
      params: { multiple: n },
      message,
      validate: (v) => v % n === 0,
    })
  }

  finite(message = null) {
    return this._addRule({
      name: 'finite',
      code: ErrorCodes.ERR_FINITE,
      params: {},
      message,
      validate: (v) => Number.isFinite(v),
    })
  }

  safe(message = null) {
    return this._addRule({
      name: 'safe',
      code: ErrorCodes.ERR_SAFE,
      params: {},
      message,
      validate: (v) => Number.isSafeInteger(v),
    })
  }
}

export const number = () => new NumberValidator()
