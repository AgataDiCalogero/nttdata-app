let __uidCounter = 0;
export function createUniqueId(prefix = 'uid'): string {
  __uidCounter += 1;
  return `${prefix}-${__uidCounter}`;
}
