# Valify

Fast, lightweight, framework-agnostic JavaScript validation library.

[![Tests](https://img.shields.io/badge/tests-115%20passing-brightgreen)]()
[![Bundle size](https://img.shields.io/badge/bundle-~5KB%20gzipped-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Tree-shakable** — import only what you use
- **ESM + CommonJS** — works everywhere
- **TypeScript** — full type inference with `Infer<>`
- **Async validation** — built on `AbortController`
- **i18n** — 5 locales, runtime switching
- **Plugin system** — extend with custom rules and hooks
- **No dependencies**

## Install

```bash
npm install valify
```

## Quick Start

```js
import { string, number, boolean, object, array } from 'valify'

const UserSchema = object({
  name:  string().required().min(2).max(100),
  email: string().required().email(),
  age:   number().required().integer().min(18),
  role:  string().oneOf(['admin', 'user']).default('user'),
})

const result = UserSchema.validate({
  name: 'Alice',
  email: 'alice@example.com',
  age: 25,
})

if (result.ok) {
  console.log(result.value)   // { name: 'Alice', email: '...', age: 25, role: 'user' }
} else {
  console.log(result.errors)  // ValidationError[]
}
```

## Validators

### string()

```js
string()
  .required()
  .min(3)
  .max(50)
  .email()
  .url()
  .uuid()
  .regex(/pattern/)
  .alpha()
  .alphaNumeric()
  .lowercase()
  .uppercase()
  .contains('substring')
  .startsWith('prefix')
  .endsWith('.js')
  .oneOf(['a', 'b', 'c'])
  .trim()
  .custom(fn)
  .customAsync(asyncFn)
```

### number()

```js
number()
  .required()
  .min(0)
  .max(100)
  .integer()
  .positive()
  .negative()
  .nonNegative()
  .between(1, 10)
  .multipleOf(5)
  .finite()
  .safe()
```

### boolean()

```js
boolean().required().true()
boolean().required().false()
boolean().equals(true)
```

### date()

Accepts `Date`, ISO string, or timestamp.

```js
date()
  .required()
  .past()
  .future()
  .before('2025-01-01')
  .after(new Date('2020-01-01'))
  .between(min, max)
  .weekday()
```

### array()

```js
array(string().email())   // validates each item
  .required()
  .minItems(1)
  .maxItems(10)
  .unique()
  .compact()              // removes falsy values before validation
```

### object()

```js
const Schema = object({
  name: string().required(),
  age:  number().required(),
})

// Composition
Schema.extend({ role: string() })     // add/override fields
Schema.pick('name', 'email')          // subset
Schema.omit('age')                    // exclude
Schema.strip()                        // remove unknown keys
Schema.exact()                        // reject unknown keys
```

## Validate Options

```js
schema.validate(data, {
  abortEarly: false,   // collect all errors (default: true = stop at first)
  locale: 'es',        // override locale for this validation
})
```

## Result Shape

```js
// Always returns a result object — never throws
{ ok: true,  value: T,         errors: []            }
{ ok: false, value: undefined, errors: ValidationError[] }

// Each error
{
  field:   'email',
  code:    'ERR_EMAIL',
  message: 'email must be a valid email address',
  value:   'not-an-email',
  rule:    'email',
  path:    ['user', 'email']
}
```

## Async Validation

```js
const validator = string()
  .required()
  .email()
  .customAsync(async (value) => {
    const taken = await db.users.exists({ email: value })
    return taken ? 'Email is already registered' : true
  })

const result = await validator.validateAsync(value)

// With cancellation
const controller = new AbortController()
const result = await schema.validateAsync(data, { signal: controller.signal })
controller.abort()  // cancels in-flight async checks
```

## Custom Validators

```js
// Per-instance
string().custom((value) => {
  if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter'
  return true
})

// Global rule (available on all validators)
import { addRule } from 'valify'

addRule('isPrime', {
  code: 'ERR_PRIME',
  validate: (value) => { /* ... */ return true },
  message: ({ field }) => `${field} must be a prime number`,
})

number().isPrime()
```

## Plugins

```js
import { use, createPlugin } from 'valify'

const loggingPlugin = createPlugin({
  name: 'logging',
  hooks: {
    onError: (error) => console.warn('[validation]', error.toJSON()),
  },
})

use(loggingPlugin)
```

## Localization

```js
import { registerLocale, setLocale } from 'valify'
import hiLocale from 'valify/src/locales/hi.js'

registerLocale('hi', hiLocale)
setLocale('hi')

// All error messages now appear in Hindi
string().required().validate('')
// errors[0].message === 'Value आवश्यक है'
```

Built-in locales: `en`, `hi`, `es`, `fr`, `de`

## TypeScript

```typescript
import { object, string, number, Infer } from 'valify'

const UserSchema = object({
  name:  string().required(),
  email: string().required().email(),
  age:   number().integer().min(18),
  role:  string().oneOf(['admin', 'user'] as const),
})

type User = Infer<typeof UserSchema>
// { name: string; email: string; age: number; role: 'admin' | 'user' }
```

## Error Codes

| Code | Meaning |
|---|---|
| `ERR_REQUIRED` | Field is required |
| `ERR_TYPE` | Wrong type |
| `ERR_MIN` | Below minimum |
| `ERR_MAX` | Above maximum |
| `ERR_EMAIL` | Invalid email |
| `ERR_URL` | Invalid URL |
| `ERR_UUID` | Invalid UUID |
| `ERR_REGEX` | Pattern mismatch |
| `ERR_INTEGER` | Not a whole number |
| `ERR_MIN_ITEMS` | Too few array items |
| `ERR_MAX_ITEMS` | Too many array items |
| `ERR_UNIQUE` | Duplicate values |
| `ERR_UNKNOWN_KEY` | Unexpected key in strict mode |
| `ERR_FUTURE` / `ERR_PAST` | Date constraint |
| `ERR_CUSTOM` | Custom rule failure |

## License

MIT
