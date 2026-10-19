/** Cards with a screenshot lead; the original order holds within each group. */
export function imagesFirst<T extends { image?: string }>(items: readonly T[]): T[] {
  return [...items.filter((i) => i.image), ...items.filter((i) => !i.image)];
}
