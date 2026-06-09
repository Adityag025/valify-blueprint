import { describe, it, expect } from 'vitest'
import { object } from '../../../src/validators/ObjectValidator.js'
import { string } from '../../../src/validators/StringValidator.js'
import { number } from '../../../src/validators/NumberValidator.js'
import { ref } from '../../../src/schema/ref.js'

describe('when() conditional validation', () => {
  it('applies then branch when condition matches', () => {
    const schema = object({
      paymentMethod: string().required(),
      cardNumber: string().when('paymentMethod', {
        is: 'card',
        then: (s) => s.required().min(16, 'Card number required'),
      }),
    })

    const result = schema.validate({ paymentMethod: 'card', cardNumber: '' })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.field === 'cardNumber')).toBe(true)
  })

  it('skips required when condition does not match', () => {
    const schema = object({
      paymentMethod: string().required(),
      cardNumber: string().when('paymentMethod', {
        is: 'card',
        then: (s) => s.required().min(16),
      }),
    })

    const result = schema.validate({ paymentMethod: 'bank', cardNumber: '' })
    expect(result.ok).toBe(true)
  })

  it('applies otherwise branch when condition does not match', () => {
    const schema = object({
      role: string().required(),
      bio: string().when('role', {
        is: 'admin',
        then: (s) => s.optional(),
        otherwise: (s) => s.required(),
      }),
    })

    const result = schema.validate({ role: 'user', bio: '' })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.field === 'bio')).toBe(true)
  })

  it('accepts otherwise branch when admin', () => {
    const schema = object({
      role: string().required(),
      bio: string().when('role', {
        is: 'admin',
        then: (s) => s.optional(),
        otherwise: (s) => s.required(),
      }),
    })

    const result = schema.validate({ role: 'admin', bio: '' })
    expect(result.ok).toBe(true)
  })

  it('supports function predicate in is', () => {
    const schema = object({
      age: number().required(),
      parentConsent: string().when('age', {
        is: (v) => v < 18,
        then: (s) => s.required('Parental consent required'),
      }),
    })

    const underage = schema.validate({ age: 16, parentConsent: '' })
    expect(underage.ok).toBe(false)

    const adult = schema.validate({ age: 20, parentConsent: '' })
    expect(adult.ok).toBe(true)
  })
})

describe('ref() cross-field validation', () => {
  it('validates password confirmation matches password', () => {
    const schema = object({
      password: string().required().min(8),
      confirm: string().required().equals(ref('password'), 'Passwords must match'),
    })

    const good = schema.validate({ password: 'secret123', confirm: 'secret123' })
    expect(good.ok).toBe(true)

    const bad = schema.validate({ password: 'secret123', confirm: 'wrong' })
    expect(bad.ok).toBe(false)
    expect(bad.errors[0].message).toBe('Passwords must match')
  })

  it('shows default message without custom message', () => {
    const schema = object({
      password: string().required(),
      confirm: string().required().equals(ref('password')),
    })

    const result = schema.validate({ password: 'abc', confirm: 'xyz' })
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/password/)
  })

  it('passes when ref value matches', () => {
    const schema = object({
      email: string().required().email(),
      emailConfirm: string().required().equals(ref('email')),
    })

    const result = schema.validate({
      email: 'user@example.com',
      emailConfirm: 'user@example.com',
    })
    expect(result.ok).toBe(true)
  })
})
