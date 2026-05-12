/**
 * Ref-counted scroll lock. Multiple components (chat popup, drawers, modals)
 * can request a lock simultaneously; body scroll only restores when all locks
 * are released. Saves the prior `overflow` value once at the first lock.
 */

let lockCount = 0;
let savedOverflow = "";

export function acquireScrollLock(): void {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    savedOverflow = "";
  }
}
