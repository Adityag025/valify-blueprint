import { ChangeEvent, FocusEvent, FormEvent } from 'react'
import { ObjectValidator } from '../../types/index.js'

export interface UseValifyOptions {
  abortEarly?: boolean
  locale?: string
  context?: Record<string, unknown>
}

export interface UseValifyReturn<T extends Record<string, unknown>> {
  values: Partial<T>
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => Promise<void>
  handleSubmit: (
    onValid?: (values: T) => void | Promise<void>,
    onInvalid?: (flatErrors: Record<string, string>, rawErrors: unknown[]) => void | Promise<void>
  ) => (e?: FormEvent) => Promise<void>
  validate: (values?: Partial<T>) => Promise<{ ok: boolean; value?: T; errors: unknown[] }>
  reset: (initialValues?: Partial<T>) => void
  setValues: React.Dispatch<React.SetStateAction<Partial<T>>>
}

export function useValify<T extends Record<string, unknown>>(
  schema: ObjectValidator,
  options?: UseValifyOptions
): UseValifyReturn<T>
