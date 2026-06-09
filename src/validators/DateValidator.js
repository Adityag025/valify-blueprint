import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'

function toDate(v) {
  if (v instanceof Date) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function isValidDate(v) {
  const d = toDate(v)
  return d !== null
}

export class DateValidator extends BaseValidator {
  constructor() {
    super('date')
    // Coerce strings/numbers to Date on input
    this._transforms = [(v) => {
      if (v instanceof Date) return v
      const d = toDate(v)
      return d !== null ? d : v
    }]
  }

  _checkType(value) {
    return value instanceof Date && !Number.isNaN(value.getTime())
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

  before(date, message = null) {
    const ref = toDate(date)
    return this._addRule({
      name: 'before',
      code: ErrorCodes.ERR_BEFORE,
      params: { date: ref?.toISOString() },
      message,
      validate: (v) => ref !== null && v < ref,
    })
  }

  after(date, message = null) {
    const ref = toDate(date)
    return this._addRule({
      name: 'after',
      code: ErrorCodes.ERR_AFTER,
      params: { date: ref?.toISOString() },
      message,
      validate: (v) => ref !== null && v > ref,
    })
  }

  minDate(date, message = null) {
    const ref = toDate(date)
    return this._addRule({
      name: 'minDate',
      code: ErrorCodes.ERR_AFTER,
      params: { date: ref?.toISOString() },
      message,
      validate: (v) => ref !== null && v >= ref,
    })
  }

  maxDate(date, message = null) {
    const ref = toDate(date)
    return this._addRule({
      name: 'maxDate',
      code: ErrorCodes.ERR_BEFORE,
      params: { date: ref?.toISOString() },
      message,
      validate: (v) => ref !== null && v <= ref,
    })
  }

  future(message = null) {
    return this._addRule({
      name: 'future',
      code: ErrorCodes.ERR_FUTURE,
      params: {},
      message,
      validate: (v) => v > new Date(),
    })
  }

  past(message = null) {
    return this._addRule({
      name: 'past',
      code: ErrorCodes.ERR_PAST,
      params: {},
      message,
      validate: (v) => v < new Date(),
    })
  }

  between(min, max, message = null) {
    const minRef = toDate(min)
    const maxRef = toDate(max)
    return this._addRule({
      name: 'between',
      code: ErrorCodes.ERR_AFTER,
      params: { date: `${minRef?.toISOString()} – ${maxRef?.toISOString()}` },
      message: message || `Date must be between ${minRef?.toISOString()} and ${maxRef?.toISOString()}`,
      validate: (v) => minRef !== null && maxRef !== null && v >= minRef && v <= maxRef,
    })
  }

  weekday(message = null) {
    return this._addRule({
      name: 'weekday',
      code: ErrorCodes.ERR_WEEKDAY,
      params: {},
      message,
      validate: (v) => {
        const day = v.getDay()
        return day !== 0 && day !== 6
      },
    })
  }
}

export const date = () => new DateValidator()
