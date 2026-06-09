import { describe, it, expect } from 'vitest'
import { tuple } from '../../../src/validators/TupleValidator.js'
import { string } from '../../../src/validators/StringValidator.js'
import { number } from '../../../src/validators/NumberValidator.js'
import { boolean } from '../../../src/validators/BooleanValidator.js'
import { object } from '../../../src/validators/ObjectValidator.js'
import { ErrorCodes } from '../../../src/errors/ErrorCodes.js'

describe('tuple() — basic validation', () => {
  const coord = tuple([number(), number()])

  it('accepts a valid [number, number] pair', () => {
    const r = coord.validate([1.5, 42.0])
    expect(r.ok).toBe(true)
    expect(r.value).toEqual([1.5, 42.0])
  })

  it('rejects wrong type at position 0', () => {
    const r = coord.validate(['not-a-number', 42], { abortEarly: false })
    expect(r.ok).toBe(false)
    expect(r.errors[0].code).toBe(ErrorCodes.ERR_TYPE)
  })

  it('rejects wrong type at position 1', () => {
    const r = coord.validate([1, 'not-a-number'])
    expect(r.ok).toBe(false)
  })
})

describe('tuple() — length enforcement', () => {
  const triple = tuple([string(), number(), boolean()])

  it('rejects too few items', () => {
    const r = triple.validate(['a', 1])
    expect(r.ok).toBe(false)
    expect(r.errors[0].code).toBe(ErrorCodes.ERR_TUPLE_LENGTH)
    expect(r.errors[0].message).toMatch(/3/)
  })

  it('rejects too many items', () => {
    const r = triple.validate(['a', 1, true, 'extra'])
    expect(r.ok).toBe(false)
    expect(r.errors[0].code).toBe(ErrorCodes.ERR_TUPLE_LENGTH)
  })

  it('accepts exact-length array', () => {
    expect(triple.validate(['hello', 7, false]).ok).toBe(true)
  })
})

describe('tuple() — nil handling', () => {
  it('passes null when not required', () => {
    expect(tuple([string()]).validate(null).ok).toBe(true)
  })

  it('fails null when required', () => {
    const r = tuple([string()]).required().validate(null)
    expect(r.ok).toBe(false)
    expect(r.errors[0].code).toBe(ErrorCodes.ERR_REQUIRED)
  })

  it('returns default for null', () => {
    const r = tuple([string()]).default(['fallback']).validate(null)
    expect(r.ok).toBe(true)
    expect(r.value).toEqual(['fallback'])
  })

  it('rejects non-array', () => {
    const r = tuple([string()]).validate('not-array')
    expect(r.ok).toBe(false)
    expect(r.errors[0].code).toBe(ErrorCodes.ERR_TYPE)
  })
})

describe('tuple() — error paths', () => {
  it('includes correct path for item error', () => {
    const r = tuple([string(), number()]).validate(['ok', 'wrong-type'], { abortEarly: false })
    expect(r.ok).toBe(false)
    expect(r.errors[0].path).toContain('1')
  })

  it('collects all item errors with abortEarly: false', () => {
    const r = tuple([number(), number(), number()]).validate(
      ['a', 'b', 'c'],
      { abortEarly: false }
    )
    expect(r.ok).toBe(false)
    expect(r.errors).toHaveLength(3)
  })
})

describe('tuple() — with member rules', () => {
  it('applies rules to individual positions', () => {
    const schema = tuple([string().min(3), number().positive()])
    expect(schema.validate(['hi', 5]).ok).toBe(false)   // 'hi' is too short
    expect(schema.validate(['hey', 5]).ok).toBe(true)
    expect(schema.validate(['hey', -1]).ok).toBe(false) // negative
  })
})

describe('tuple() — rest()', () => {
  it('allows extra items validated by rest schema', () => {
    const schema = tuple([string()]).rest(number())
    expect(schema.validate(['label', 1, 2, 3]).ok).toBe(true)
  })

  it('fails if extra items fail rest schema', () => {
    const schema = tuple([string()]).rest(number())
    expect(schema.validate(['label', 'not-a-number']).ok).toBe(false)
  })

  it('still requires minimum items', () => {
    const schema = tuple([string()]).rest(number())
    expect(schema.validate([]).ok).toBe(false) // missing required first item
  })
})

describe('tuple() — inside object', () => {
  it('validates tuple field inside an object schema', () => {
    const schema = object({
      name: string().required(),
      point: tuple([number(), number()]).required(),
    })

    expect(schema.validate({ name: 'P', point: [3, 4] }).ok).toBe(true)
    expect(schema.validate({ name: 'P', point: [3] }).ok).toBe(false)
    expect(schema.validate({ name: 'P', point: null }).ok).toBe(false)
  })
})

describe('tuple() — async', () => {
  it('validates async rules on positional items', async () => {
    const schema = tuple([
      string().customAsync(async (v) => v !== 'bad' || 'Value cannot be "bad"'),
      number(),
    ])
    expect((await schema.validateAsync(['hello', 42])).ok).toBe(true)
    expect((await schema.validateAsync(['bad', 42])).ok).toBe(false)
  })
})
