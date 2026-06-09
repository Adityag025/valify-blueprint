// ─── Validators ────────────────────────────────────────────────────────────
export { string }  from './validators/StringValidator.js'
export { number }  from './validators/NumberValidator.js'
export { boolean } from './validators/BooleanValidator.js'
export { date }    from './validators/DateValidator.js'
export { array }   from './validators/ArrayValidator.js'
export { object }  from './validators/ObjectValidator.js'
export { union }   from './validators/UnionValidator.js'
export { tuple }   from './validators/TupleValidator.js'

// ─── Validator classes (for instanceof checks / subclassing) ───────────────
export { StringValidator }  from './validators/StringValidator.js'
export { NumberValidator }  from './validators/NumberValidator.js'
export { BooleanValidator } from './validators/BooleanValidator.js'
export { DateValidator }    from './validators/DateValidator.js'
export { ArrayValidator }   from './validators/ArrayValidator.js'
export { ObjectValidator }  from './validators/ObjectValidator.js'
export { UnionValidator }   from './validators/UnionValidator.js'
export { TupleValidator }   from './validators/TupleValidator.js'
export { BaseValidator }    from './core/BaseValidator.js'

// ─── Schema helpers ────────────────────────────────────────────────────────
export { ref, Ref, isRef } from './schema/ref.js'

// ─── Errors ────────────────────────────────────────────────────────────────
export { ValidationError } from './errors/ValidationError.js'
export { ErrorCodes }      from './errors/ErrorCodes.js'
export { ErrorAggregator } from './errors/ErrorAggregator.js'

// ─── i18n ──────────────────────────────────────────────────────────────────
export { localeEngine } from './locales/LocaleEngine.js'

import { localeEngine as _locale } from './locales/LocaleEngine.js'
export const setLocale      = (code) => _locale.setLocale(code)
export const registerLocale = (code, messages) => _locale.register(code, messages)
export const getLocale      = () => _locale.getLocale()

// ─── Plugins ───────────────────────────────────────────────────────────────
export { pluginEngine, createPlugin } from './plugins/PluginEngine.js'

import { pluginEngine as _plugins } from './plugins/PluginEngine.js'
export const use     = (plugin) => _plugins.use(plugin)
export const addRule = (name, spec) => _plugins._installRule(name, spec)
