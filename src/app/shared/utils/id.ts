let __uidCounter = 0;
/**
 * Deterministic incremental id generator. Avoids relying on Date.now which may collide in SSR/hotreload.
 * Prefix is required to scope ids by component/context.
 */
export function createUniqueId(prefix = 'uid'): string {
  __uidCounter += 1;
  return `${prefix}-${__uidCounter}`;
}
