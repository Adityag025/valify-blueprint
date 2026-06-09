import { describe, it, expect } from 'vitest'
import { string } from '../../../src/validators/StringValidator.js'
import { ErrorCodes } from '../../../src/errors/ErrorCodes.js'

describe('StringValidator', () => {
  describe('type checking', () => {
    it('passes on a string value', () => {
      expect(string().validate('hello').ok).toBe(true)
    })

    it('fails on a number', () => {
      const r = string().validate(42)
      expect(r.ok).toBe(false)
      expect(r.errors[0].code).toBe(ErrorCodes.ERR_TYPE)
    })

    it('passes undefined when not required', () => {
      expect(string().validate(undefined).ok).toBe(true)
    })

    it('passes null when not required', () => {
      expect(string().validate(null).ok).toBe(true)
    })
  })

  describe('.required()', () => {
    it('fails on undefined', () => {
      const r = string().required().validate(undefined)
      expect(r.ok).toBe(false)
      expect(r.errors[0].code).toBe(ErrorCodes.ERR_REQUIRED)
    })

    it('fails on null', () => {
      expect(string().required().validate(null).ok).toBe(false)
    })

    it('fails on empty string', () => {
      expect(string().required().validate('').ok).toBe(false)
    })

    it('passes on a non-empty string', () => {
      expect(string().required().validate('hello').ok).toBe(true)
    })

    it('uses a custom message', () => {
      const r = string().required('Name is required').validate('')
      expect(r.errors[0].message).toBe('Name is required')
    })
  })

  describe('.min()', () => {
    it('passes when length >= n', () => {
      expect(string().min(3).validate('abc').ok).toBe(true)
    })

    it('fails when length < n', () => {
      const r = string().min(3).validate('ab')
      expect(r.ok).toBe(false)
      expect(r.errors[0].code).toBe(ErrorCodes.ERR_MIN)
    })
  })

  describe('.max()', () => {
    it('passes when length <= n', () => {
      expect(string().max(5).validate('abc').ok).toBe(true)
    })

    it('fails when length > n', () => {
      expect(string().max(3).validate('abcd').ok).toBe(false)
    })
  })

  describe('.length()', () => {
    it('passes on exact length', () => {
      expect(string().length(4).validate('abcd').ok).toBe(true)
    })

    it('fails on wrong length', () => {
      expect(string().length(4).validate('abc').ok).toBe(false)
    })
  })

  describe('.email()', () => {
    const valid = [
      'user@example.com',
      'a+b@c.io',
      'first.last@subdomain.domain.org',
    ]
    // '' without .required() is treated as "no value" and passes — use .required().email() to reject it
    const invalid = ['not-an-email', '@no-local.com', 'no-tld@domain', 'spaces in@email.com']

    it.each(valid)('accepts valid email: %s', (email) => {
      expect(string().email().validate(email).ok).toBe(true)
    })

    it.each(invalid)('rejects invalid email: %s', (email) => {
      expect(string().email().validate(email).ok).toBe(false)
    })
  })

  describe('.url()', () => {
    it('passes for https url', () => {
      expect(string().url().validate('https://example.com').ok).toBe(true)
    })

    it('passes for http url', () => {
      expect(string().url().validate('http://example.com/path').ok).toBe(true)
    })

    it('fails without protocol', () => {
      expect(string().url().validate('example.com').ok).toBe(false)
    })
  })

  describe('.uuid()', () => {
    it('passes for a v4 UUID', () => {
      expect(string().uuid().validate('550e8400-e29b-41d4-a716-446655440000').ok).toBe(true)
    })

    it('fails for an invalid UUID', () => {
      expect(string().uuid().validate('not-a-uuid').ok).toBe(false)
    })
  })

  describe('.regex()', () => {
    it('passes when pattern matches', () => {
      expect(string().regex(/^\d{5}$/).validate('12345').ok).toBe(true)
    })

    it('fails when pattern does not match', () => {
      expect(string().regex(/^\d{5}$/).validate('abcde').ok).toBe(false)
    })

    it('throws for non-RegExp input', () => {
      expect(() => string().regex('not-a-regex')).toThrow()
    })
  })

  describe('.alpha()', () => {
    it('passes for only letters', () => {
      expect(string().alpha().validate('HelloWorld').ok).toBe(true)
    })

    it('fails when digits are present', () => {
      expect(string().alpha().validate('Hello1').ok).toBe(false)
    })
  })

  describe('.alphaNumeric()', () => {
    it('passes for letters and digits', () => {
      expect(string().alphaNumeric().validate('abc123').ok).toBe(true)
    })

    it('fails on special characters', () => {
      expect(string().alphaNumeric().validate('abc!').ok).toBe(false)
    })
  })

  describe('.lowercase() / .uppercase()', () => {
    it('passes on all-lowercase string', () => {
      expect(string().lowercase().validate('hello').ok).toBe(true)
    })

    it('fails mixed-case with lowercase rule', () => {
      expect(string().lowercase().validate('Hello').ok).toBe(false)
    })

    it('passes on all-uppercase string', () => {
      expect(string().uppercase().validate('HELLO').ok).toBe(true)
    })
  })

  describe('.contains()', () => {
    it('passes when substring is present', () => {
      expect(string().contains('foo').validate('foobar').ok).toBe(true)
    })

    it('fails when substring is absent', () => {
      expect(string().contains('foo').validate('barbaz').ok).toBe(false)
    })
  })

  describe('.startsWith() / .endsWith()', () => {
    it('passes when string starts with prefix', () => {
      expect(string().startsWith('http').validate('https://example.com').ok).toBe(true)
    })

    it('passes when string ends with suffix', () => {
      expect(string().endsWith('.js').validate('index.js').ok).toBe(true)
    })
  })

  describe('.oneOf()', () => {
    it('passes when value is in the list', () => {
      expect(string().oneOf(['a', 'b', 'c']).validate('b').ok).toBe(true)
    })

    it('fails when value is not in the list', () => {
      expect(string().oneOf(['a', 'b', 'c']).validate('d').ok).toBe(false)
    })
  })

  describe('.trim()', () => {
    it('trims whitespace before validation', () => {
      expect(string().trim().min(3).validate('  hi  ').ok).toBe(false) // 'hi' is 2 chars
      expect(string().trim().min(2).validate('  hi  ').ok).toBe(true)
    })

    it('returns the trimmed value', () => {
      const r = string().trim().validate('  hello  ')
      expect(r.value).toBe('hello')
    })
  })

  describe('immutability — chaining does not mutate', () => {
    it('base validator is unchanged after adding a rule', () => {
      const base = string().required()
      const extended = base.email()
      expect(base._rules).toHaveLength(1)
      expect(extended._rules).toHaveLength(2)
    })

    it('trim transform is not shared between instances', () => {
      const base = string()
      const trimmed = base.trim()
      expect(base._transforms).toHaveLength(0)
      expect(trimmed._transforms).toHaveLength(1)
    })
  })

  describe('.default()', () => {
    it('returns default value when input is undefined', () => {
      const r = string().default('guest').validate(undefined)
      expect(r.ok).toBe(true)
      expect(r.value).toBe('guest')
    })
  })

  describe('.label()', () => {
    it('uses the label in error messages', () => {
      const r = string().label('Email address').required().validate('')
      expect(r.errors[0].message).toContain('Email address')
    })
  })

  describe('.custom()', () => {
    it('passes when custom function returns true', () => {
      expect(string().custom(() => true).validate('anything').ok).toBe(true)
    })

    it('fails when custom function returns false', () => {
      expect(string().custom(() => false).validate('anything').ok).toBe(false)
    })

    it('uses the returned string as the error message', () => {
      const r = string().custom(() => 'Not strong enough').validate('weak')
      expect(r.errors[0].message).toBe('Not strong enough')
    })
  })

  describe('abortEarly option', () => {
    it('collects all errors when abortEarly is false', () => {
      const validator = string().required().min(10).email()
      const r = validator.validate('x', { abortEarly: false })
      expect(r.errors.length).toBeGreaterThan(1)
    })

    it('returns only the first error when abortEarly is true (default)', () => {
      const validator = string().min(10).email()
      const r = validator.validate('x')
      expect(r.errors).toHaveLength(1)
    })
  })
})
