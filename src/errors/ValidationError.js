export class ValidationError extends Error {
  constructor({ field = '', code, message, value, rule, path = [] }) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.code = code
    this.value = value
    this.rule = rule
    this.path = path

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }

  toJSON() {
    return {
      field: this.field,
      code: this.code,
      message: this.message,
      value: this.value,
      rule: this.rule,
      path: this.path,
    }
  }
}
