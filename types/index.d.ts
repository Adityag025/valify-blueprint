// ─── Core result type ──────────────────────────────────────────────────────

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
  parallel?: boolean
  context?: Record<string, unknown>
}

// ─── Custom validator function signatures ──────────────────────────────────

export type CustomValidatorFn = (
  value: unknown,
  ctx: ValidateOptions & { field: string; path: string[] }
) => true | false | string

export type AsyncCustomValidatorFn = (
  value: unknown,
  ctx: ValidateOptions & { field: string; path: string[] }
) => Promise<true | false | string>

// ─── Type inference ────────────────────────────────────────────────────────

export type Infer<T extends BaseValidator<unknown, unknown>> = T['_output']

// ─── Base validator ────────────────────────────────────────────────────────

export declare class BaseValidator<TInput, TOutput = TInput> {
  readonly _input: TInput
  readonly _output: TOutput

  optional(): BaseValidator<TInput | undefined, TOutput | undefined>
  default<D extends TOutput>(value: D): BaseValidator<TInput | undefined, TOutput>
  label(name: string): this
  custom(fn: CustomValidatorFn, code?: string, message?: string): this
  customAsync(fn: AsyncCustomValidatorFn, code?: string): this
  validate(value: unknown, options?: ValidateOptions): ValidationResult<TOutput>
  validateAsync(value: unknown, options?: ValidateOptions): Promise<ValidationResult<TOutput>>
}

// ─── String validator ──────────────────────────────────────────────────────

export declare class StringValidator extends BaseValidator<string, string> {
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
  oneOf<T extends readonly string[]>(
    values: T,
    message?: string
  ): BaseValidator<string, T[number]>
  trim(): this
}

export declare function string(): StringValidator

// ─── Number validator ──────────────────────────────────────────────────────

export declare class NumberValidator extends BaseValidator<number, number> {
  required(message?: string): this
  min(n: number, message?: string): this
  max(n: number, message?: string): this
  integer(message?: string): this
  float(message?: string): this
  positive(message?: string): this
  negative(message?: string): this
  nonNegative(message?: string): this
  between(min: number, max: number, message?: string): this
  multipleOf(n: number, message?: string): this
  finite(message?: string): this
  safe(message?: string): this
}

export declare function number(): NumberValidator

// ─── Boolean validator ─────────────────────────────────────────────────────

export declare class BooleanValidator extends BaseValidator<boolean, boolean> {
  required(message?: string): this
  true(message?: string): this
  false(message?: string): this
  equals(bool: boolean, message?: string): this
}

export declare function boolean(): BooleanValidator

// ─── Date validator ────────────────────────────────────────────────────────

export declare class DateValidator extends BaseValidator<Date | string | number, Date> {
  required(message?: string): this
  before(date: Date | string | number, message?: string): this
  after(date: Date | string | number, message?: string): this
  minDate(date: Date | string | number, message?: string): this
  maxDate(date: Date | string | number, message?: string): this
  future(message?: string): this
  past(message?: string): this
  between(min: Date | string | number, max: Date | string | number, message?: string): this
  weekday(message?: string): this
}

export declare function date(): DateValidator

// ─── Array validator ───────────────────────────────────────────────────────

export declare class ArrayValidator<TItem = unknown> extends BaseValidator<
  unknown[],
  TItem[]
> {
  required(message?: string): this
  minItems(n: number, message?: string): this
  maxItems(n: number, message?: string): this
  length(n: number, message?: string): this
  unique(message?: string): this
  contains(item: TItem, message?: string): this
  every(fn: (item: TItem) => boolean, message?: string): this
  some(fn: (item: TItem) => boolean, message?: string): this
  noEmpty(message?: string): this
  compact(): this
}

export declare function array<T = unknown>(
  itemSchema?: BaseValidator<unknown, T>
): ArrayValidator<T>

// ─── Object validator ──────────────────────────────────────────────────────

type ObjectShape = Record<string, BaseValidator<unknown, unknown>>

type RequiredKeys<S extends ObjectShape> = {
  [K in keyof S]: undefined extends S[K]['_output'] ? never : K
}[keyof S]

type OptionalKeys<S extends ObjectShape> = {
  [K in keyof S]: undefined extends S[K]['_output'] ? K : never
}[keyof S]

type InferShape<S extends ObjectShape> = {
  [K in RequiredKeys<S>]: S[K]['_output']
} & {
  [K in OptionalKeys<S>]?: S[K]['_output']
}

export declare class ObjectValidator<S extends ObjectShape = ObjectShape> extends BaseValidator<
  Record<string, unknown>,
  InferShape<S>
> {
  required(message?: string): this
  exact(): this
  strip(): this
  unknown(allow?: boolean): this
  extend<U extends ObjectShape>(fields: U): ObjectValidator<Omit<S, keyof U> & U>
  pick<K extends keyof S>(...keys: K[]): ObjectValidator<Pick<S, K>>
  omit<K extends keyof S>(...keys: K[]): ObjectValidator<Omit<S, K>>
}

export declare function object<S extends ObjectShape>(shape?: S): ObjectValidator<S>

// ─── Error classes ─────────────────────────────────────────────────────────

export declare class ValidationError extends Error {
  name: 'ValidationError'
  field: string
  code: string
  value: unknown
  rule: string
  path: string[]
  toJSON(): ValidationErrorJSON
}

export declare const ErrorCodes: {
  readonly ERR_TYPE:          string
  readonly ERR_REQUIRED:      string
  readonly ERR_MIN:           string
  readonly ERR_MAX:           string
  readonly ERR_LENGTH:        string
  readonly ERR_EMAIL:         string
  readonly ERR_URL:           string
  readonly ERR_UUID:          string
  readonly ERR_REGEX:         string
  readonly ERR_ALPHA:         string
  readonly ERR_ALPHA_NUMERIC: string
  readonly ERR_LOWERCASE:     string
  readonly ERR_UPPERCASE:     string
  readonly ERR_CONTAINS:      string
  readonly ERR_STARTS_WITH:   string
  readonly ERR_ENDS_WITH:     string
  readonly ERR_ONE_OF:        string
  readonly ERR_INTEGER:       string
  readonly ERR_FLOAT:         string
  readonly ERR_POSITIVE:      string
  readonly ERR_NEGATIVE:      string
  readonly ERR_NON_NEGATIVE:  string
  readonly ERR_MULTIPLE_OF:   string
  readonly ERR_FINITE:        string
  readonly ERR_SAFE:          string
  readonly ERR_MIN_ITEMS:     string
  readonly ERR_MAX_ITEMS:     string
  readonly ERR_UNIQUE:        string
  readonly ERR_BEFORE:        string
  readonly ERR_AFTER:         string
  readonly ERR_FUTURE:        string
  readonly ERR_PAST:          string
  readonly ERR_BOOLEAN_TRUE:  string
  readonly ERR_BOOLEAN_FALSE: string
  readonly ERR_CUSTOM:        string
  [key: string]: string
}

// ─── Ref ───────────────────────────────────────────────────────────────────

export declare class Ref {
  constructor(path: string | string[])
  resolve(context: unknown): unknown
}
export declare function ref(path: string | string[]): Ref
export declare function isRef(value: unknown): value is Ref

// ─── i18n ──────────────────────────────────────────────────────────────────

export declare function setLocale(code: string): void
export declare function registerLocale(code: string, messages: Record<string, string>): void
export declare function getLocale(): string

// ─── Plugins ───────────────────────────────────────────────────────────────

export interface PluginDefinition {
  name: string
  rules?: Record<string, {
    code?: string
    params?: Record<string, unknown>
    validate: (value: unknown, params: Record<string, unknown>, ctx: unknown) => boolean | string
    message?: string | ((params: Record<string, unknown>, field: string) => string)
  }>
  locales?: Record<string, Record<string, string>>
  hooks?: {
    beforeValidate?: (payload: unknown) => void
    afterValidate?: (payload: unknown) => void
    onError?: (error: ValidationError) => void
  }
  install?: (api: {
    addRule: (name: string, rule: unknown) => void
    addLocale: (locale: string, messages: Record<string, string>) => void
    addHook: (hook: string, fn: (...args: unknown[]) => unknown) => void
  }) => void
}

export declare function use(plugin: PluginDefinition): void
export declare function createPlugin(definition: PluginDefinition): PluginDefinition
export declare function addRule(name: string, spec: PluginDefinition['rules'][string]): void
