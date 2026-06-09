export function deepGet(obj, path) {
  return path.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

export function deepSet(obj, path, value) {
  if (path.length === 0) return value
  const [head, ...rest] = path
  return {
    ...obj,
    [head]: rest.length === 0 ? value : deepSet(obj?.[head] ?? {}, rest, value),
  }
}
