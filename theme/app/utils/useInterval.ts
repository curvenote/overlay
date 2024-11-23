import { useEffect, useRef } from 'react';

/**
 * useInerval hook for polling
 *
 * by Dan Abramov
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * @param callback - the function to call on an interval
 * @param delay - the interval in ms
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const useInterval = <T extends Function>(
  callback: T,
  delay: number,
  activate: boolean,
  onClear?: () => void,
) => {
  const savedCallback = useRef<T>();
  const lastTimerId = useRef<NodeJS.Timeout>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (!activate) {
      return () => {
        onClear?.();
        if (lastTimerId.current) clearInterval(lastTimerId.current);
      };
    }

    function tick() {
      savedCallback.current?.();
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      lastTimerId.current = id;
      return () => {
        clearInterval(id);
        lastTimerId.current = undefined;
      };
    }
    return () => {
      return undefined;
    };
  }, [delay, activate]);
};

export default useInterval;
