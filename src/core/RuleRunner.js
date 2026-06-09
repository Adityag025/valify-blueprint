import { ValidationError } from '../errors/ValidationError.js'
import { localeEngine } from '../locales/LocaleEngine.js'
import { interpolate } from '../utils/interpolate.js'

export class RuleRunner {
  run(rules, value, ctx) {
    const errors = []

    for (const rule of rules) {
      let result
      try {
        result = rule.validate(value, rule.params, ctx)
      } catch {
        result = false
      }

      if (result !== true) {
        errors.push(
          new ValidationError({
            field: ctx.field,
            code: rule.code,
            message: this._resolveMessage(rule, value, ctx, result),
            value,
            rule: rule.name,
            path: [...ctx.path],
          })
        )
        if (ctx.abortEarly !== false) break
      }
    }

    return errors
  }

  _resolveMessage(rule, value, ctx, result) {
    const params = {
      field: ctx.label || ctx.field || 'Value',
      value,
      ...rule.params,
    }

    if (rule.message !== null && rule.message !== undefined) {
      if (typeof rule.message === 'string') return interpolate(rule.message, params)
      if (typeof rule.message === 'function') return rule.message(rule.params, params.field)
    }

    if (typeof result === 'string') return result

    return localeEngine.getMessage(rule.code, params, ctx.locale)
  }
}
