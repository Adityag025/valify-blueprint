import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { isBoolean } from '../utils/typeChecks.js'

export class BooleanValidator extends BaseValidator {
  constructor() {
    super('boolean')
  }

  _checkType(value) {
    return isBoolean(value)
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

  true(message = null) {
    return this._addRule({
      name: 'true',
      code: ErrorCodes.ERR_BOOLEAN_TRUE,
      params: {},
      message,
      validate: (v) => v === true,
    })
  }

  false(message = null) {
    return this._addRule({
      name: 'false',
      code: ErrorCodes.ERR_BOOLEAN_FALSE,
      params: {},
      message,
      validate: (v) => v === false,
    })
  }

  equals(bool, message = null) {
    return bool ? this.true(message) : this.false(message)
  }
}

export const boolean = () => new BooleanValidator()
