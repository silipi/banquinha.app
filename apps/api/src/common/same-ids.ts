/** Same ids, in any order, with no repeats. Used to check a full reorder request. */
export const sameIds = (given: string[], existing: string[]) =>
  given.length === existing.length &&
  new Set(given).size === given.length &&
  existing.every((id) => given.includes(id));
