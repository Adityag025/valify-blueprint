import { ref, computed, shallowRef } from 'vue'

/**
 * Vue composable for Valify schema validation.
 *
 * @param {object} schema - A Valify ObjectValidator schema
 * @param {object} [options] - Valify validation options
 */
export function useValify(schema, options = {}) {
  const values = ref({})
  const errors = ref({})
  const touched = ref({})
  const isSubmitting = ref(false)
  const abortController = shallowRef(null)

  const isValid = computed(
    () => Object.keys(errors.value).filter((k) => errors.value[k]).length === 0
  )

  function flattenErrors(validationErrors) {
    const flat = {}
    for (const err of validationErrors) {
      const key = err.path?.length ? err.path.join('.') : err.field || 'root'
      if (!flat[key]) flat[key] = err.message
    }
    return flat
  }

  async function validate(vals = values.value) {
    const result = await schema.validateAsync(vals, { ...options, abortEarly: false })
    errors.value = result.ok ? {} : flattenErrors(result.errors)
    return result
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    values.value = {
      ...values.value,
      [name]: type === 'checkbox' ? checked : value,
    }
  }

  async function handleBlur(e) {
    const { name } = e.target
    touched.value = { ...touched.value, [name]: true }
    const fieldSchema = schema._shape?.[name]
    if (fieldSchema) {
      const result = fieldSchema.validate(
        values.value[name],
        { ...options, parent: values.value },
        name,
        [name]
      )
      errors.value = {
        ...errors.value,
        [name]: result.ok ? undefined : result.errors[0]?.message,
      }
    }
  }

  async function handleSubmit(onValid, onInvalid) {
    return async (e) => {
      e?.preventDefault()
      isSubmitting.value = true

      if (abortController.value) abortController.value.abort()
      const controller = new AbortController()
      abortController.value = controller

      if (schema._shape) {
        touched.value = Object.keys(schema._shape).reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {}
        )
      }

      const result = await schema.validateAsync(values.value, {
        ...options,
        abortEarly: false,
        signal: controller.signal,
      })

      isSubmitting.value = false

      if (result.ok) {
        errors.value = {}
        await onValid?.(result.value)
      } else {
        const flatErrors = flattenErrors(result.errors)
        errors.value = flatErrors
        await onInvalid?.(flatErrors, result.errors)
      }
    }
  }

  function reset(initialValues = {}) {
    values.value = initialValues
    errors.value = {}
    touched.value = {}
    isSubmitting.value = false
  }

  function setFieldValue(name, value) {
    values.value = { ...values.value, [name]: value }
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    validate,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
  }
}
