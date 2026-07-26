export type InitialHomeTask = PromiseLike<unknown>;

export interface HomeReadinessOptions {
  /** Keep a stalled service from blocking the performance probe indefinitely. */
  timeoutMs?: number;
  /** Hidden tabs can throttle animation frames, so the post-render wait is bounded too. */
  animationFrameTimeoutMs?: number;
}

const DEFAULT_READINESS_TIMEOUT_MS = 8_000;
const DEFAULT_ANIMATION_FRAME_TIMEOUT_MS = 250;

function waitForNextAnimationFrame(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const state: {
      settled: boolean;
      frameId?: number;
      timeoutId?: number;
    } = { settled: false };

    const finish = (): void => {
      if (state.settled) return;
      state.settled = true;
      if (state.frameId !== undefined) window.cancelAnimationFrame(state.frameId);
      if (state.timeoutId !== undefined) window.clearTimeout(state.timeoutId);
      resolve();
    };

    state.frameId = window.requestAnimationFrame(finish);
    state.timeoutId = window.setTimeout(finish, Math.max(0, timeoutMs));
  });
}

/**
 * The performance probe must observe the homepage after its first-wave async
 * content has either rendered or failed. Failures are deliberately settled so
 * a failed non-critical endpoint cannot leave the probe waiting forever.
 */
export async function markHomeReadyAfterInitialTasks(
  root: HTMLElement,
  tasks: readonly InitialHomeTask[],
  {
    timeoutMs = DEFAULT_READINESS_TIMEOUT_MS,
    animationFrameTimeoutMs = DEFAULT_ANIMATION_FRAME_TIMEOUT_MS,
  }: HomeReadinessOptions = {}
): Promise<void> {
  const settled = Promise.allSettled(tasks);
  const boundedTimeout = Math.max(0, timeoutMs);
  let timeoutId: number | undefined;

  await Promise.race([
    settled,
    new Promise<void>((resolve) => {
      timeoutId = window.setTimeout(resolve, boundedTimeout);
    }),
  ]);

  if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  // Kategori gibi async tüketiciler innerHTML ile içerik ürettikten sonra
  // tarayıcının DOM değişikliğini işlemesi için en az bir kare bekle. Gizli
  // sekmelerde requestAnimationFrame kısıtlanabildiğinden bu bekleme sınırlıdır.
  await waitForNextAnimationFrame(animationFrameTimeoutMs);
  root.dataset.perfReady = "true";
}
