export function check(value, predicate, error) {
  if (!predicate(value)) {
    throw new Error(error)
  }
}