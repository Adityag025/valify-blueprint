# Valify — Modern JavaScript Validation Library: Complete Blueprint

---

## 1. PROJECT VISION

### Mission Statement
Build the fastest, most ergonomic, and genuinely extensible validation library for JavaScript — one that treats the developer experience as a first-class feature, not an afterthought.

### Target Audience
| Audience | Use Case |
|---|---|
| Frontend devs | Form validation, React/Vue/Svelte forms |
| Backend devs | Request payload validation in Express/Fastify/Hono |
| Full-stack devs | Shared schema across client and server |
| Library authors | Composable validation primitives |
| Enterprise teams | Custom rules, localization, audit trails |

### Primary Use Cases
- HTML form input validation
- REST API request/response validation
- Configuration file validation
- Database write validation
- CLI argument validation
- Type-narrowing at runtime

### Competitor Analysis & Differentiation

| Feature | Valify | Zod | Yup | Joi | Validator.js | Vest |
|---|---|---|---|---|---|---|
| Bundle size (min+gz) | ~5KB | ~14KB | ~40KB | ~25KB (Node only) | ~18KB | ~11KB |
| TypeScript inference | Yes | Yes | Partial | No | No | No |
| Async validation | Yes | Yes | Yes | Yes | No | Yes |
| Plugin system | Yes | No | No | No | No | No |
| i18n built-in | Yes | No | No | Partial | No | No |
| Browser + Node | Yes | Yes | Yes | No | Yes | Yes |
| Fluent API | Yes | No | Yes | Yes | No | Yes |
| Schema composition | Yes | Yes | Yes | Yes | No | Partial |
| Runtime performance | Fastest | Fast | Slow | Medium | Fast | Medium |
| Tree-shakable | Yes | Partial | No | No | No | No |

**How Valify differentiates:**
1. **True tree-shaking** — import only `string()` and pay only for string validators
2. **Plugin-first architecture** — the library is a kernel; everything else is a plugin
3. **First-class i18n** — locale switching at runtime, not at build time
4. **Dual-mode errors** — fail-fast OR collect-all, configured per validator or globally
5. **Cancellable async** — built on `AbortController`, not bolted on
6. **Flat & predictable API** — no `.parse()` vs `.validate()` ambiguity

---

## 2. ARCHITECTURE DESIGN

### Mental Model

```
┌─────────────────────────────────────────────────────────┐
│                     Public API Layer                     │
│          string() / number() / object() / array()        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    Schema Engine                          │
│     Compose, nest, inherit, apply conditional logic      │
└──────┬──────────────────────┬────────────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼──────────┐
│ Rule Engine │    │  Async Rule Engine   │
│ (sync pipe) │    │  (Promise pipeline)  │
└──────┬──────┘    └──────────┬───────────┘
       │                      │
┌──────▼──────────────────────▼───────────┐
│              Error Manager               │
│  (code / message / path / value / rule)  │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│           Localization Engine            │
│    (locale registry, interpolation)      │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│              Plugin Engine               │
│  (middleware, hooks, custom validators)  │
└─────────────────────────────────────────┘
```

### Folder Structure

```
valify/
├── src/
│   ├── core/
│   │   ├── BaseValidator.js       # Abstract base class
│   │   ├── RuleRunner.js          # Sync rule execution pipeline
│   │   ├── AsyncRuleRunner.js     # Async rule execution pipeline
│   │   └── Context.js             # Validation context (value, path, root)
│   ├── validators/
│   │   ├── StringValidator.js
│   │   ├── NumberValidator.js
│   │   ├── BooleanValidator.js
│   │   ├── DateValidator.js
│   │   ├── ArrayValidator.js
│   │   ├── ObjectValidator.js
│   │   └── index.js               # Re-exports all factory functions
│   ├── schema/
│   │   ├── Schema.js              # Schema composition engine
│   │   ├── ObjectSchema.js        # Nested object schemas
│   │   ├── ConditionalSchema.js   # when() / otherwise()
│   │   └── SchemaBuilder.js       # Builder pattern for complex schemas
│   ├── errors/
│   │   ├── ValidationError.js     # Error class
│   │   ├── ErrorCodes.js          # All ERR_* constants
│   │   └── ErrorAggregator.js     # Collect-all-errors mode
│   ├── plugins/
│   │   ├── PluginEngine.js        # Plugin registration and lifecycle
│   │   └── index.js
│   ├── locales/
│   │   ├── LocaleEngine.js        # Runtime locale switching
│   │   ├── en.js
│   │   ├── hi.js
│   │   ├── es.js
│   │   ├── fr.js
│   │   └── de.js
│   ├── utils/
│   │   ├── typeChecks.js          # isString, isNumber, etc.
│   │   ├── interpolate.js         # "{field} is required" → "name is required"
│   │   ├── deepGet.js             # Path traversal for nested errors
│   │   └── memoize.js
│   └── index.js                   # Public entry point
├── types/
│   ├── index.d.ts                 # Master type declarations
│   ├── validators.d.ts
│   ├── schema.d.ts
│   └── plugins.d.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── performance/
│   └── security/
├── docs/
├── examples/
├── .github/
│   └── workflows/
├── package.json
├── rollup.config.js
├── vitest.config.js
├── tsconfig.json
└── CLAUDE.md
```

### Module Dependency Flow

```
index.js
  └── validators/index.js
        ├── StringValidator  ──┐
        ├── NumberValidator  ──┤
        ├── BooleanValidator ──┤──► BaseValidator ──► RuleRunner
        ├── DateValidator    ──┤         │             AsyncRuleRunner
        ├── ArrayValidator   ──┤         │             ErrorAggregator
        └── ObjectValidator  ──┘         │             LocaleEngine
                                         └──► ValidationError ──► ErrorCodes
```

---

## 3. API DESIGN

### Fluent API Design Principles

1. **Factory functions** return validator instances — no `new` keyword exposed
2. **Every method returns `this`** — chainable by default
3. **Terminal methods** are `validate(value)` → sync result, `validateAsync(value)` → Promise
4. **Non-mutating** — each chained call clones the rule list, enabling schema reuse

```js
// Entry points — tree-shakable imports
import { string, number, boolean, date, array, object } from 'valify'

// ─── String ────────────────────────────────────────────────
string()
  .required()
  .min(3)
  .max(50)
  .email()

// ─── Number ────────────────────────────────────────────────
number()
  .required()
  .min(0)
  .max(150)
  .integer()

// ─── Array ─────────────────────────────────────────────────
array(string().email())
  .minItems(1)
  .maxItems(10)
  .unique()

// ─── Object schema ─────────────────────────────────────────
const UserSchema = object({
  name:  string().required().min(2).max(100),
  email: string().required().email(),
  age:   number().required().min(18).max(120).integer(),
  role:  string().oneOf(['admin', 'user', 'guest']).default('user'),
  address: object({
    street: string().required(),
    city:   string().required(),
    zip:    string().regex(/^\d{5}$/)
  }).optional()
})

// ─── Validate synchronously ────────────────────────────────
const result = UserSchema.validate(data)
if (!result.ok) {
  console.log(result.errors)  // ValidationError[]
}

// ─── Validate asynchronously ───────────────────────────────
const result = await UserSchema.validateAsync(data, { abortSignal: controller.signal })
```

### Method Chaining Implementation

```js
// BaseValidator.js — core pattern
class BaseValidator {
  constructor() {
    this._rules = []
    this._label = null
    this._optional = false
    this._default = undefined
    this._abortEarly = true
  }

  _clone() {
    const clone = Object.create(Object.getPrototypeOf(this))
    clone._rules = [...this._rules]
    clone._label = this._label
    clone._optional = this._optional
    clone._default = this._default
    clone._abortEarly = this._abortEarly
    return clone
  }

  addRule(rule) {
    const clone = this._clone()
    clone._rules = [...clone._rules, rule]
    return clone
  }

  optional() {
    const clone = this._clone()
    clone._optional = true
    return clone
  }

  default(value) {
    const clone = this._clone()
    clone._default = value
    return clone
  }

  label(name) {
    const clone = this._clone()
    clone._label = name
    return clone
  }
}
```

---

## 4. CORE VALIDATORS — Full Specifications

### STRING VALIDATORS

```js
string()
  .required(message?)
  .min(n, message?)
  .max(n, message?)
  .length(n, message?)
  .email(message?)
  .url(message?)
  .uuid(message?)
  .regex(pattern, message?)
  .alpha(message?)
  .alphaNumeric(message?)
  .lowercase(message?)
  .uppercase(message?)
  .contains(substring, message?)
  .startsWith(str, message?)
  .endsWith(str, message?)
  .oneOf(arr, message?)
  .trim()
  .custom(fn, code?, message?)
```

**Internal rule shape:**
```js
{
  name: 'min',
  code: 'ERR_MIN',
  params: { n: 3 },
  validate: (value, params) => value.length >= params.n,
  message: (params, field) => `${field} must be at least ${params.n} characters`
}
```

### NUMBER VALIDATORS

```js
number()
  .required(message?)
  .min(n, message?)
  .max(n, message?)
  .integer(message?)
  .float(message?)
  .positive(message?)
  .negative(message?)
  .nonNegative(message?)
  .between(min, max, message?)
  .multipleOf(n, message?)
  .finite(message?)
  .safe(message?)
  .custom(fn)
```

### BOOLEAN VALIDATORS

```js
boolean()
  .required(message?)
  .true(message?)
  .false(message?)
  .equals(bool, message?)
  .custom(fn)
```

### DATE VALIDATORS

```js
date()
  .required(message?)
  .before(date, message?)
  .after(date, message?)
  .future(message?)
  .past(message?)
  .minDate(date, message?)
  .maxDate(date, message?)
  .between(min, max, message?)
  .weekday(message?)
  .custom(fn)
```

### ARRAY VALIDATORS

```js
array(itemSchema?)
  .required(message?)
  .minItems(n, message?)
  .maxItems(n, message?)
  .length(n, message?)
  .unique(message?)
  .contains(value, message?)
  .every(fn, message?)
  .some(fn, message?)
  .noEmpty(message?)
  .compact()
  .custom(fn)
```

### OBJECT VALIDATORS

```js
object(shape?)
  .required(message?)
  .requiredKeys(...keys)
  .optionalKeys(...keys)
  .unknown(bool)
  .strip()
  .exact()
  .custom(fn)
```

---

## 5. SCHEMA SYSTEM

### Core Schema Engine

```js
// src/schema/Schema.js

export class Schema {
  constructor(shape, options = {}) {
    this._shape = shape
    this._options = {
      abortEarly: false,
      stripUnknown: false,
      allowUnknown: true,
      ...options
    }
  }

  validate(data, context = {}) { ... }
  validateAsync(data, context = {}) { ... }

  concat(otherSchema) { ... }

  extend(overrideShape) {
    return new Schema({ ...this._shape, ...overrideShape }, this._options)
  }

  pick(...keys) {
    const subset = keys.reduce((acc, k) => ({ ...acc, [k]: this._shape[k] }), {})
    return new Schema(subset, this._options)
  }

  omit(...keys) {
    const filtered = Object.fromEntries(
      Object.entries(this._shape).filter(([k]) => !keys.includes(k))
    )
    return new Schema(filtered, this._options)
  }
}
```

### Conditional Validation

```js
const PaymentSchema = object({
  method: string().oneOf(['card', 'bank', 'cash']).required(),

  cardNumber: string().when('method', {
    is: 'card',
    then: s => s.required().regex(/^\d{16}$/),
    otherwise: s => s.optional()
  }),

  bankAccount: string().when('method', {
    is: (v) => v === 'bank',
    then: s => s.required(),
    otherwise: s => s.optional()
  }),
})
```

### Cross-Field Validation

```js
const PasswordSchema = object({
  password: string().required().min(8),
  confirmPassword: string()
    .required()
    .equals(ref('password'), 'Passwords must match')
})
```

### Schema Composition Examples

```js
export const AddressSchema = object({
  street:  string().required(),
  city:    string().required(),
  state:   string().length(2).uppercase(),
  zip:     string().regex(/^\d{5}(-\d{4})?$/),
  country: string().default('US')
})

export const UserSchema = object({
  id:        string().uuid().required(),
  name:      string().required().min(2).max(100),
  email:     string().required().email(),
  age:       number().integer().min(0).max(150),
  address:   AddressSchema.optional(),
  tags:      array(string()).maxItems(20).unique(),
  createdAt: date().past().required()
})

export const AdminSchema = UserSchema.extend({
  permissions: array(string().oneOf(['read', 'write', 'delete'])).required(),
  superAdmin:  boolean().default(false)
})
```

---

## 6. ERROR HANDLING SYSTEM

### ValidationError Class

```js
// src/errors/ValidationError.js

export class ValidationError extends Error {
  constructor({ field, code, message, value, rule, path = [] }) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.code = code
    this.message = message
    this.value = value
    this.rule = rule
    this.path = path
  }

  toJSON() {
    return {
      field: this.field,
      code: this.code,
      message: this.message,
      value: this.value,
      rule: this.rule,
      path: this.path
    }
  }
}
```

### Error Codes

```js
// src/errors/ErrorCodes.js

export const ErrorCodes = {
  ERR_TYPE:            'ERR_TYPE',
  ERR_REQUIRED:        'ERR_REQUIRED',
  ERR_MIN:             'ERR_MIN',
  ERR_MAX:             'ERR_MAX',
  ERR_LENGTH:          'ERR_LENGTH',
  ERR_EMAIL:           'ERR_EMAIL',
  ERR_URL:             'ERR_URL',
  ERR_UUID:            'ERR_UUID',
  ERR_REGEX:           'ERR_REGEX',
  ERR_ALPHA:           'ERR_ALPHA',
  ERR_ALPHA_NUMERIC:   'ERR_ALPHA_NUMERIC',
  ERR_LOWERCASE:       'ERR_LOWERCASE',
  ERR_UPPERCASE:       'ERR_UPPERCASE',
  ERR_CONTAINS:        'ERR_CONTAINS',
  ERR_STARTS_WITH:     'ERR_STARTS_WITH',
  ERR_ENDS_WITH:       'ERR_ENDS_WITH',
  ERR_ONE_OF:          'ERR_ONE_OF',
  ERR_INTEGER:         'ERR_INTEGER',
  ERR_FLOAT:           'ERR_FLOAT',
  ERR_POSITIVE:        'ERR_POSITIVE',
  ERR_NEGATIVE:        'ERR_NEGATIVE',
  ERR_MULTIPLE_OF:     'ERR_MULTIPLE_OF',
  ERR_FINITE:          'ERR_FINITE',
  ERR_MIN_ITEMS:       'ERR_MIN_ITEMS',
  ERR_MAX_ITEMS:       'ERR_MAX_ITEMS',
  ERR_UNIQUE:          'ERR_UNIQUE',
  ERR_UNKNOWN_KEY:     'ERR_UNKNOWN_KEY',
  ERR_REQUIRED_KEY:    'ERR_REQUIRED_KEY',
  ERR_BEFORE:          'ERR_BEFORE',
  ERR_AFTER:           'ERR_AFTER',
  ERR_FUTURE:          'ERR_FUTURE',
  ERR_PAST:            'ERR_PAST',
  ERR_CUSTOM:          'ERR_CUSTOM',
}
```

### Error Result Shape

```js
// validate() always returns a Result object — never throws
{
  ok: false,
  value: undefined,
  errors: [
    {
      field:   'email',
      code:    'ERR_EMAIL',
      message: 'Must be a valid email address',
      value:   'john@',
      rule:    'email',
      path:    ['user', 'email']
    },
    {
      field:   'age',
      code:    'ERR_MIN',
      message: 'Age must be at least 18',
      value:   12,
      rule:    'min',
      path:    ['user', 'age']
    }
  ]
}

// On success
{
  ok: true,
  value: { /* coerced/transformed input */ },
  errors: []
}
```

### ErrorAggregator

```js
// src/errors/ErrorAggregator.js

export class ErrorAggregator {
  constructor() {
    this._errors = []
  }

  add(error) {
    this._errors.push(error)
  }

  addAll(errors) {
    this._errors.push(...errors)
  }

  hasErrors() {
    return this._errors.length > 0
  }

  byField() {
    return this._errors.reduce((acc, err) => {
      const key = err.path.join('.')
      acc[key] = acc[key] || []
      acc[key].push(err)
      return acc
    }, {})
  }

  toResult(value) {
    return {
      ok: !this.hasErrors(),
      value: this.hasErrors() ? undefined : value,
      errors: [...this._errors]
    }
  }
}
```

---

## 7. ASYNC VALIDATION

### AsyncRuleRunner Design

```js
// src/core/AsyncRuleRunner.js

export class AsyncRuleRunner {
  async runSequential(rules, value, context) {
    const errors = []
    for (const rule of rules) {
      if (context.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const result = await rule.validate(value, rule.params, context)
      if (result !== true) {
        errors.push(buildError(rule, value, result, context))
        if (context.abortEarly) break
      }
    }
    return errors
  }

  async runParallel(rules, value, context) {
    const settled = await Promise.allSettled(
      rules.map(rule => {
        if (context.signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))
        return rule.validate(value, rule.params, context).then(result => ({ rule, result }))
      })
    )
    return settled
      .filter(s => s.status === 'fulfilled' && s.value.result !== true)
      .map(s => buildError(s.value.rule, value, s.value.result, context))
  }
}
```

### Async Validator Examples

```js
// Email uniqueness
const emailValidator = string()
  .required()
  .email()
  .customAsync(async (value, context) => {
    const exists = await db.users.exists({ email: value })
    return exists ? 'This email is already registered' : true
  }, 'ERR_EMAIL_TAKEN')

// With cancellation
const controller = new AbortController()
const result = await UserSchema.validateAsync(formData, {
  signal: controller.signal,
  abortEarly: false
})

// Cancel in-flight validation
controller.abort()
```

### Async Validation Flow

```
validateAsync(data)
       │
       ▼
 Type coercion (sync)
       │
       ▼
 Sync rules run first (fast rejection)
       │
  No sync errors?
    YES  │   NO → return errors immediately (if abortEarly)
         ▼
 Async rules run (sequential or parallel, configurable)
         │
         ▼
 Aggregate errors → return Result
```

---

## 8. CUSTOM VALIDATORS

### Global Rule Registration

```js
import { addRule } from 'valify'

addRule('isPrime', {
  code: 'ERR_PRIME',
  validate: (value) => {
    if (value < 2) return false
    for (let i = 2; i <= Math.sqrt(value); i++) {
      if (value % i === 0) return false
    }
    return true
  },
  message: ({ field }) => `${field} must be a prime number`
})

// Usage
number().isPrime()
```

### Instance-Level Custom Rules

```js
string()
  .custom((value, context) => {
    // return true  → pass
    // return string → fail with that message
    // return false → fail with default message
    const hasUpper = /[A-Z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSpecial = /[!@#$%^&*]/.test(value)
    if (!hasUpper || !hasNumber || !hasSpecial) {
      return 'Password must contain uppercase, number, and special character'
    }
    return true
  }, 'ERR_WEAK_PASSWORD')
```

### Namespaced Plugin Rules

```js
import { createPlugin } from 'valify'

export const creditCardPlugin = createPlugin({
  name: 'credit-card',
  rules: {
    creditCard: {
      code: 'ERR_CREDIT_CARD',
      validate: (value) => luhnCheck(value),
      message: () => 'Must be a valid credit card number'
    },
    cvv: {
      code: 'ERR_CVV',
      validate: (value) => /^\d{3,4}$/.test(value),
      message: () => 'Must be a valid CVV'
    }
  }
})

// After plugin registration:
string().creditCard()
string().cvv()
```

---

## 9. PLUGIN SYSTEM

### Plugin Engine

```js
// src/plugins/PluginEngine.js

export class PluginEngine {
  constructor() {
    this._plugins = new Map()
    this._hooks = {
      beforeValidate: [],
      afterValidate: [],
      onError: [],
    }
  }

  use(plugin) {
    if (this._plugins.has(plugin.name)) {
      console.warn(`[Valify] Plugin "${plugin.name}" already registered`)
      return this
    }

    if (plugin.rules) {
      for (const [name, rule] of Object.entries(plugin.rules)) {
        this._installRule(name, rule)
      }
    }

    if (plugin.locales) {
      for (const [locale, messages] of Object.entries(plugin.locales)) {
        localeEngine.extend(locale, messages)
      }
    }

    if (plugin.hooks) {
      for (const [hook, fn] of Object.entries(plugin.hooks)) {
        this._hooks[hook]?.push(fn)
      }
    }

    plugin.install?.({ addRule, addLocale, addHook })
    this._plugins.set(plugin.name, plugin)
    return this
  }
}
```

### Plugin Shape Examples

```js
export const analyticsPlugin = {
  name: 'analytics',
  install({ addHook }) {
    addHook('afterValidate', ({ field, ok, duration }) => {
      analytics.track('validation', { field, ok, duration })
    })
  }
}

export const loggingPlugin = {
  name: 'logging',
  hooks: {
    beforeValidate: ({ field, value }) => console.debug(`[validate] ${field}`, value),
    onError: (error) => logger.warn('[validation-error]', error.toJSON())
  }
}

// Usage
import valify from 'valify'
valify.use(analyticsPlugin)
valify.use(loggingPlugin)
```

---

## 10. LOCALIZATION (I18N)

### Locale Engine

```js
// src/locales/LocaleEngine.js

class LocaleEngine {
  constructor() {
    this._locale = 'en'
    this._locales = {}
    this._fallback = 'en'
  }

  register(locale, messages) {
    this._locales[locale] = { ...this._locales[locale], ...messages }
    return this
  }

  setLocale(locale) {
    if (!this._locales[locale]) throw new Error(`Locale "${locale}" not registered`)
    this._locale = locale
    return this
  }

  extend(locale, messages) {
    this._locales[locale] = { ...(this._locales[locale] || {}), ...messages }
  }

  getMessage(code, params = {}) {
    const messages = this._locales[this._locale] || this._locales[this._fallback]
    const template = messages[code] || this._locales[this._fallback][code] || code
    return interpolate(template, params)
  }
}

export const localeEngine = new LocaleEngine()
```

### Locale Message Files

```js
// src/locales/en.js
export default {
  ERR_REQUIRED:     '{field} is required',
  ERR_MIN:          '{field} must be at least {min} characters',
  ERR_MAX:          '{field} must be at most {max} characters',
  ERR_EMAIL:        '{field} must be a valid email address',
  ERR_URL:          '{field} must be a valid URL',
  ERR_INTEGER:      '{field} must be a whole number',
  ERR_MIN_ITEMS:    '{field} must have at least {min} items',
  ERR_MAX_ITEMS:    '{field} must have at most {max} items',
  ERR_UNIQUE:       '{field} must contain unique values',
}

// src/locales/hi.js
export default {
  ERR_REQUIRED:     '{field} आवश्यक है',
  ERR_MIN:          '{field} कम से कम {min} अक्षर का होना चाहिए',
  ERR_MAX:          '{field} अधिकतम {max} अक्षर का होना चाहिए',
  ERR_EMAIL:        '{field} एक वैध ईमेल पता होना चाहिए',
}

// src/locales/es.js
export default {
  ERR_REQUIRED:     '{field} es obligatorio',
  ERR_MIN:          '{field} debe tener al menos {min} caracteres',
  ERR_EMAIL:        '{field} debe ser un correo electrónico válido',
}
```

### Runtime Locale Switching

```js
import { setLocale, registerLocale } from 'valify'
import hiLocale from 'valify/locales/hi'

registerLocale('hi', hiLocale)
setLocale('hi')

const result = string().required().validate('')
// result.errors[0].message === 'यह फ़ील्ड आवश्यक है'

// Per-validation override
const result = schema.validate(data, { locale: 'es' })
```

---

## 11. TYPESCRIPT SUPPORT

### Type Architecture

```typescript
// types/index.d.ts

export type ValidationResult<T> =
  | { ok: true; value: T; errors: [] }
  | { ok: false; value: undefined; errors: ValidationErrorJSON[] }

export interface ValidationErrorJSON {
  field: string
  code: string
  message: string
  value: unknown
  rule: string
  path: string[]
}

export interface ValidateOptions {
  abortEarly?: boolean
  locale?: string
  signal?: AbortSignal
  context?: Record<string, unknown>
}

export type Infer<T extends AnyValidator> = T['_output']

export interface BaseValidator<TInput, TOutput = TInput> {
  readonly _input: TInput
  readonly _output: TOutput

  optional(): BaseValidator<TInput | undefined, TOutput | undefined>
  default<D extends TOutput>(value: D): BaseValidator<TInput | undefined, TOutput>
  label(name: string): this
  validate(value: unknown, options?: ValidateOptions): ValidationResult<TOutput>
  validateAsync(value: unknown, options?: ValidateOptions): Promise<ValidationResult<TOutput>>
}

export interface StringValidator extends BaseValidator<string> {
  required(message?: string): this
  min(n: number, message?: string): this
  max(n: number, message?: string): this
  length(n: number, message?: string): this
  email(message?: string): this
  url(message?: string): this
  uuid(message?: string): this
  regex(pattern: RegExp, message?: string): this
  alpha(message?: string): this
  alphaNumeric(message?: string): this
  lowercase(message?: string): this
  uppercase(message?: string): this
  contains(substring: string, message?: string): this
  startsWith(prefix: string, message?: string): this
  endsWith(suffix: string, message?: string): this
  oneOf<T extends readonly string[]>(values: T, message?: string): BaseValidator<string, T[number]>
  trim(): this
  custom(fn: CustomValidatorFn, code?: string, message?: string): this
  customAsync(fn: AsyncCustomValidatorFn, code?: string): this
}
```

### Schema-to-Type Inference

```typescript
import { object, string, number, boolean, array, Infer } from 'valify'

const UserSchema = object({
  id:    string().uuid().required(),
  name:  string().required().min(2),
  email: string().required().email(),
  age:   number().integer().min(18),
  role:  string().oneOf(['admin', 'user'] as const),
  tags:  array(string()).optional(),
  active: boolean().default(true)
})

// Automatically inferred — no manual interface needed
type User = Infer<typeof UserSchema>
// type User = {
//   id: string
//   name: string
//   email: string
//   age: number
//   role: 'admin' | 'user'
//   tags?: string[]
//   active: boolean
// }

const result = UserSchema.validate(data)
if (result.ok) {
  const user: User = result.value  // fully typed, no cast needed
}
```

---

## 12. PERFORMANCE OPTIMIZATION

### Key Strategies

**1. Lazy Rule Compilation**
```js
class BaseValidator {
  _compile() {
    if (this._compiled) return this._compiled
    this._compiled = this._rules.map(rule => ({
      ...rule,
      check: (value) => rule.validate(value, rule.params)
    }))
    return this._compiled
  }
}
```

**2. Type Guard Fast-Path**
```js
validate(value) {
  if (value == null) {
    return this._optional
      ? { ok: true, value: this._default }
      : this._buildRequiredError(value)
  }
  if (typeof value !== this._expectedType) {
    return this._buildTypeError(value)
  }
  return this._runRules(value)
}
```

**3. Tree Shaking via Pure ESM**
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js",
      "types": "./types/index.d.ts"
    },
    "./string": {
      "import": "./dist/validators/string.esm.js",
      "require": "./dist/validators/string.cjs.js"
    }
  },
  "sideEffects": false
}
```

### Expected Bundle Sizes

| Import | Size (min+gz) |
|---|---|
| `import { string } from 'valify'` | ~1.8 KB |
| `import { string, number, object } from 'valify'` | ~3.5 KB |
| Full library | ~5.2 KB |
| With all locales | ~8.1 KB |

### Benchmark Strategy

```js
// tests/performance/bench.js
import { bench, describe } from 'vitest'
import { string as valifyString } from 'valify'
import { z } from 'zod'
import * as yup from 'yup'

const data = { email: 'user@example.com' }

describe('email validation', () => {
  bench('valify', () => {
    valifyString().email().validate(data.email)
  })
  bench('zod', () => {
    z.string().email().safeParse(data.email)
  })
  bench('yup', async () => {
    await yup.string().email().isValid(data.email)
  })
})
```

---

## 13. SECURITY CONSIDERATIONS

### Prototype Pollution Prevention

```js
// src/utils/typeChecks.js

export const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key)

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function safeKeys(obj) {
  return Object.keys(obj).filter(k => !BLOCKED_KEYS.has(k))
}

export function createSafeMap() {
  return Object.create(null)
}
```

### ReDoS Prevention

```js
// src/utils/safeRegex.js

export const PATTERNS = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
}

const MAX_REGEX_LENGTH = 500

export function validateUserRegex(pattern) {
  if (pattern.source.length > MAX_REGEX_LENGTH) {
    throw new Error(`Regex too long (max ${MAX_REGEX_LENGTH} chars)`)
  }
}
```

### Deep Recursion & Circular Reference Protection

```js
// src/core/Context.js

class ValidationContext {
  constructor(options = {}) {
    this.depth = 0
    this.maxDepth = options.maxDepth ?? 50
    this.seen = new WeakSet()
  }

  enter(value) {
    if (this.depth >= this.maxDepth) {
      throw new Error(`[Valify] Maximum validation depth (${this.maxDepth}) exceeded`)
    }
    if (typeof value === 'object' && value !== null) {
      if (this.seen.has(value)) {
        throw new Error('[Valify] Circular reference detected in value')
      }
      this.seen.add(value)
    }
    this.depth++
  }

  exit(value) {
    if (typeof value === 'object' && value !== null) {
      this.seen.delete(value)
    }
    this.depth--
  }
}
```

### DoS Prevention

```js
const LIMITS = {
  maxArrayLength:  10_000,
  maxObjectKeys:   1_000,
  maxStringLength: 1_000_000,
  maxNestingDepth: 50
}

valify.configure({ maxArrayLength: 100 })
```

---

## 14. TESTING STRATEGY

### Test Organization

```
tests/
├── unit/
│   ├── validators/
│   │   ├── string.test.js
│   │   ├── number.test.js
│   │   ├── boolean.test.js
│   │   ├── date.test.js
│   │   ├── array.test.js
│   │   └── object.test.js
│   ├── core/
│   │   ├── BaseValidator.test.js
│   │   ├── RuleRunner.test.js
│   │   └── AsyncRuleRunner.test.js
│   ├── errors/
│   │   ├── ValidationError.test.js
│   │   └── ErrorAggregator.test.js
│   ├── locales/
│   │   └── LocaleEngine.test.js
│   └── plugins/
│       └── PluginEngine.test.js
├── integration/
│   ├── schema-composition.test.js
│   ├── async-validation.test.js
│   ├── cross-field-validation.test.js
│   ├── plugin-integration.test.js
│   └── real-world-forms.test.js
├── performance/
│   ├── bench.js
│   └── bundle-size.test.js
└── security/
    ├── prototype-pollution.test.js
    ├── redos.test.js
    ├── deep-recursion.test.js
    └── circular-reference.test.js
```

### Unit Test Pattern

```js
// tests/unit/validators/string.test.js

import { describe, it, expect } from 'vitest'
import { string } from '../../src'

describe('StringValidator', () => {
  describe('.required()', () => {
    it('fails on empty string', () => {
      const result = string().required().validate('')
      expect(result.ok).toBe(false)
      expect(result.errors[0].code).toBe('ERR_REQUIRED')
    })

    it('passes on non-empty string', () => {
      expect(string().required().validate('hello').ok).toBe(true)
    })
  })

  describe('.email()', () => {
    const valid = ['user@example.com', 'a+b@c.io', 'test.name@domain.org']
    const invalid = ['not-an-email', '@no-local.com', 'no-tld@', '']

    it.each(valid)('accepts %s', (email) => {
      expect(string().email().validate(email).ok).toBe(true)
    })

    it.each(invalid)('rejects %s', (email) => {
      expect(string().email().validate(email).ok).toBe(false)
    })
  })

  describe('immutability', () => {
    it('chaining does not mutate base validator', () => {
      const base = string().required()
      const extended = base.email()
      expect(base._rules).toHaveLength(1)
      expect(extended._rules).toHaveLength(2)
    })
  })
})
```

### Security Test Pattern

```js
// tests/security/prototype-pollution.test.js

import { describe, it, expect } from 'vitest'
import { object, string } from '../../src'

describe('Prototype pollution prevention', () => {
  it('rejects __proto__ key in object schemas', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}}')
    object({ name: string() }).validate(malicious)
    expect({}.polluted).toBeUndefined()
  })

  it('rejects constructor key', () => {
    const malicious = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}')
    object({}).validate(malicious)
    expect({}.polluted).toBeUndefined()
  })
})
```

### Vitest Configuration

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95
      }
    }
  }
})
```

---

## 15. DOCUMENTATION PLAN

### Docs Structure

```
docs/
├── index.md
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── concepts.md
├── guides/
│   ├── form-validation.md
│   ├── api-validation.md
│   ├── async-validation.md
│   ├── custom-validators.md
│   ├── plugins.md
│   ├── localization.md
│   └── typescript.md
├── api/
│   ├── string.md
│   ├── number.md
│   ├── boolean.md
│   ├── date.md
│   ├── array.md
│   ├── object.md
│   ├── schema.md
│   └── errors.md
├── examples/
│   ├── registration-form.md
│   ├── payment-form.md
│   ├── api-request.md
│   └── configuration-file.md
├── faq.md
└── migration/
    ├── from-yup.md
    ├── from-zod.md
    └── from-joi.md
```

### Documentation Roadmap

| Quarter | Deliverable |
|---|---|
| Q1 | README, API reference (auto-generated from JSDoc) |
| Q2 | VitePress site, getting-started guide, 5 examples |
| Q3 | Video tutorials, framework integration guides |
| Q4 | Migration guides from Yup/Zod/Joi, community cookbook |

---

## 16. CI/CD PIPELINE

### GitHub Actions — CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ matrix.node }}', cache: 'npm' }
      - run: npm ci
      - run: npm test
      - uses: codecov/codecov-action@v4
        if: matrix.node == '20'
        with: { token: '${{ secrets.CODECOV_TOKEN }}' }

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
```

### GitHub Actions — Release

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Publish to npm
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}'
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body_path: CHANGELOG.md
```

### Package Scripts

```json
{
  "scripts": {
    "build":          "rollup -c",
    "build:types":    "tsc --emitDeclarationOnly",
    "test":           "vitest run --coverage",
    "test:watch":     "vitest",
    "test:bench":     "vitest bench",
    "lint":           "eslint src tests --ext .js",
    "lint:fix":       "eslint src tests --ext .js --fix",
    "typecheck":      "tsc --noEmit",
    "size":           "size-limit",
    "prepublishOnly": "npm run lint && npm test && npm run build && npm run build:types"
  },
  "size-limit": [
    { "path": "dist/index.esm.js", "limit": "6 KB" }
  ]
}
```

---

## 17. OPEN SOURCE STRATEGY

**License:** MIT — widest adoption, compatible with commercial projects.

### Commit Convention (Conventional Commits)

```
feat: add isPrime custom validator
fix: handle null in StringValidator.email()
docs: add React integration example
chore: bump rollup to 4.x
test: add security tests for prototype pollution
```

### Versioning Strategy

```
MAJOR.MINOR.PATCH — Semantic Versioning

MAJOR: Breaking API change
MINOR: New feature, backwards-compatible
PATCH: Bug fix, backwards-compatible

Pre-release: 1.0.0-alpha.1, 1.0.0-beta.1, 1.0.0-rc.1
```

### Release Process

```
1. Merge PRs to develop
2. develop → main via Release PR (automated changelog)
3. Tag: git tag v1.2.0
4. GitHub Actions publishes to npm automatically
5. GitHub Release created with changelog
```

### Open Source Roadmap

| Milestone | Action |
|---|---|
| v0.1.0 | Publish to npm, open GitHub repo |
| v0.5.0 | Write CONTRIBUTING.md, issue templates |
| v1.0.0 | Announce on dev.to / Reddit / HN |
| v1.1.0 | Set up OpenCollective for sustainability |
| v2.0.0 | Governance model, maintainer team |

---

## 18. ROADMAP

### Phase 1 — MVP (Weeks 1–6) → v0.1.0

| Feature | Effort | Risk |
|---|---|---|
| BaseValidator + RuleRunner | 3 days | Low |
| StringValidator (all rules) | 4 days | Low |
| NumberValidator (all rules) | 2 days | Low |
| BooleanValidator | 1 day | Low |
| DateValidator | 2 days | Medium |
| ArrayValidator | 3 days | Low |
| ObjectValidator + nested schemas | 4 days | Medium |
| ValidationError + ErrorCodes | 1 day | Low |
| English locale | 1 day | Low |
| Unit tests (95% coverage) | 5 days | Low |
| Rollup build (ESM + CJS) | 1 day | Low |
| TypeScript declarations | 3 days | Medium |
| Basic docs (README + API) | 2 days | Low |

### Phase 2 — Production Ready (Weeks 7–12) → v1.0.0

| Feature | Effort | Risk |
|---|---|---|
| AsyncRuleRunner + validateAsync() | 3 days | Medium |
| AbortController support | 2 days | Low |
| when() conditional validation | 3 days | Medium |
| ref() cross-field validation | 2 days | Medium |
| Plugin engine | 4 days | Medium |
| i18n engine + 5 locales | 4 days | Low |
| Full TypeScript inference | 5 days | High |
| Schema .extend() .pick() .omit() | 2 days | Low |
| Security hardening | 3 days | Medium |
| Integration tests | 3 days | Low |
| Performance benchmarks | 2 days | Low |
| Full documentation site (VitePress) | 5 days | Low |
| CI/CD pipeline | 2 days | Low |

### Phase 3 — Plugin Ecosystem (Weeks 13–20) → v1.x

| Feature | Effort | Risk |
|---|---|---|
| valify-credit-card plugin | 3 days | Low |
| valify-phone-number plugin | 3 days | Medium |
| valify-password-strength plugin | 2 days | Low |
| React hook: useValify | 3 days | Low |
| Vue composable: useValify | 3 days | Low |
| Express middleware | 2 days | Low |
| Fastify plugin | 2 days | Low |
| More locales (20+) | 3 days | Low |

### Phase 4 — Enterprise Features (Weeks 21–30) → v2.0.0

| Feature | Effort | Risk |
|---|---|---|
| JSON Schema import/export | 5 days | High |
| OpenAPI schema integration | 5 days | High |
| Audit log middleware | 3 days | Low |
| Schema versioning | 4 days | High |
| Visual schema builder (web) | 10 days | High |
| Performance: WASM hot path | 7 days | Very High |

---

## 19. FILE-BY-FILE IMPLEMENTATION PLAN

### Core Files

| File | Responsibility | Key Exports | Dependencies |
|---|---|---|---|
| `src/core/BaseValidator.js` | Abstract base for all validators | `BaseValidator` | RuleRunner, AsyncRuleRunner, ErrorAggregator, LocaleEngine |
| `src/core/RuleRunner.js` | Execute sync rule array | `RuleRunner` | ValidationError, ErrorCodes |
| `src/core/AsyncRuleRunner.js` | Execute async rule array | `AsyncRuleRunner` | RuleRunner, ValidationError |
| `src/core/Context.js` | Validation context, depth, abort signal | `ValidationContext` | (none) |

### Validator Files

| File | Responsibility | Key Exports | Dependencies |
|---|---|---|---|
| `src/validators/StringValidator.js` | All string rules | `StringValidator`, `string()` | BaseValidator, ErrorCodes, PATTERNS |
| `src/validators/NumberValidator.js` | All number rules | `NumberValidator`, `number()` | BaseValidator, ErrorCodes |
| `src/validators/BooleanValidator.js` | Boolean rules | `BooleanValidator`, `boolean()` | BaseValidator, ErrorCodes |
| `src/validators/DateValidator.js` | Date rules | `DateValidator`, `date()` | BaseValidator, ErrorCodes |
| `src/validators/ArrayValidator.js` | Array rules + per-item schema | `ArrayValidator`, `array()` | BaseValidator, ErrorCodes |
| `src/validators/ObjectValidator.js` | Object shape validation | `ObjectValidator`, `object()` | BaseValidator, ErrorCodes, Context |
| `src/validators/index.js` | Re-export all factories | `string, number, boolean, date, array, object, ref` | All validators |

### Schema Files

| File | Responsibility | Key Exports |
|---|---|---|
| `src/schema/Schema.js` | Schema composition (extend, pick, omit) | `Schema` |
| `src/schema/ConditionalSchema.js` | when() / otherwise() | `when()`, `ConditionalRule` |
| `src/schema/ref.js` | Cross-field references | `ref()`, `Ref` |

### Error Files

| File | Responsibility | Key Exports |
|---|---|---|
| `src/errors/ValidationError.js` | Error class with serializable shape | `ValidationError` |
| `src/errors/ErrorCodes.js` | All ERR_* string constants | `ErrorCodes` |
| `src/errors/ErrorAggregator.js` | Collect errors, group by field path | `ErrorAggregator` |

### Plugin Files

| File | Responsibility | Key Exports |
|---|---|---|
| `src/plugins/PluginEngine.js` | Plugin registration, hook system | `PluginEngine`, `createPlugin()` |
| `src/plugins/index.js` | Singleton plugin engine | `use()`, `createPlugin()` |

### Locale Files

| File | Responsibility |
|---|---|
| `src/locales/LocaleEngine.js` | Registry, runtime switching, resolution |
| `src/locales/en.js` | English messages |
| `src/locales/hi.js` | Hindi messages |
| `src/locales/es.js` | Spanish messages |
| `src/locales/fr.js` | French messages |
| `src/locales/de.js` | German messages |

### Utility Files

| File | Responsibility | Key Exports |
|---|---|---|
| `src/utils/typeChecks.js` | isString, isNumber, isDate, isNil, hasOwn, safeKeys | All type guards |
| `src/utils/interpolate.js` | Template string interpolation | `interpolate()` |
| `src/utils/safeRegex.js` | Safe built-in patterns, user regex validation | `PATTERNS`, `validateUserRegex()` |
| `src/utils/deepGet.js` | Path-based value traversal | `deepGet()`, `deepSet()` |
| `src/utils/memoize.js` | WeakMap-based memoization | `memoize()` |

### Entry Point

```
src/index.js — Public API surface

Exports:
  string, number, boolean, date, array, object  (validators)
  ref                                            (cross-field reference)
  use, createPlugin                              (plugin system)
  setLocale, registerLocale                      (i18n)
  addRule                                        (global custom rules)
  ValidationError, ErrorCodes                    (error classes)
  configure                                      (global config)
```

---

## 20. FINAL OUTPUT SUMMARY

### Complete Architecture

```
User code
    │
    ▼  import { string, object } from 'valify'
Public API (tree-shakable ESM)
    │
    ▼
Validator instances (immutable rule chains)
    │
    ├──sync──►  RuleRunner ──► ErrorAggregator ──► Result
    │
    └──async──► AsyncRuleRunner (sequential | parallel)
                    │
                    ▼
               AbortController integration
                    │
                    ▼
               ErrorAggregator ──► Result
                         │
                         ▼
                  LocaleEngine (message resolution)
                         │
                         ▼
                  PluginEngine hooks (onError, afterValidate)
```

### API Specification (Summary)

| Method | Returns | Notes |
|---|---|---|
| `string()` | StringValidator | factory |
| `number()` | NumberValidator | factory |
| `boolean()` | BooleanValidator | factory |
| `date()` | DateValidator | factory |
| `array(schema?)` | ArrayValidator | factory |
| `object(shape)` | ObjectValidator | factory |
| `.validate(value, opts?)` | `{ok, value, errors}` | sync, never throws |
| `.validateAsync(value, opts?)` | `Promise<{ok, value, errors}>` | cancellable |
| `use(plugin)` | void | global plugin registration |
| `setLocale(code)` | void | runtime locale switch |
| `addRule(name, spec)` | void | global custom rule |
| `configure(opts)` | void | global defaults |

### Future Enhancement Ideas

1. **WASM hot path** — compile frequently-used regex and type checks to WebAssembly for 2–5× throughput
2. **Code generation** — `valify codegen schema.ts` generates runtime validators from TypeScript interfaces
3. **JSON Schema round-trip** — import JSON Schema → Valify schema → export back to JSON Schema
4. **OpenAPI integration** — `express-valify` middleware auto-generates OpenAPI docs from schemas
5. **Visual schema builder** — drag-and-drop web app exports Valify schema code
6. **AI-assisted rules** — natural language rule description → generated custom validator
7. **Schema diffing** — detect breaking changes between schema versions for API compatibility auditing
8. **Streaming validation** — validate streaming JSON/NDJSON payloads without buffering the full input
