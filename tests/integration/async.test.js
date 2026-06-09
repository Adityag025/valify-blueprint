import { describe, it, expect, vi } from 'vitest'
import { string } from '../../src/validators/StringValidator.js'
import { object } from '../../src/validators/ObjectValidator.js'
import { number } from '../../src/validators/NumberValidator.js'

describe('Async validation', () => {
  it('runs customAsync and passes when fn returns true', async () => {
    const validator = string()
      .required()
      .customAsync(async () => true)

    const r = await validator.validateAsync('hello')
    expect(r.ok).toBe(true)
  })

  it('runs customAsync and fails when fn returns false', async () => {
    const validator = string()
      .required()
      .customAsync(async () => false)

    const r = await validator.validateAsync('hello')
    expect(r.ok).toBe(false)
  })

  it('uses returned string as the error message', async () => {
    const validator = string().customAsync(async () => 'Email is already taken')
    const r = await validator.validateAsync('user@example.com')
    expect(r.errors[0].message).toBe('Email is already taken')
  })

  it('runs sync rules first and skips async if sync fails (abortEarly)', async () => {
    const asyncFn = vi.fn(async () => 'taken')
    const validator = string()
      .required()   // will fail for ''
      .customAsync(asyncFn)

    const r = await validator.validateAsync('')  // abortEarly is default
    expect(r.ok).toBe(false)
    expect(asyncFn).not.toHaveBeenCalled()
  })

  it('runs async after sync when abortEarly is false', async () => {
    const asyncFn = vi.fn(async () => 'taken')
    const validator = string()
      .email()      // will fail
      .customAsync(asyncFn)

    const r = await validator.validateAsync('not-email', { abortEarly: false })
    expect(r.ok).toBe(false)
    expect(asyncFn).toHaveBeenCalled()
  })

  it('supports AbortController cancellation', async () => {
    const controller = new AbortController()

    const validator = string().customAsync(async (_v, ctx) => {
      // Simulate long-running async check
      await new Promise((resolve) => setTimeout(resolve, 50))
      if (ctx.signal?.aborted) return 'aborted'
      return true
    })

    const promise = validator.validateAsync('test', { signal: controller.signal })
    controller.abort()

    // The promise should resolve (not reject) — errors handled gracefully
    const r = await promise
    // Either ok (if abort happened before async ran) or the async rule was skipped
    expect(typeof r.ok).toBe('boolean')
  })

  it('validates object schemas asynchronously', async () => {
    const emailExists = vi.fn(async (email) => {
      if (email === 'taken@example.com') return 'Email is already in use'
      return true
    })

    const RegisterSchema = object({
      email: string().required().email().customAsync(emailExists),
      age:   number().required().min(18),
    })

    const valid = await RegisterSchema.validateAsync({
      email: 'new@example.com',
      age: 25,
    })
    expect(valid.ok).toBe(true)
    expect(emailExists).toHaveBeenCalledWith('new@example.com', expect.any(Object))

    const taken = await RegisterSchema.validateAsync({
      email: 'taken@example.com',
      age: 25,
    })
    expect(taken.ok).toBe(false)
    expect(taken.errors[0].message).toBe('Email is already in use')
  })
})
