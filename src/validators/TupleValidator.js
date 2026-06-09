import { BaseValidator } from '../core/BaseValidator.js'
import { ErrorCodes } from '../errors/ErrorCodes.js'
import { ErrorAggregator } from '../errors/ErrorAggregator.js'
import { ValidationError } from '../errors/ValidationError.js'
import { isArray } from '../utils/typeChecks.js'

export class TupleValidator extends BaseValidator {
  constructor(items = []) {
    super('tuple')
    this._items = items
    this._restValidator = null
  }

  _clone() {
    const clone = super._clone()
    clone._items = [...this._items]
    clone._restValidator = this._restValidator
    return clone
  }

  _checkType(value) {
    return isArray(value)
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

  // Allow additional items beyond the defined positions
  rest(validator) {
    const clone = this._clone()
    clone._restValidator = validator
    return clone
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

    if (!isArray(value)) {
      return {
        ok: false,
        value: undefined,
        errors: [
          this._buildError(ErrorCodes.ERR_TYPE, value, 'type', { type: 'array' }, ctx, null),
        ],
      }
    }

    // Length check: exact unless rest() is configured
    const expectedLen = this._items.length
    const actualLen = value.length
    const tooShort = actualLen < expectedLen
    const tooLong = !this._restValidator && actualLen > expectedLen

    if (tooShort || tooLong) {
      const expected = this._restValidator
        ? `at least ${expectedLen}`
        : `exactly ${expectedLen}`
      return {
        ok: false,
        value: undefined,
        errors: [
          new ValidationError({
            field: ctx.field,
            code: ErrorCodes.ERR_TUPLE_LENGTH,
            message: `Tuple must have ${expected} item${expectedLen === 1 ? '' : 's'}, got ${actualLen}`,
            value,
            rule: 'tupleLength',
            path: [...path],
          }),
        ],
      }
    }

    const aggregator = new ErrorAggregator()
    const coerced = []

    // Validate fixed positions
    for (let i = 0; i < this._items.length; i++) {
      const itemResult = this._items[i].validate(value[i], options, String(i), [...path, String(i)])
      if (!itemResult.ok) {
        aggregator.addAll(itemResult.errors)
        if (options.abortEarly !== false) return aggregator.toResult(undefined)
      } else {
        coerced.push(itemResult.value)
      }
    }

    // Validate rest items if rest() was configured
    if (this._restValidator) {
      for (let i = this._items.length; i < value.length; i++) {
        const itemResult = this._restValidator.validate(
          value[i],
          options,
          String(i),
          [...path, String(i)]
        )
        if (!itemResult.ok) {
          aggregator.addAll(itemResult.errors)
          if (options.abortEarly !== false) break
        } else {
          coerced.push(itemResult.value)
        }
      }
    }

    return aggregator.toResult(coerced)
  }

  async validateAsync(value, options = {}, field = '', path = []) {
    const syncResult = this.validate(value, options, field, path)
    if (!syncResult.ok && options.abortEarly !== false) return syncResult
    if (!isArray(value)) return syncResult

    const expectedLen = this._items.length
    const actualLen = value.length
    if (actualLen < expectedLen || (!this._restValidator && actualLen > expectedLen)) {
      return syncResult
    }

    const aggregator = new ErrorAggregator()
    aggregator.addAll(syncResult.errors)
    const coerced = syncResult.ok ? [...syncResult.value] : new Array(value.length)

    for (let i = 0; i < this._items.length; i++) {
      if (options.signal?.aborted) break
      const itemValidator = this._items[i]
      if (!itemValidator._asyncRules?.length) continue

      const itemResult = await itemValidator.validateAsync(
        value[i],
        options,
        String(i),
        [...path, String(i)]
      )
      if (!itemResult.ok) {
        aggregator.addAll(itemResult.errors)
        if (options.abortEarly !== false) break
      } else {
        coerced[i] = itemResult.value
      }
    }

    if (this._restValidator?._asyncRules?.length) {
      for (let i = this._items.length; i < value.length; i++) {
        if (options.signal?.aborted) break
        const itemResult = await this._restValidator.validateAsync(
          value[i],
          options,
          String(i),
          [...path, String(i)]
        )
        if (!itemResult.ok) {
          aggregator.addAll(itemResult.errors)
          if (options.abortEarly !== false) break
        } else {
          coerced[i] = itemResult.value
        }
      }
    }

    return aggregator.toResult(coerced)
  }
}

export const tuple = (items = []) => new TupleValidator(items)
