// Single shared 1-second heartbeat for the whole app.
// Components subscribe instead of each creating its own setInterval, so there is
// exactly one interval at a time and no duplicate timers / memory leaks.

const listeners = new Set();
let intervalId = null;

function ensureStarted() {
  if (intervalId === null) {
    intervalId = setInterval(() => {
      const now = Date.now();
      listeners.forEach((fn) => {
        try {
          fn(now);
        } catch {
          /* listener errors must not break the heartbeat */
        }
      });
    }, 1000);
  }
}

function stopIfIdle() {
  if (listeners.size === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// Subscribes to a 1s tick. Returns an unsubscribe function.
export function subscribeNow(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  ensureStarted();
  return () => {
    listeners.delete(fn);
    stopIfIdle();
  };
}
