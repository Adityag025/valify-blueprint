import { interpolate } from '../utils/interpolate.js'
import enMessages from './en.js'

class LocaleEngine {
  constructor() {
    this._locale = 'en'
    this._fallback = 'en'
    this._locales = { en: enMessages }
  }

  register(locale, messages) {
    this._locales[locale] = { ...(this._locales[locale] || {}), ...messages }
    return this
  }

  setLocale(locale) {
    if (!this._locales[locale]) {
      throw new Error(
        `[Valify] Locale "${locale}" is not registered. ` +
          'Call registerLocale(code, messages) before setLocale().'
      )
    }
    this._locale = locale
    return this
  }

  getLocale() {
    return this._locale
  }

  extend(locale, messages) {
    this._locales[locale] = { ...(this._locales[locale] || {}), ...messages }
    return this
  }

  getMessage(code, params = {}, overrideLocale = null) {
    const locale = overrideLocale || this._locale
    const messages = this._locales[locale] || this._locales[this._fallback]
    const fallbackMessages = this._locales[this._fallback]
    const template =
      messages?.[code] || fallbackMessages?.[code] || `Validation failed: ${code}`
    return interpolate(template, params)
  }
}

// Module-level singleton — shared across the whole app
export const localeEngine = new LocaleEngine()
