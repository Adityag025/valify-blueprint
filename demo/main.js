import { string }   from '../src/validators/StringValidator.js'
import { number }   from '../src/validators/NumberValidator.js'
import { boolean }  from '../src/validators/BooleanValidator.js'
import { ref }      from '../src/schema/ref.js'
import { date }     from '../src/validators/DateValidator.js'
import { array }    from '../src/validators/ArrayValidator.js'
import { object }   from '../src/validators/ObjectValidator.js'
import { setLocale, registerLocale } from '../src/index.js'
import hiLocale from '../src/locales/hi.js'
import esLocale from '../src/locales/es.js'
import frLocale from '../src/locales/fr.js'
import deLocale from '../src/locales/de.js'

// Register all locales up front
registerLocale('hi', hiLocale)
registerLocale('es', esLocale)
registerLocale('fr', frLocale)
registerLocale('de', deLocale)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id) }
function $$(sel) { return document.querySelectorAll(sel) }

function resultHtml(result) {
  const icon = result.ok ? '✓' : '✗'
  const cls  = result.ok ? 'result-ok' : 'result-fail'
  const body = result.ok
    ? `ok: true\nvalue: ${JSON.stringify(result.value, null, 2)}`
    : `ok: false\nerrors: [\n${result.errors.map(e =>
        `  { code: "${e.code}", message: "${e.message}", path: [${e.path.map(p => `"${p}"`).join(', ')}] }`
      ).join(',\n')}\n]`
  return { cls, text: `${icon}  ${body}` }
}

function setResult(id, result) {
  const el = $(id)
  const { cls, text } = resultHtml(result)
  el.className = `result-box ${cls}`
  el.textContent = text
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'))
    $$('.panel').forEach(p => p.classList.remove('active'))
    btn.classList.add('active')
    $(`panel-${btn.dataset.tab}`).classList.add('active')
  })
})

// ─── FORM DEMO ────────────────────────────────────────────────────────────────

const RegistrationSchema = object({
  name:     string().required().min(2).max(60),
  username: string().required().min(3).max(20).alphaNumeric(),
  email:    string().required().email(),
  password: string().required().min(8).custom((v) => {
    if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter'
    if (!/\d/.test(v))     return 'Must contain at least one digit'
    return true
  }),
  age:     number().required().integer().min(18).max(120),
  website: string().url(),
  role:    string().required().oneOf(['admin', 'user', 'guest']),
})

const formFields = ['name', 'username', 'email', 'password', 'age', 'website', 'role']

function getFormData() {
  return {
    name:     $('f-name').value,
    username: $('f-username').value,
    email:    $('f-email').value,
    password: $('f-password').value,
    age:      $('f-age').value !== '' ? Number($('f-age').value) : undefined,
    website:  $('f-website').value || undefined,
    role:     $('f-role').value || undefined,
  }
}

function setFieldState(field, errors) {
  const input = $(`f-${field}`)
  const errEl = $(`e-${field}`)
  if (!input) return
  const fieldErrors = errors.filter(e => e.path[0] === field || e.field === field)
  if (fieldErrors.length > 0) {
    input.className = 'invalid'
    errEl.textContent = '⚠ ' + fieldErrors[0].message
  } else if (input.value !== '') {
    input.className = 'valid'
    errEl.textContent = ''
  } else {
    input.className = ''
    errEl.textContent = ''
  }
}

function runFormValidation() {
  const data = getFormData()
  const result = RegistrationSchema.validate(data, { abortEarly: false })
  formFields.forEach(f => setFieldState(f, result.errors))

  const liveEl = $('form-live-result')
  const { cls, text } = resultHtml(result)
  liveEl.className = `result-box ${cls}`
  liveEl.textContent = text
}

formFields.forEach(f => {
  const el = $(`f-${f}`)
  if (el) el.addEventListener('input', runFormValidation)
})
$('f-role').addEventListener('change', runFormValidation)

$('submit-btn').addEventListener('click', () => {
  runFormValidation()
  const data = getFormData()
  const result = RegistrationSchema.validate(data, { abortEarly: false })
  const resultEl = $('form-result')
  if (result.ok) {
    resultEl.innerHTML = `<div class="pill pill-ok" style="font-size:.9rem;padding:.5rem 1rem">
      ✓ Form is valid! Ready to submit.
    </div>`
  } else {
    resultEl.innerHTML = `<div class="pill pill-fail" style="font-size:.9rem;padding:.5rem 1rem">
      ✗ ${result.errors.length} error${result.errors.length > 1 ? 's' : ''} — fix them before submitting.
    </div>`
  }
})

$('clear-btn').addEventListener('click', () => {
  formFields.forEach(f => {
    const el = $(`f-${f}`)
    if (el) { el.value = ''; el.className = '' }
    const errEl = $(`e-${f}`)
    if (errEl) errEl.textContent = ''
  })
  $('form-live-result').className = 'result-box result-empty'
  $('form-live-result').textContent = 'Type in the form to see results...'
  $('form-result').innerHTML = ''
})

// ─── PLAYGROUND ───────────────────────────────────────────────────────────────

const validatorRules = {
  string: [
    { name: 'required',     label: '.required()' },
    { name: 'min3',         label: '.min(3)' },
    { name: 'max50',        label: '.max(50)' },
    { name: 'email',        label: '.email()' },
    { name: 'url',          label: '.url()' },
    { name: 'uuid',         label: '.uuid()' },
    { name: 'alpha',        label: '.alpha()' },
    { name: 'alphaNumeric', label: '.alphaNumeric()' },
    { name: 'uppercase',    label: '.uppercase()' },
    { name: 'lowercase',    label: '.lowercase()' },
    { name: 'trim',         label: '.trim()' },
  ],
  number: [
    { name: 'required',   label: '.required()' },
    { name: 'min0',       label: '.min(0)' },
    { name: 'max100',     label: '.max(100)' },
    { name: 'integer',    label: '.integer()' },
    { name: 'positive',   label: '.positive()' },
    { name: 'negative',   label: '.negative()' },
    { name: 'finite',     label: '.finite()' },
  ],
  boolean: [
    { name: 'required', label: '.required()' },
    { name: 'true',     label: '.true()' },
    { name: 'false',    label: '.false()' },
  ],
  date: [
    { name: 'required', label: '.required()' },
    { name: 'past',     label: '.past()' },
    { name: 'future',   label: '.future()' },
    { name: 'weekday',  label: '.weekday()' },
  ],
  array: [
    { name: 'required',  label: '.required()' },
    { name: 'minItems1', label: '.minItems(1)' },
    { name: 'maxItems5', label: '.maxItems(5)' },
    { name: 'unique',    label: '.unique()' },
    { name: 'compact',   label: '.compact()' },
  ],
}

let activeType  = 'string'
let activeRules = new Set()

function buildPlaygroundValidator() {
  let v = null
  const rules = [...activeRules]
  const ruleLabels = []

  if (activeType === 'string') {
    v = string()
    if (rules.includes('required'))     { v = v.required();    ruleLabels.push('.required()') }
    if (rules.includes('min3'))         { v = v.min(3);        ruleLabels.push('.min(3)') }
    if (rules.includes('max50'))        { v = v.max(50);       ruleLabels.push('.max(50)') }
    if (rules.includes('email'))        { v = v.email();       ruleLabels.push('.email()') }
    if (rules.includes('url'))          { v = v.url();         ruleLabels.push('.url()') }
    if (rules.includes('uuid'))         { v = v.uuid();        ruleLabels.push('.uuid()') }
    if (rules.includes('alpha'))        { v = v.alpha();       ruleLabels.push('.alpha()') }
    if (rules.includes('alphaNumeric')) { v = v.alphaNumeric(); ruleLabels.push('.alphaNumeric()') }
    if (rules.includes('uppercase'))    { v = v.uppercase();   ruleLabels.push('.uppercase()') }
    if (rules.includes('lowercase'))    { v = v.lowercase();   ruleLabels.push('.lowercase()') }
    if (rules.includes('trim'))         { v = v.trim();        ruleLabels.push('.trim()') }
  } else if (activeType === 'number') {
    v = number()
    if (rules.includes('required')) { v = v.required(); ruleLabels.push('.required()') }
    if (rules.includes('min0'))     { v = v.min(0);     ruleLabels.push('.min(0)') }
    if (rules.includes('max100'))   { v = v.max(100);   ruleLabels.push('.max(100)') }
    if (rules.includes('integer'))  { v = v.integer();  ruleLabels.push('.integer()') }
    if (rules.includes('positive')) { v = v.positive(); ruleLabels.push('.positive()') }
    if (rules.includes('negative')) { v = v.negative(); ruleLabels.push('.negative()') }
    if (rules.includes('finite'))   { v = v.finite();   ruleLabels.push('.finite()') }
  } else if (activeType === 'boolean') {
    v = boolean()
    if (rules.includes('required')) { v = v.required(); ruleLabels.push('.required()') }
    if (rules.includes('true'))     { v = v.true();     ruleLabels.push('.true()') }
    if (rules.includes('false'))    { v = v.false();    ruleLabels.push('.false()') }
  } else if (activeType === 'date') {
    v = date()
    if (rules.includes('required')) { v = v.required(); ruleLabels.push('.required()') }
    if (rules.includes('past'))     { v = v.past();     ruleLabels.push('.past()') }
    if (rules.includes('future'))   { v = v.future();   ruleLabels.push('.future()') }
    if (rules.includes('weekday'))  { v = v.weekday();  ruleLabels.push('.weekday()') }
  } else if (activeType === 'array') {
    v = array()
    if (rules.includes('required'))  { v = v.required();   ruleLabels.push('.required()') }
    if (rules.includes('minItems1')) { v = v.minItems(1);  ruleLabels.push('.minItems(1)') }
    if (rules.includes('maxItems5')) { v = v.maxItems(5);  ruleLabels.push('.maxItems(5)') }
    if (rules.includes('unique'))    { v = v.unique();     ruleLabels.push('.unique()') }
    if (rules.includes('compact'))   { v = v.compact();    ruleLabels.push('.compact()') }
  }

  const code = `${activeType}()${ruleLabels.join('\n  ')}`
  return { v, code }
}

function renderRuleChips() {
  const chips = $('rule-chips')
  const rules = validatorRules[activeType] || []
  chips.innerHTML = rules.map(r => `
    <button class="chip ${activeRules.has(r.name) ? 'on' : ''}" data-rule="${r.name}">${r.label}</button>
  `).join('')

  chips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const r = chip.dataset.rule
      activeRules.has(r) ? activeRules.delete(r) : activeRules.add(r)
      renderRuleChips()
      updatePgCode()
    })
  })
}

function updatePgCode() {
  const { code } = buildPlaygroundValidator()
  $('pg-code').textContent = code
}

$$('#vtype-grid .vcard').forEach(card => {
  card.addEventListener('click', () => {
    $$('#vtype-grid .vcard').forEach(c => c.classList.remove('active'))
    card.classList.add('active')
    activeType = card.dataset.type
    activeRules = new Set()
    renderRuleChips()
    updatePgCode()
    // Update input hint
    const hints = {
      string: 'Type a string value',
      number: 'Type a number (e.g. 42)',
      boolean: 'Type: true or false',
      date: 'Type a date (e.g. 2025-06-01)',
      array: 'Type JSON array (e.g. [1,2,3])',
    }
    $('pg-input-label').textContent = hints[activeType] || 'Value to validate'
    $('pg-input').value = ''
    $('pg-result').className = 'result-box result-empty'
    $('pg-result').textContent = 'Configure rules and click Validate →'
  })
})

$('pg-run').addEventListener('click', () => {
  const { v } = buildPlaygroundValidator()
  if (!v) return

  let raw = $('pg-input').value
  let value = raw

  if (activeType === 'number')  value = raw === '' ? undefined : Number(raw)
  if (activeType === 'boolean') value = raw === 'true' ? true : raw === 'false' ? false : raw
  if (activeType === 'date')    value = raw || undefined
  if (activeType === 'array') {
    try { value = JSON.parse(raw) } catch { value = raw }
  }

  const result = v.validate(value, { abortEarly: false })
  setResult('pg-result', result)
})

$('pg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('pg-run').click()
})

renderRuleChips()
updatePgCode()

// ─── SCHEMA COMPOSER ──────────────────────────────────────────────────────────

const schemaFields = []
const typeOptions = ['string', 'number', 'boolean', 'date']
const ruleOptions = {
  string: ['required', 'email', 'url', 'uuid', 'min(3)', 'max(50)', 'alpha', 'alphaNumeric', 'lowercase', 'uppercase'],
  number: ['required', 'integer', 'positive', 'min(0)', 'max(100)'],
  boolean: ['required'],
  date: ['required', 'past', 'future'],
}

function renderSchemaFields() {
  const container = $('schema-fields')
  container.innerHTML = schemaFields.map((f, i) => `
    <div class="schema-row">
      <input type="text" value="${f.name}" placeholder="Field name" data-idx="${i}" data-prop="name" />
      <select data-idx="${i}" data-prop="type">
        ${typeOptions.map(t => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <select data-idx="${i}" data-prop="rule">
        <option value="">no extra rule</option>
        ${(ruleOptions[f.type] || []).map(r => `<option value="${r}" ${f.rule === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
      <button class="del-btn" data-idx="${i}">✕</button>
    </div>
  `).join('')

  container.querySelectorAll('input[data-prop="name"]').forEach(el => {
    el.addEventListener('input', () => {
      schemaFields[el.dataset.idx].name = el.value
      updateSchemaCode()
    })
  })
  container.querySelectorAll('select[data-prop="type"]').forEach(el => {
    el.addEventListener('change', () => {
      schemaFields[el.dataset.idx].type = el.value
      schemaFields[el.dataset.idx].rule = ''
      renderSchemaFields()
      updateSchemaCode()
    })
  })
  container.querySelectorAll('select[data-prop="rule"]').forEach(el => {
    el.addEventListener('change', () => {
      schemaFields[el.dataset.idx].rule = el.value
      updateSchemaCode()
    })
  })
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      schemaFields.splice(btn.dataset.idx, 1)
      renderSchemaFields()
      updateSchemaCode()
    })
  })
}

function updateSchemaCode() {
  if (schemaFields.length === 0) {
    $('schema-code').textContent = 'object({})'
    return
  }
  const lines = schemaFields.map(f => {
    if (!f.name) return null
    let chain = `${f.type}()`
    if (f.rule === 'required')     chain += '.required()'
    else if (f.rule === 'email')   chain += '.email()'
    else if (f.rule === 'url')     chain += '.url()'
    else if (f.rule === 'uuid')    chain += '.uuid()'
    else if (f.rule === 'integer') chain += '.integer()'
    else if (f.rule === 'positive')chain += '.positive()'
    else if (f.rule === 'past')    chain += '.past()'
    else if (f.rule === 'future')  chain += '.future()'
    else if (f.rule === 'alpha')   chain += '.alpha()'
    else if (f.rule === 'alphaNumeric') chain += '.alphaNumeric()'
    else if (f.rule === 'lowercase')    chain += '.lowercase()'
    else if (f.rule === 'uppercase')    chain += '.uppercase()'
    else if (f.rule === 'min(0)')  chain += '.min(0)'
    else if (f.rule === 'min(3)')  chain += '.min(3)'
    else if (f.rule === 'max(50)') chain += '.max(50)'
    else if (f.rule === 'max(100)')chain += '.max(100)'
    return `  ${f.name}: ${chain}`
  }).filter(Boolean)
  $('schema-code').textContent = `object({\n${lines.join(',\n')}\n})`
}

$('add-field-btn').addEventListener('click', () => {
  schemaFields.push({ name: `field${schemaFields.length + 1}`, type: 'string', rule: '' })
  renderSchemaFields()
  updateSchemaCode()
})

$('schema-validate-btn').addEventListener('click', () => {
  const shape = {}
  schemaFields.forEach(f => {
    if (!f.name) return
    let v = { string, number, boolean, date }[f.type]?.()
    if (!v) return
    if (f.rule === 'required')     v = v.required()
    else if (f.rule === 'email')   v = v.email()
    else if (f.rule === 'url')     v = v.url()
    else if (f.rule === 'uuid')    v = v.uuid()
    else if (f.rule === 'integer') v = v.integer()
    else if (f.rule === 'positive')v = v.positive()
    else if (f.rule === 'past')    v = v.past()
    else if (f.rule === 'future')  v = v.future()
    else if (f.rule === 'min(0)')  v = v.min(0)
    else if (f.rule === 'min(3)')  v = v.min(3)
    else if (f.rule === 'max(50)') v = v.max(50)
    else if (f.rule === 'max(100)')v = v.max(100)
    shape[f.name] = v
  })
  const schema = object(shape)
  let data
  try { data = JSON.parse($('schema-json').value) }
  catch { $('schema-result').className = 'result-box result-fail'; $('schema-result').textContent = '✗ Invalid JSON input'; return }
  const result = schema.validate(data, { abortEarly: false })
  setResult('schema-result', result)
})

// Add 3 starter fields
;['name', 'email', 'age'].forEach((n, i) => {
  schemaFields.push({ name: n, type: ['string', 'string', 'number'][i], rule: ['required', 'email', 'required'][i] })
})
renderSchemaFields()
updateSchemaCode()
$('schema-json').value = '{"name":"Alice","email":"alice@example.com","age":25}'

// ─── ASYNC DEMO ───────────────────────────────────────────────────────────────

const TAKEN_EMAILS    = new Set(['taken@example.com', 'admin@example.com', 'test@test.com'])
const RESERVED_USERS  = new Set(['admin', 'root', 'system', 'superuser', 'valify'])

function fakeApiCall(fn, ms) {
  return new Promise(resolve => setTimeout(() => resolve(fn()), ms))
}

let emailAbort = null

$('async-email-btn').addEventListener('click', async () => {
  if (emailAbort) emailAbort.abort()
  emailAbort = new AbortController()

  const email = $('async-email').value
  const statusEl = $('async-email-status')
  const resultEl = $('async-result')

  // Sync validation first
  const syncValidator = string().required().email()
  const syncResult = syncValidator.validate(email)
  if (!syncResult.ok) {
    statusEl.innerHTML = `<span style="color:var(--error)">✗ ${syncResult.errors[0].message}</span>`
    setResult('async-result', syncResult)
    return
  }

  statusEl.innerHTML = `<span class="spinner"></span> Checking availability...`
  resultEl.className = 'result-box result-empty'
  resultEl.textContent = 'Checking...'

  const validator = string().required().email().customAsync(async (value) => {
    const taken = await fakeApiCall(() => TAKEN_EMAILS.has(value), 700)
    return taken ? `"${value}" is already registered` : true
  })

  try {
    const result = await validator.validateAsync(email, { signal: emailAbort.signal })
    statusEl.innerHTML = result.ok
      ? `<span style="color:var(--success)">✓ Email is available!</span>`
      : `<span style="color:var(--error)">✗ ${result.errors[0].message}</span>`
    setResult('async-result', result)
  } catch (e) {
    if (e?.name === 'AbortError') {
      statusEl.innerHTML = `<span style="color:var(--muted)">— Cancelled</span>`
    }
  }
})

let userAbort = null

$('async-user-btn').addEventListener('click', async () => {
  if (userAbort) userAbort.abort()
  userAbort = new AbortController()

  const username = $('async-user').value
  const statusEl = $('async-user-status')
  const resultEl = $('async-result')

  const syncResult = string().required().min(3).max(20).alphaNumeric().validate(username)
  if (!syncResult.ok) {
    statusEl.innerHTML = `<span style="color:var(--error)">✗ ${syncResult.errors[0].message}</span>`
    setResult('async-result', syncResult)
    return
  }

  statusEl.innerHTML = `<span class="spinner"></span> Checking username...`
  resultEl.className = 'result-box result-empty'
  resultEl.textContent = 'Checking...'

  const validator = string().required().min(3).max(20).alphaNumeric()
    .customAsync(async (value) => {
      const reserved = await fakeApiCall(() => RESERVED_USERS.has(value.toLowerCase()), 500)
      return reserved ? `"${value}" is a reserved username` : true
    })

  try {
    const result = await validator.validateAsync(username, { signal: userAbort.signal })
    statusEl.innerHTML = result.ok
      ? `<span style="color:var(--success)">✓ Username "${username}" is available!</span>`
      : `<span style="color:var(--error)">✗ ${result.errors[0].message}</span>`
    setResult('async-result', result)
  } catch (e) {
    if (e?.name === 'AbortError') {
      statusEl.innerHTML = `<span style="color:var(--muted)">— Cancelled</span>`
    }
  }
})

// ─── I18N ─────────────────────────────────────────────────────────────────────

const localeNames = { en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German' }
let currentLocale = 'en'

$$('#locale-btns .locale-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('#locale-btns .locale-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentLocale = btn.dataset.locale
    setLocale(currentLocale)
    $('locale-label').textContent = localeNames[currentLocale]
  })
})

$('i18n-btn').addEventListener('click', () => {
  const nameVal = $('i18n-name').value
  const emailVal = $('i18n-email').value
  const ageVal   = $('i18n-age').value

  const i18nSchema = object({
    name:  string().required().min(2).label('Name'),
    email: string().required().email().label('Email'),
    age:   number().required().integer().min(18).label('Age'),
  })

  const data = {
    name:  nameVal || undefined,
    email: emailVal || undefined,
    age:   ageVal !== '' ? Number(ageVal) : undefined,
  }

  const result = i18nSchema.validate(data, { abortEarly: false, locale: currentLocale })
  setResult('i18n-result', result)
})

// ─── NEW FEATURES ─────────────────────────────────────────────────────────────

const paymentSchema = object({
  method: string().required(),
  cardNumber: string().when('method', {
    is: 'card',
    then: (s) => s.required('Card number is required').min(16, 'Must be at least 16 digits'),
  }),
  bankAccount: string().when('method', {
    is: 'bank',
    then: (s) => s.required('Bank account is required'),
  }),
})

$('w-run').addEventListener('click', () => {
  const data = {
    method: $('w-method').value,
    cardNumber: $('w-card').value || undefined,
    bankAccount: $('w-bank').value || undefined,
  }
  const result = paymentSchema.validate(data, { abortEarly: false })
  ;['card', 'bank'].forEach((f) => {
    const errEl = $(f === 'card' ? 'we-card' : 'we-bank')
    const field = f === 'card' ? 'cardNumber' : 'bankAccount'
    const err = result.errors?.find((e) => e.field === field)
    errEl.textContent = err ? '⚠ ' + err.message : ''
  })
  setResult('w-result', result)
})

const passwordSchema = object({
  password: string().required().min(8),
  confirm: string().required().equals(ref('password'), 'Passwords must match'),
})

$('r-run').addEventListener('click', () => {
  const data = { password: $('r-password').value, confirm: $('r-confirm').value }
  const result = passwordSchema.validate(data, { abortEarly: false })
  const pwErr = result.errors?.find((e) => e.field === 'password')
  const cfErr = result.errors?.find((e) => e.field === 'confirm')
  $('re-password').textContent = pwErr ? '⚠ ' + pwErr.message : ''
  $('re-confirm').textContent  = cfErr ? '⚠ ' + cfErr.message  : ''
  setResult('r-result', result)
})

$('c-run').addEventListener('click', () => {
  const ageResult = number().coerce().required().integer().min(0).validate($('c-age').value)
  const { cls: ac, text: at } = resultHtml(ageResult)
  $('c-age-result').className = `result-box ${ac}`
  $('c-age-result').textContent = at

  const boolResult = boolean().coerce().validate($('c-bool').value)
  const { cls: bc, text: bt } = resultHtml(boolResult)
  $('c-bool-result').className = `result-box ${bc}`
  $('c-bool-result').textContent = bt

  const arrResult = array(string()).coerce().minItems(1).validate($('c-arr').value)
  const { cls: rc, text: rt } = resultHtml(arrResult)
  $('c-arr-result').className = `result-box ${rc}`
  $('c-arr-result').textContent = rt
})

// ─── ERROR INSPECTOR ──────────────────────────────────────────────────────────

const errorScenarios = {
  required: () => string().required().validate(''),
  type:     () => number().validate('not-a-number'),
  email:    () => string().email().validate('user@'),
  min:      () => string().min(10).validate('hi'),
  max:      () => string().max(3).validate('toolongstring'),
  integer:  () => number().integer().validate(3.14),
  minItems: () => array().minItems(3).validate([1]),
  unique:   () => array().unique().validate([1, 2, 1, 3]),
  custom:   () => string().custom(() => 'This value is not acceptable').validate('foo'),
  multi: () => object({
    name:  string().required().min(3),
    email: string().required().email(),
    age:   number().required().integer().min(18),
  }).validate({ name: 'x', email: 'bad', age: 5 }, { abortEarly: false }),
}

$$('#error-triggers button').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('#error-triggers button').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    const scenario = errorScenarios[btn.dataset.error]
    if (!scenario) return
    const result = scenario()

    const resultEl  = $('error-result')
    const jsonEl    = $('error-json')

    const { cls, text } = resultHtml(result)
    resultEl.className = `result-box ${cls}`
    resultEl.textContent = text

    jsonEl.className = `result-box ${result.ok ? 'result-ok' : 'result-fail'}`
    jsonEl.textContent = JSON.stringify(
      result.errors.map(e => e.toJSON ? e.toJSON() : e),
      null, 2
    ) || '[]'
  })
})
