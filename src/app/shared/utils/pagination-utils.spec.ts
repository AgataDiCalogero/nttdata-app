import { findNearestOption, normalizePage } from './pagination-utils';

describe('pagination utils', () => {
  describe('normalizePage', () => {
    it('floors valid numbers and enforces minimum 1', () => {
      expect(normalizePage(3.9, 1)).toBe(3);
      expect(normalizePage(-2, 1)).toBe(1);
    });

    it('falls back when value is not finite', () => {
      expect(normalizePage(undefined, 4)).toBe(4);
      expect(normalizePage(NaN, 2)).toBe(2);
    });
  });

  describe('findNearestOption', () => {
    it('returns the sanitized value when no options remain but value is finite', () => {
      expect(findNearestOption(2, [], 6)).toBe(2);
      expect(findNearestOption(-1, [0, -2], 3)).toBe(1);
    });

    it('falls back when the provided value is not finite', () => {
      expect(findNearestOption(NaN, [], 6)).toBe(6);
    });

    it('returns the exact target when it matches a sanitized option', () => {
      expect(findNearestOption(5.7, [5, 7], 1)).toBe(5);
    });

    it('returns the next higher option when the target is missing', () => {
      expect(findNearestOption(4, [3, 6, 10], 1)).toBe(6);
    });

    it('falls back to the last option when all entries are smaller than the target', () => {
      expect(findNearestOption(12, [2, 5], 1)).toBe(5);
    });
  });
});
