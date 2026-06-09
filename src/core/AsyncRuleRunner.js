import { ValidationError } from '../errors/ValidationError.js'
import { localeEngine } from '../locales/LocaleEngine.js'
import { interpolate } from '../utils/interpolate.js'

export class AsyncRuleRunner {
  async run(rules, value, ctx) {
    const errors = []

    if (ctx.parallel) {
      const settled = await Promise.allSettled(
        rules.map((rule) => this._runOne(rule, value, ctx))
      )
      for (const s of settled) {
        if (s.status === 'fulfilled' && s.value !== null) errors.push(s.value)
        // AbortError and other rejections are intentionally swallowed
      }
    } else {
      for (const rule of rules) {
        if (ctx.signal?.aborted) break
        try {
          const err = await this._runOne(rule, value, ctx)
          if (err !== null) {
            errors.push(err)
            if (ctx.abortEarly !== false) break
          }
        } catch (e) {
          if (e?.name === 'AbortError') break
          throw e
        }
      }
    }

    return errors
  }

  async _runOne(rule, value, ctx) {
    let result
    try {
      result = await rule.validate(value, rule.params, ctx)
    } catch (e) {
      if (e?.name === 'AbortError') throw e
      result = false
    }

    if (result === true) return null

    const params = {
      field: ctx.label || ctx.field || 'Value',
      value,
      ...rule.params,
    }

    let message
    if (typeof result === 'string') {
      message = result
    } else if (rule.message) {
      message =
        typeof rule.message === 'string'
          ? interpolate(rule.message, params)
          : rule.message(rule.params, params.field)
    } else {
      message = localeEngine.getMessage(rule.code, params, ctx.locale)
    }

    return new ValidationError({
      field: ctx.field,
      code: rule.code,
      message,
      value,
      rule: rule.name,
      path: [...ctx.path],
    })
  }
}
