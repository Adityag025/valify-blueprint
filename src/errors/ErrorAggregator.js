export class ErrorAggregator {
  constructor() {
    this._errors = []
  }

  add(error) {
    this._errors.push(error)
    return this
  }

  addAll(errors) {
    this._errors.push(...errors)
    return this
  }

  hasErrors() {
    return this._errors.length > 0
  }

  get count() {
    return this._errors.length
  }

  // Group errors by dot-joined path for easy form rendering
  byField() {
    return this._errors.reduce((acc, err) => {
      const key = err.path.length ? err.path.join('.') : err.field
      if (!acc[key]) acc[key] = []
      acc[key].push(err)
      return acc
    }, Object.create(null))
  }

  toResult(value) {
    return {
      ok: !this.hasErrors(),
      value: this.hasErrors() ? undefined : value,
      errors: [...this._errors],
    }
  }
}
