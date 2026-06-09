import { describe, it, expect } from 'vitest'
import { object } from '../../src/validators/ObjectValidator.js'
import { string } from '../../src/validators/StringValidator.js'
import { number } from '../../src/validators/NumberValidator.js'
import { boolean } from '../../src/validators/BooleanValidator.js'
import { array } from '../../src/validators/ArrayValidator.js'
import { date } from '../../src/validators/DateValidator.js'

// ─── Schemas ────────────────────────────────────────────────────────────────

const AddressSchema = object({
  street:  string().required(),
  city:    string().required(),
  state:   string().required().length(2).uppercase(),
  zip:     string().required().regex(/^\d{5}$/),
  country: string().default('US'),
})

const UserSchema = object({
  name:    string().required().min(2).max(100),
  email:   string().required().email(),
  age:     number().required().integer().min(18).max(120),
  address: AddressSchema,
  tags:    array(string()).maxItems(5).unique(),
  active:  boolean().default(true),
})

const AdminSchema = UserSchema.extend({
  permissions: array(string().oneOf(['read', 'write', 'delete'])).required().minItems(1),
  superAdmin:  boolean().default(false),
})

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Real-world schemas', () => {
  describe('UserSchema', () => {
    const validUser = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 30,
      address: { street: '123 Main St', city: 'Austin', state: 'TX', zip: '73301' },
      tags: ['admin', 'user'],
    }

    it('validates a complete valid user', () => {
      const r = UserSchema.validate(validUser)
      expect(r.ok).toBe(true)
      expect(r.value.active).toBe(true)      // default applied
      expect(r.value.address.country).toBe('US')  // nested default applied
    })

    it('rejects underage user', () => {
      const r = UserSchema.validate({ ...validUser, age: 16 })
      expect(r.ok).toBe(false)
      expect(r.errors[0].path).toContain('age')
    })

    it('rejects invalid email', () => {
      const r = UserSchema.validate({ ...validUser, email: 'not-an-email' })
      expect(r.ok).toBe(false)
    })

    it('rejects duplicate tags', () => {
      const r = UserSchema.validate({ ...validUser, tags: ['admin', 'admin'] })
      expect(r.ok).toBe(false)
    })

    it('rejects too many tags', () => {
      const r = UserSchema.validate({ ...validUser, tags: ['a', 'b', 'c', 'd', 'e', 'f'] })
      expect(r.ok).toBe(false)
    })

    it('rejects invalid zip code', () => {
      const r = UserSchema.validate({
        ...validUser,
        address: { ...validUser.address, zip: 'bad-zip' },
      })
      expect(r.ok).toBe(false)
    })

    it('rejects lowercase state code', () => {
      const r = UserSchema.validate({
        ...validUser,
        address: { ...validUser.address, state: 'tx' },
      })
      expect(r.ok).toBe(false)
    })
  })

  describe('AdminSchema (extends UserSchema)', () => {
    const validAdmin = {
      name: 'Bob Admin',
      email: 'bob@example.com',
      age: 35,
      permissions: ['read', 'write'],
    }

    it('validates a valid admin', () => {
      const r = AdminSchema.validate(validAdmin)
      expect(r.ok).toBe(true)
      expect(r.value.superAdmin).toBe(false)  // default
    })

    it('rejects invalid permission values', () => {
      const r = AdminSchema.validate({ ...validAdmin, permissions: ['read', 'hack'] })
      expect(r.ok).toBe(false)
    })

    it('rejects empty permissions array', () => {
      const r = AdminSchema.validate({ ...validAdmin, permissions: [] })
      expect(r.ok).toBe(false)
    })

    it('does not mutate UserSchema when extending', () => {
      expect(UserSchema._shape).not.toHaveProperty('permissions')
      expect(UserSchema._shape).not.toHaveProperty('superAdmin')
    })
  })

  describe('ErrorAggregator.byField()', () => {
    it('groups errors by field path', () => {
      const r = UserSchema.validate(
        { name: '', email: 'bad', age: 10 },
        { abortEarly: false }
      )
      expect(r.ok).toBe(false)
      const byField = r.errors.reduce((acc, e) => {
        const key = e.path.join('.') || e.field
        acc[key] = acc[key] || []
        acc[key].push(e)
        return acc
      }, {})
      expect(byField['name']).toBeDefined()
      expect(byField['email']).toBeDefined()
      expect(byField['age']).toBeDefined()
    })
  })
})

describe('Registration form (common web pattern)', () => {
  const RegistrationSchema = object({
    username: string().required().min(3).max(20).alphaNumeric(),
    email:    string().required().email(),
    password: string().required().min(8).custom((v) => {
      const hasUpper = /[A-Z]/.test(v)
      const hasDigit = /\d/.test(v)
      if (!hasUpper || !hasDigit) return 'Password must contain uppercase and a digit'
      return true
    }),
    agree:    boolean().required().true('You must accept the terms'),
  })

  it('passes with valid registration data', () => {
    const r = RegistrationSchema.validate({
      username: 'alice123',
      email: 'alice@example.com',
      password: 'StrongPass1',
      agree: true,
    })
    expect(r.ok).toBe(true)
  })

  it('collects all errors in one pass', () => {
    const r = RegistrationSchema.validate(
      { username: 'x!', email: 'bad', password: 'weak', agree: false },
      { abortEarly: false }
    )
    expect(r.ok).toBe(false)
    expect(r.errors.length).toBeGreaterThanOrEqual(4)
  })
})
