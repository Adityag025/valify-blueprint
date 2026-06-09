import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { ValidationError } from '../errors/ValidationError.js'

export class UnionValidator extends BaseValidator {
  constructor(validators) {
    super('union')
    this._validators = validators
  }

  _clone() {
    const clone = super._clone()
    clone._validators = [...this._validators]
    return clone
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

  _unionError(value, ctx, path) {
    const typeNames = this._validators.map((v) => v._typeName || 'unknown').join(', ')
    return new ValidationError({
      field: ctx.field,
      code: ErrorCodes.ERR_UNION,
      message: `Value must be one of: ${typeNames}`,
      value,
      rule: 'union',
      path: [...path],
    })
  }

  validate(value, options = {}, field = '', path = []) {
    if (this._conditionals.length) {
      return this._resolveConditionals(options).validate(value, options, field, path)
    }

    const ctx = this._buildCtx(options, field, path)
    const isEmpty = value === null || value === undefined

    if (isEmpty) {
      if (this._hasDefault) return { ok: true, value: this._defaultValue, errors: [] }
      if (!this._isRequired()) return { ok: true, value: undefined, errors: [] }
      const requiredRule = this._rules.find((r) => r.name === 'required')
      return {
        ok: false,
        value: undefined,
        errors: [
          this._buildError(
            ErrorCodes.ERR_REQUIRED,
            value,
            'required',
            {},
            ctx,
            requiredRule?.message || null
          ),
        ],
      }
    }

    // Try each branch — return on first success
    const branchErrors = []
    for (const v of this._validators) {
      const result = v.validate(value, options, field, path)
      if (result.ok) return result
      branchErrors.push(result.errors)
    }

    // All branches failed — single top-level error + branch context
    const topError = this._unionError(value, ctx, path)
    topError.branchErrors = branchErrors
    return { ok: false, value: undefined, errors: [topError] }
  }

  async validateAsync(value, options = {}, field = '', path = []) {
    if (this._conditionals.length) {
      return this._resolveConditionals(options).validateAsync(value, options, field, path)
    }

    const isEmpty = value === null || value === undefined
    if (isEmpty) return this.validate(value, options, field, path)

    const ctx = this._buildCtx(options, field, path)
    const branchErrors = []

    for (const v of this._validators) {
      const result = await v.validateAsync(value, options, field, path)
      if (result.ok) return result
      branchErrors.push(result.errors)
    }

    const topError = this._unionError(value, ctx, path)
    topError.branchErrors = branchErrors
    return { ok: false, value: undefined, errors: [topError] }
  }
}

export const union = (validators) => new UnionValidator(validators)
