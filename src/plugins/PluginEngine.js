import { localeEngine } from '../locales/LocaleEngine.js'
import { BaseValidator } from '../core/BaseValidator.js'

export class PluginEngine {
  constructor() {
    this._plugins = new Map()
    this._hooks = {
      beforeValidate: [],
      afterValidate:  [],
      onError:        [],
    }
  }

  use(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new TypeError('[Valify] plugin must be an object')
    }
    if (!plugin.name) {
      throw new TypeError('[Valify] plugin must have a name property')
    }
    if (this._plugins.has(plugin.name)) {
      console.warn(`[Valify] Plugin "${plugin.name}" is already registered — skipping`)
      return this
    }

    if (plugin.rules) {
      for (const [name, rule] of Object.entries(plugin.rules)) {
        this._installRule(name, rule)
      }
    }

    if (plugin.locales) {
      for (const [locale, messages] of Object.entries(plugin.locales)) {
        localeEngine.extend(locale, messages)
      }
    }

    if (plugin.hooks) {
      for (const [hook, fn] of Object.entries(plugin.hooks)) {
        if (this._hooks[hook]) this._hooks[hook].push(fn)
      }
    }

    plugin.install?.({
      addRule: (name, rule) => this._installRule(name, rule),
      addLocale: (locale, messages) => localeEngine.extend(locale, messages),
      addHook: (hook, fn) => { if (this._hooks[hook]) this._hooks[hook].push(fn) },
    })

    this._plugins.set(plugin.name, plugin)
    return this
  }

  _installRule(name, rule) {
    // Attach the rule as a method on BaseValidator.prototype
    if (BaseValidator.prototype[name]) {
      console.warn(`[Valify] Rule "${name}" already exists — overwriting`)
    }
    BaseValidator.prototype[name] = function (message = null) {
      return this._addRule({
        name,
        code: rule.code || `ERR_${name.toUpperCase()}`,
        params: rule.params || {},
        message,
        validate: rule.validate,
      })
    }
  }

  runHook(hookName, payload) {
    const hooks = this._hooks[hookName] || []
    for (const fn of hooks) {
      try { fn(payload) } catch { /* hooks should not crash validation */ }
    }
  }

  isRegistered(name) {
    return this._plugins.has(name)
  }

  list() {
    return [...this._plugins.keys()]
  }
}

export const pluginEngine = new PluginEngine()

export function createPlugin(definition) {
  if (!definition.name) throw new TypeError('[Valify] createPlugin requires a name')
  return { ...definition }
}
