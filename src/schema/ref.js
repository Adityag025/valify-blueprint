// Ref is a token that says "look up this field in the parent context"
export class Ref {
  constructor(path) {
    this._path = Array.isArray(path) ? path : path.split('.')
    this._isRef = true
  }

  resolve(context) {
    if (!context?.parent) return undefined
    return this._path.reduce((obj, key) => obj?.[key], context.parent)
  }

  toString() {
    return `ref(${this._path.join('.')})`
  }
}

export const ref = (path) => new Ref(path)

export function isRef(value) {
  return value instanceof Ref
}
