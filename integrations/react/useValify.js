import { useState, useCallback, useRef } from 'react'

/**
 * React hook for Valify schema validation.
 *
 * @param {object} schema - A Valify ObjectValidator schema
 * @param {object} [options] - Valify validation options
 * @returns {{ values, errors, touched, handleChange, handleBlur, handleSubmit, validate, reset, isValid }}
 */
export function useValify(schema, options = {}) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const abortRef = useRef(null)

  const flattenErrors = useCallback((validationErrors) => {
    const flat = {}
    for (const err of validationErrors) {
      const key = err.path?.length ? err.path.join('.') : err.field || 'root'
      if (!flat[key]) flat[key] = err.message
    }
    return flat
  }, [])

  const validate = useCallback(
    async (vals = values) => {
      const result = await schema.validateAsync(vals, { ...options, abortEarly: false })
      const flatErrors = result.ok ? {} : flattenErrors(result.errors)
      setErrors(flatErrors)
      return result
    },
    [schema, options, values, flattenErrors]
  )

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }, [])

  const handleBlur = useCallback(
    async (e) => {
      const { name } = e.target
      setTouched((prev) => ({ ...prev, [name]: true }))
      const fieldSchema = schema._shape?.[name]
      if (fieldSchema) {
        const result = fieldSchema.validate(values[name], { ...options, parent: values }, name, [name])
        setErrors((prev) => ({
          ...prev,
          [name]: result.ok ? undefined : result.errors[0]?.message,
        }))
      }
    },
    [schema, options, values]
  )

  const handleSubmit = useCallback(
    (onValid, onInvalid) => async (e) => {
      e?.preventDefault()
      setIsSubmitting(true)

      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const allTouched = schema._shape
        ? Object.keys(schema._shape).reduce((acc, k) => ({ ...acc, [k]: true }), {})
        : {}
      setTouched(allTouched)

      const result = await schema.validateAsync(values, {
        ...options,
        abortEarly: false,
        signal: controller.signal,
      })

      setIsSubmitting(false)

      if (result.ok) {
        setErrors({})
        await onValid?.(result.value)
      } else {
        const flatErrors = flattenErrors(result.errors)
        setErrors(flatErrors)
        await onInvalid?.(flatErrors, result.errors)
      }
    },
    [schema, options, values, flattenErrors]
  )

  const reset = useCallback((initialValues = {}) => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [])

  const isValid = Object.keys(errors).filter((k) => errors[k]).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setValues,
  }
}
