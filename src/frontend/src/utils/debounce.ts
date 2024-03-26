/**
 * Creates a debounced function that delays invoking `func` until after
 * `wait` milliseconds have elapsed since the last time the debounced
 * function was invoked.
 *
 * @template T A function type that extends from a generic function signature.
 * @param {T} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait.
 * @returns {T} A new debounced version of the `func` function.
 * @example
 * // Usage with a simple logging function upon window resize.
 * const logMessage = (message) => console.log(message);
 * const debouncedLogMessage = debounce(logMessage, 200);
 *
 * window.addEventListener('resize', () => {
 *   debouncedLogMessage('Window was resized!');
 * });
 *
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): T {
  let timeoutId: number | null = null;

  const debouncedFunction = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait) as unknown as number;
  };

  return debouncedFunction as T;
}
