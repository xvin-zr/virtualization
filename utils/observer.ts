const defaultObserverConfig = { threshold: 0.25 };

type ObserverConfig = typeof defaultObserverConfig;

/**
 * Creates an intersection observer to monitor elements
 * @param target Elements to observe
 * @param callback Callback fired when intersection changes
 * @param config Optional configuration settings
 * @returns Configured IntersectionObserver instance
 */
export function intersectionObserver(
  target: HTMLElement[],
  callback: IntersectionObserverCallback,
  config?: Partial<IntersectionObserverInit>
): IntersectionObserver {
  const observerInit = Object.assign({}, defaultObserverConfig, config ?? {});
  const observer = new IntersectionObserver(callback, observerInit);
  setTimeout(() => {
    target.forEach((t) => observer.observe(t));
  }, 100);
  return observer;
}
