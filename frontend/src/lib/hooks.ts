import { useRef, useCallback } from "react";

export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    ((...args: any[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    }) as any,
    [fn, delay]
  ) as T;
}
