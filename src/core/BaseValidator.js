import { RuleRunner } from './RuleRunner.js'
import { AsyncRuleRunner } from './AsyncRuleRunner.js'
import { ValidationContext } from './Context.js'
import { ValidationError } from '../errors/ValidationError.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { localeEngine } from '../locales/LocaleEngine.js'

const syncRunner = new RuleRunner()
const asyncRunner = new AsyncRuleRunner()

export class BaseValidator {
  constructor(typeName) {
    this._typeName = typeName
    this._rules = []
    this._asyncRules = []
    this._label = null
    this._optional = false
    this._defaultValue = undefined
    this._hasDefault = false
    this._transforms = []
  }

  _clone() {
    const clone = Object.create(Object.getPrototypeOf(this))
    // Copy all own enumerable properties, then deep-copy mutable arrays
    Object.assign(clone, this)
    clone._rules = [...this._rules]
    clone._asyncRules = [...this._asyncRules]
    clone._transforms = [...this._transforms]
    return clone
  }

  _addRule(rule) {
    const clone = this._clone()
    clone._rules = [...clone._rules, rule]
    return clone
  }

  _addAsyncRule(rule) {
    const clone = this._clone()
    clone._asyncRules = [...clone._asyncRules, rule]
    return clone
  }

  optional() {
    const clone = this._clone()
    clone._optional = true
    return clone
  }

  default(value) {
    const clone = this._clone()
    clone._defaultValue = value
    clone._hasDefault = true
    return clone
  }

  label(name) {
    const clone = this._clone()
    clone._label = name
    return clone
  }

  _isRequired() {
    return this._rules.some((r) => r.name === 'required')
  }

  _buildCtx(options, field, path) {
    const ctx = new ValidationContext(options, field, path)
    ctx.label = this._label || field
    return ctx
  }

  // Subclasses override this to add type-specific checking
  _checkType(_value) {
    return true
  }

  _applyTransforms(value) {
    return this._transforms.reduce((v, fn) => fn(v), value)
  }

  _buildError(code, value, ruleName, params, ctx, customMessage) {
    const msgParams = {
      field: ctx.label || ctx.field || 'Value',
      value,
      ...params,
    }
    const message = customMessage
      ? typeof customMessage === 'string'
        ? customMessage
        : customMessage(params, msgParams.field)
      : localeEngine.getMessage(code, msgParams, ctx.locale)

    return new ValidationError({
      field: ctx.field,
      code,
      message,
      value,
      rule: ruleName,
      path: [...ctx.path],
    })
  }

  validate(value, options = {}, field = '', path = []) {
    const ctx = this._buildCtx(options, field, path)
    const isEmpty = value === null || value === undefined || value === ''

    if (isEmpty) {
      if (this._hasDefault) {
        return { ok: true, value: this._defaultValue, errors: [] }
      }
      if (!this._isRequired()) {
        // Not required — undefined/null/'' is fine
        return { ok: true, value: undefined, errors: [] }
      }
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

    const transformed = this._applyTransforms(value)

    if (!this._checkType(transformed)) {
      return {
        ok: false,
        value: undefined,
        errors: [
          this._buildError(
            ErrorCodes.ERR_TYPE,
            value,
            'type',
            { type: this._typeName },
            ctx,
            null
          ),
        ],
      }
    }

    const rules = this._rules.filter((r) => r.name !== 'required')
    const errors = syncRunner.run(rules, transformed, ctx)

    return {
      ok: errors.length === 0,
      value: errors.length === 0 ? transformed : undefined,
      errors,
    }
  }

  async validateAsync(value, options = {}, field = '', path = []) {
    const syncResult = this.validate(value, options, field, path)

    if (this._asyncRules.length === 0) return syncResult

    // Bail early if sync already failed and abortEarly is not disabled
    if (!syncResult.ok && options.abortEarly !== false) return syncResult

    const isEmpty = value === null || value === undefined || value === ''
    if (isEmpty) return syncResult

    const ctx = this._buildCtx(options, field, path)
    const transformed = this._applyTransforms(value)
    const asyncErrors = await asyncRunner.run(this._asyncRules, transformed, ctx)
    const allErrors = [...syncResult.errors, ...asyncErrors]

    return {
      ok: allErrors.length === 0,
      value: allErrors.length === 0 ? transformed : undefined,
      errors: allErrors,
    }
  }

  custom(fn, code = ErrorCodes.ERR_CUSTOM, customMessage = null) {
    return this._addRule({
      name: 'custom',
      code,
      params: {},
      message: customMessage,
      validate: (value, _params, ctx) => fn(value, ctx),
    })
  }

  customAsync(fn, code = ErrorCodes.ERR_CUSTOM) {
    return this._addAsyncRule({
      name: 'customAsync',
      code,
      params: {},
      message: null,
      validate: async (value, _params, ctx) => {
        if (ctx.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
        return fn(value, ctx)
      },
    })
  }
}
