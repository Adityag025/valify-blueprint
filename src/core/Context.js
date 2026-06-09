const MAX_DEPTH = 50

export class ValidationContext {
  constructor(options = {}, field = '', path = []) {
    this.field = field
    this.path = Array.isArray(path) ? path : []
    this.abortEarly = options.abortEarly
    this.locale = options.locale || null
    this.signal = options.signal || null
    this.parallel = options.parallel || false
    this.extra = options.context || {}
    this._depth = options._depth || 0
    this._seen = options._seen || new WeakSet()

    if (this._depth > MAX_DEPTH) {
      throw new Error(
        `[Valify] Maximum validation depth (${MAX_DEPTH}) exceeded. ` +
          'Check for deeply nested schemas.'
      )
    }
  }

  checkCircular(value) {
    if (typeof value === 'object' && value !== null) {
      if (this._seen.has(value)) {
        throw new Error(
          '[Valify] Circular reference detected in the value being validated.'
        )
      }
      this._seen.add(value)
    }
  }

  releaseCircular(value) {
    if (typeof value === 'object' && value !== null) {
      this._seen.delete(value)
    }
  }

  child(field, path) {
    return new ValidationContext(
      {
        abortEarly: this.abortEarly,
        locale: this.locale,
        signal: this.signal,
        parallel: this.parallel,
        context: this.extra,
        _depth: this._depth + 1,
        _seen: this._seen,
      },
      field,
      path
    )
  }
}
