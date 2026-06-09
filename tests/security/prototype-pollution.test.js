import { describe, it, expect, afterEach } from 'vitest'
import { object } from '../../src/validators/ObjectValidator.js'
import { string } from '../../src/validators/StringValidator.js'

describe('Prototype pollution prevention', () => {
  afterEach(() => {
    // Verify prototype was not polluted
    expect({}.polluted).toBeUndefined()
  })

  it('safely ignores __proto__ in object input', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "name": "Alice"}')
    const schema = object({ name: string() })
    expect(() => schema.validate(malicious)).not.toThrow()
    expect({}.polluted).toBeUndefined()
  })

  it('safely ignores constructor key in object input', () => {
    const malicious = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}')
    expect(() => object({}).validate(malicious)).not.toThrow()
    expect({}.polluted).toBeUndefined()
  })

  it('safely ignores prototype key in object input', () => {
    const malicious = JSON.parse('{"prototype": {"polluted": true}}')
    expect(() => object({}).validate(malicious)).not.toThrow()
    expect({}.polluted).toBeUndefined()
  })
})
