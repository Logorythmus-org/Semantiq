/** Deterministic ordering shared by human-subject and human-judge presentations. */
export function seededCanonicalOrder<T>(items: readonly T[], seed: number): T[] {
  let state = seed >>> 0;
  const random = (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const ordered = [...items];
  for (let index = ordered.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex]!, ordered[index]!];
  }
  return ordered;
}
