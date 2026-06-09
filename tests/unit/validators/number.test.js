import { describe, it, expect } from 'vitest'
import { number } from '../../../src/validators/NumberValidator.js'
import { ErrorCodes } from '../../../src/errors/ErrorCodes.js'

describe('NumberValidator', () => {
  describe('type checking', () => {
    it('passes on a number', () => {
      expect(number().validate(42).ok).toBe(true)
    })

    it('fails on a numeric string', () => {
      const r = number().validate('42')
      expect(r.ok).toBe(false)
      expect(r.errors[0].code).toBe(ErrorCodes.ERR_TYPE)
    })

    it('fails on NaN', () => {
      expect(number().validate(NaN).ok).toBe(false)
    })

    it('passes undefined when not required', () => {
      expect(number().validate(undefined).ok).toBe(true)
    })
  })

  describe('.required()', () => {
    it('fails on undefined', () => {
      expect(number().required().validate(undefined).ok).toBe(false)
    })

    it('passes on zero', () => {
      expect(number().required().validate(0).ok).toBe(true)
    })
  })

  describe('.min() / .max()', () => {
    it('passes when value >= min', () => {
      expect(number().min(5).validate(5).ok).toBe(true)
      expect(number().min(5).validate(10).ok).toBe(true)
    })

    it('fails when value < min', () => {
      const r = number().min(5).validate(4)
      expect(r.ok).toBe(false)
      expect(r.errors[0].code).toBe(ErrorCodes.ERR_MIN)
    })

    it('passes when value <= max', () => {
      expect(number().max(10).validate(10).ok).toBe(true)
    })

    it('fails when value > max', () => {
      expect(number().max(10).validate(11).ok).toBe(false)
    })
  })

  describe('.integer()', () => {
    it('passes on an integer', () => {
      expect(number().integer().validate(5).ok).toBe(true)
    })

    it('fails on a float', () => {
      const r = number().integer().validate(5.5)
      expect(r.ok).toBe(false)
      expect(r.errors[0].code).toBe(ErrorCodes.ERR_INTEGER)
    })
  })

  describe('.positive() / .negative() / .nonNegative()', () => {
    it('passes on positive number', () => {
      expect(number().positive().validate(1).ok).toBe(true)
    })

    it('fails on zero for positive', () => {
      expect(number().positive().validate(0).ok).toBe(false)
    })

    it('passes on negative number', () => {
      expect(number().negative().validate(-1).ok).toBe(true)
    })

    it('passes zero for nonNegative', () => {
      expect(number().nonNegative().validate(0).ok).toBe(true)
    })
  })

  describe('.between()', () => {
    it('passes when value is within range', () => {
      expect(number().between(1, 10).validate(5).ok).toBe(true)
    })

    it('passes at boundary values', () => {
      expect(number().between(1, 10).validate(1).ok).toBe(true)
      expect(number().between(1, 10).validate(10).ok).toBe(true)
    })

    it('fails outside range', () => {
      expect(number().between(1, 10).validate(0).ok).toBe(false)
      expect(number().between(1, 10).validate(11).ok).toBe(false)
    })
  })

  describe('.multipleOf()', () => {
    it('passes for multiples', () => {
      expect(number().multipleOf(3).validate(9).ok).toBe(true)
    })

    it('fails for non-multiples', () => {
      expect(number().multipleOf(3).validate(10).ok).toBe(false)
    })
  })

  describe('.finite()', () => {
    it('passes for normal numbers', () => {
      expect(number().finite().validate(42).ok).toBe(true)
    })

    it('fails for Infinity', () => {
      expect(number().finite().validate(Infinity).ok).toBe(false)
    })
  })
})
