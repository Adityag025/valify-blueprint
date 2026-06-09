import { describe, it, expect } from 'vitest'
import { string } from '../../../src/validators/StringValidator.js'
import { number } from '../../../src/validators/NumberValidator.js'
import { boolean } from '../../../src/validators/BooleanValidator.js'
import { array } from '../../../src/validators/ArrayValidator.js'

describe('string().coerce()', () => {
  it('converts number to string', () => {
    const s = string().coerce()
    expect(s.validate(42).value).toBe('42')
  })

  it('converts boolean to string', () => {
    const s = string().coerce()
    expect(s.validate(true).value).toBe('true')
  })

  it('leaves string as-is', () => {
    const s = string().coerce()
    expect(s.validate('hello').value).toBe('hello')
  })

  it('passes rules after coercion', () => {
    const s = string().coerce().min(2)
    expect(s.validate(42).ok).toBe(true)
    expect(s.validate(1).ok).toBe(false)
  })

  it('keeps null/undefined as-is (not required)', () => {
    const s = string().coerce()
    expect(s.validate(null).ok).toBe(true)
    expect(s.validate(null).value).toBeUndefined()
  })
})

describe('number().coerce()', () => {
  it('converts string "42" to 42', () => {
    const n = number().coerce()
    expect(n.validate('42').value).toBe(42)
  })

  it('converts string "3.14" to 3.14', () => {
    const n = number().coerce()
    expect(n.validate('3.14').value).toBe(3.14)
  })

  it('leaves a number as-is', () => {
    const n = number().coerce()
    expect(n.validate(7).value).toBe(7)
  })

  it('fails if result is NaN after coercion', () => {
    const n = number().coerce()
    expect(n.validate('abc').ok).toBe(false)
  })

  it('empty string stays empty (not required)', () => {
    const n = number().coerce()
    expect(n.validate('').ok).toBe(true)
  })

  it('passes min/max after coercion', () => {
    const n = number().coerce().min(10)
    expect(n.validate('5').ok).toBe(false)
    expect(n.validate('15').ok).toBe(true)
  })
})

describe('boolean().coerce()', () => {
  it('coerces "true" to true', () => {
    const b = boolean().coerce()
    expect(b.validate('true').value).toBe(true)
  })

  it('coerces "false" to false', () => {
    const b = boolean().coerce()
    expect(b.validate('false').value).toBe(false)
  })

  it('coerces "1" to true', () => {
    const b = boolean().coerce()
    expect(b.validate('1').value).toBe(true)
  })

  it('coerces "0" to false', () => {
    const b = boolean().coerce()
    expect(b.validate('0').value).toBe(false)
  })

  it('coerces numeric 1 to true', () => {
    const b = boolean().coerce()
    expect(b.validate(1).value).toBe(true)
  })

  it('coerces numeric 0 to false', () => {
    const b = boolean().coerce()
    expect(b.validate(0).value).toBe(false)
  })

  it('leaves actual boolean as-is', () => {
    const b = boolean().coerce()
    expect(b.validate(true).value).toBe(true)
    expect(b.validate(false).value).toBe(false)
  })

  it('fails for unrecognized string', () => {
    const b = boolean().coerce()
    expect(b.validate('yes').ok).toBe(false)
  })
})

describe('array().coerce()', () => {
  it('parses JSON array string', () => {
    const a = array()
    const coerced = a.coerce()
    expect(coerced.validate('[1,2,3]').value).toEqual([1, 2, 3])
  })

  it('leaves actual array as-is', () => {
    const a = array().coerce()
    expect(a.validate([1, 2]).value).toEqual([1, 2])
  })

  it('returns string unchanged if not valid JSON', () => {
    const a = array().coerce()
    expect(a.validate('not-json').ok).toBe(false)
  })

  it('validates items after coercion', () => {
    const a = array(number()).coerce()
    expect(a.validate('[1,2,3]').ok).toBe(true)
  })
})
