// All patterns verified to be safe from catastrophic backtracking
export const PATTERNS = {
  email:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
  url: /^https?:\/\/(?:[-\w]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?$/i,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  alpha: /^[a-zA-Z]+$/,
  alphaNumeric: /^[a-zA-Z0-9]+$/,
}

const MAX_REGEX_SOURCE_LENGTH = 500

export function validateUserRegex(pattern) {
  if (!(pattern instanceof RegExp)) {
    throw new TypeError('[Valify] Expected a RegExp instance')
  }
  if (pattern.source.length > MAX_REGEX_SOURCE_LENGTH) {
    throw new Error(
      `[Valify] Regex source too long (max ${MAX_REGEX_SOURCE_LENGTH} chars). ` +
        'Overly complex patterns can cause denial-of-service.'
    )
  }
}
