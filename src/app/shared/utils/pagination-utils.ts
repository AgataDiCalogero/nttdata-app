export const normalizePage = (value: number | undefined | null, fallback: number): number =>
  Math.max(1, Number.isFinite(value) ? Math.floor(value as number) : fallback);

export const findNearestOption = (
  value: number,
  options: readonly number[],
  fallback: number,
): number => {
  const sorted = [...options]
    .filter((option) => Number.isFinite(option) && option > 0)
    .map((option) => Math.floor(option))
    .sort((a, b) => a - b);
  if (!sorted.length) {
    return Math.max(1, Number.isFinite(value) ? Math.floor(value) : Math.floor(fallback));
  }

  const target = Math.max(1, Number.isFinite(value) ? Math.floor(value) : Math.floor(fallback));
  if (sorted.includes(target)) {
    return target;
  }

  return sorted.find((option) => option >= target) ?? sorted.at(-1) ?? Math.max(1, fallback);
};
