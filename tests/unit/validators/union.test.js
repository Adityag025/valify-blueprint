import { describe, it, expect } from 'vitest'
import { union } from '../../../src/validators/UnionValidator.js'
import { string } from '../../../src/validators/StringValidator.js'
import { number } from '../../../src/validators/NumberValidator.js'
import { boolean } from '../../../src/validators/BooleanValidator.js'
import { object } from '../../../src/validators/ObjectValidator.js'
import { array } from '../../../src/validators/ArrayValidator.js'
import { ErrorCodes } from '../../../src/errors/ErrorCodes.js'

describe('union() — basic type matching', () => {
  const strOrNum = union([string(), number()])

  it('accepts a string', () => {
    expect(strOrNum.validate('hello').ok).toBe(true)
    expect(strOrNum.validate('hello').value).toBe('hello')
  })

  it('accepts a number', () => {
    expect(strOrNum.validate(42).ok).toBe(true)
    expect(strOrNum.validate(42).value).toBe(42)
  })

  it('rejects a boolean', () => {
    const result = strOrNum.validate(true)
    expect(result.ok).toBe(false)
    expect(result.errors[0].code).toBe(ErrorCodes.ERR_UNION)
    expect(result.errors[0].message).toMatch(/string.*number|number.*string/)
  })

  it('rejects an object', () => {
    expect(strOrNum.validate({}).ok).toBe(false)
  })

  it('attaches branchErrors for diagnostics', () => {
    const result = strOrNum.validate(true)
    expect(result.errors[0].branchErrors).toHaveLength(2)
  })
})

describe('union() — nil handling', () => {
  it('passes null when not required', () => {
    expect(union([string(), number()]).validate(null).ok).toBe(true)
  })

  it('fails null when required', () => {
    const r = union([string(), number()]).required().validate(null)
    expect(r.ok).toBe(false)
    expect(r.errors[0].code).toBe(ErrorCodes.ERR_REQUIRED)
  })

  it('returns default value for null', () => {
    const r = union([string(), number()]).default('fallback').validate(null)
    expect(r.ok).toBe(true)
    expect(r.value).toBe('fallback')
  })
})

describe('union() — with rules on members', () => {
  it('applies member rules — passes valid string email', () => {
    const schema = union([string().email(), number().positive()])
    expect(schema.validate('user@example.com').ok).toBe(true)
  })

  it('applies member rules — passes positive number', () => {
    const schema = union([string().email(), number().positive()])
    expect(schema.validate(5).ok).toBe(true)
  })

  it('fails when all member rules fail', () => {
    const schema = union([string().email(), number().positive()])
    expect(schema.validate('not-email').ok).toBe(false)
    expect(schema.validate(-1).ok).toBe(false)
    expect(schema.validate('not-email').errors[0].code).toBe(ErrorCodes.ERR_UNION)
  })
})

describe('union() — with object schemas (discriminated union)', () => {
  const catSchema = object({ type: string().required(), meow: string().required() })
  const dogSchema = object({ type: string().required(), bark: string().required() })
  const petSchema = union([catSchema, dogSchema])

  it('accepts a cat', () => {
    expect(petSchema.validate({ type: 'cat', meow: 'loud' }).ok).toBe(true)
  })

  it('accepts a dog', () => {
    expect(petSchema.validate({ type: 'dog', bark: 'woof' }).ok).toBe(true)
  })

  it('rejects an object that matches neither', () => {
    expect(petSchema.validate({ type: 'fish', swim: 'fast' }).ok).toBe(false)
  })
})

describe('union() — three-way union', () => {
  const multi = union([string(), number(), boolean()])

  it('accepts string', () => expect(multi.validate('x').ok).toBe(true))
  it('accepts number', () => expect(multi.validate(0).ok).toBe(true))
  it('accepts boolean', () => expect(multi.validate(false).ok).toBe(true))
  it('rejects array', () => expect(multi.validate([]).ok).toBe(false))
})

describe('union() — async', () => {
  it('resolves correct branch asynchronously', async () => {
    const schema = union([
      string().customAsync(async (v) => v.startsWith('ok') || 'Must start with ok'),
      number().positive(),
    ])
    expect((await schema.validateAsync('ok-value')).ok).toBe(true)
    expect((await schema.validateAsync(5)).ok).toBe(true)
    expect((await schema.validateAsync('bad')).ok).toBe(false)
  })
})

describe('union() — inside object with when()', () => {
  it('works as a field validator inside object', () => {
    const schema = object({
      id: union([string().uuid(), number().integer().positive()]),
    })
    expect(schema.validate({ id: 5 }).ok).toBe(true)
    expect(schema.validate({ id: '550e8400-e29b-41d4-a716-446655440000' }).ok).toBe(true)
    expect(schema.validate({ id: 'not-uuid-or-number' }).ok).toBe(false)
  })
})
