import { describe, it, expect } from 'vitest'
import { object } from '../../../src/validators/ObjectValidator.js'
import { string } from '../../../src/validators/StringValidator.js'
import { number } from '../../../src/validators/NumberValidator.js'
import { boolean } from '../../../src/validators/BooleanValidator.js'
import { array } from '../../../src/validators/ArrayValidator.js'
import { ErrorCodes } from '../../../src/errors/ErrorCodes.js'

describe('ObjectValidator', () => {
  const UserSchema = object({
    name:  string().required().min(2),
    email: string().required().email(),
    age:   number().required().integer().min(18),
  })

  it('passes with valid data', () => {
    const r = UserSchema.validate({ name: 'Alice', email: 'alice@example.com', age: 25 })
    expect(r.ok).toBe(true)
    expect(r.value).toEqual({ name: 'Alice', email: 'alice@example.com', age: 25 })
  })

  it('fails with missing required fields', () => {
    const r = UserSchema.validate({}, { abortEarly: false })
    expect(r.ok).toBe(false)
    expect(r.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('collects nested errors with correct paths', () => {
    const r = UserSchema.validate({ name: 'A', email: 'bad', age: 10 }, { abortEarly: false })
    expect(r.ok).toBe(false)
    const paths = r.errors.map(e => e.path.join('.'))
    expect(paths).toContain('name')
    expect(paths).toContain('email')
    expect(paths).toContain('age')
  })

  it('strips unknown keys with .strip()', () => {
    const schema = UserSchema.strip()
    const r = schema.validate({ name: 'Alice', email: 'alice@example.com', age: 25, extra: 'oops' })
    expect(r.ok).toBe(true)
    expect(r.value).not.toHaveProperty('extra')
  })

  it('rejects unknown keys with .exact()', () => {
    const schema = UserSchema.exact()
    const r = schema.validate({ name: 'Alice', email: 'alice@example.com', age: 25, extra: 'oops' }, { abortEarly: false })
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => e.code === ErrorCodes.ERR_UNKNOWN_KEY)).toBe(true)
  })

  it('allows unknown keys by default', () => {
    const r = UserSchema.validate({ name: 'Alice', email: 'alice@example.com', age: 25, extra: 'fine' })
    expect(r.ok).toBe(true)
    expect(r.value.extra).toBe('fine')
  })

  it('returns undefined for missing optional fields', () => {
    const schema = object({ name: string().required(), bio: string() })
    const r = schema.validate({ name: 'Alice' })
    expect(r.ok).toBe(true)
    expect(r.value.bio).toBeUndefined()
  })

  describe('.extend()', () => {
    it('adds new fields to the schema', () => {
      const AdminSchema = UserSchema.extend({ role: string().required() })
      const r = AdminSchema.validate({ name: 'Bob', email: 'bob@example.com', age: 30, role: 'admin' })
      expect(r.ok).toBe(true)
    })

    it('does not mutate the original schema', () => {
      UserSchema.extend({ role: string().required() })
      expect(UserSchema._shape).not.toHaveProperty('role')
    })
  })

  describe('.pick()', () => {
    it('creates a schema with only picked keys', () => {
      const NameOnly = UserSchema.pick('name')
      const r = NameOnly.validate({ name: 'Alice', email: 'should-be-ignored' })
      expect(r.ok).toBe(true)
    })
  })

  describe('.omit()', () => {
    it('creates a schema without omitted keys', () => {
      const WithoutAge = UserSchema.omit('age')
      expect(WithoutAge._shape).not.toHaveProperty('age')
      expect(WithoutAge._shape).toHaveProperty('name')
    })
  })

  describe('nested schemas', () => {
    const AddressSchema = object({ city: string().required(), zip: string().required() })
    const ProfileSchema = object({ user: UserSchema.required(), address: AddressSchema.required() })

    it('validates nested objects', () => {
      const r = ProfileSchema.validate({
        user: { name: 'Alice', email: 'alice@example.com', age: 25 },
        address: { city: 'NYC', zip: '10001' },
      })
      expect(r.ok).toBe(true)
    })

    it('reports nested errors with full paths', () => {
      const r = ProfileSchema.validate(
        { user: { name: '', email: 'bad', age: 10 }, address: { city: '', zip: '' } },
        { abortEarly: false }
      )
      expect(r.ok).toBe(false)
      const pathStrings = r.errors.map(e => e.path.join('.'))
      expect(pathStrings.some(p => p.startsWith('user.'))).toBe(true)
      expect(pathStrings.some(p => p.startsWith('address.'))).toBe(true)
    })
  })

  describe('circular reference protection', () => {
    it('throws on circular reference', () => {
      const circular = {}
      circular.self = circular
      expect(() => object({ self: object() }).validate(circular)).toThrow(/circular/i)
    })
  })
})
