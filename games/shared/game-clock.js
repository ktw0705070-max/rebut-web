// Only gameplay opts into this clock; browser/UI timers keep their normal clock.
(() => {
  if (window.RebutGameClock) return;
  const native = {
    now: () => performance.now(),
    timeout: window.setTimeout.bind(window),
    clear: window.clearTimeout.bind(window),
    frame: window.requestAnimationFrame.bind(window),
    cancel: window.cancelAnimationFrame.bind(window),
  };
  const timers = new Set(), frames = new Set(), reasons = new Set();
  let pausedAt = null, pausedTotal = 0;
  const now = () => (pausedAt ?? native.now()) - pausedTotal;
  const armTimer = job => {
    job.handle = native.timeout(() => {
      timers.delete(job);
      job.callback(...job.args);
    }, Math.max(0, job.deadline - now()));
  };
  const armFrame = job => {
    job.handle = native.frame(() => {
      frames.delete(job);
      job.callback(now());
    });
  };
  window.RebutGameClock = Object.freeze({
    now,
    get paused() { return reasons.size > 0; },
    setTimeout(callback, delay = 0, ...args) {
      const job = { callback, args, deadline: now() + Math.max(0, Number(delay) || 0) };
      timers.add(job);
      if (!reasons.size) armTimer(job);
      return job;
    },
    clearTimeout(job) {
      if (timers.delete(job)) native.clear(job.handle);
      else if (typeof job === "number") native.clear(job);
    },
    requestAnimationFrame(callback) {
      const job = { callback };
      frames.add(job);
      if (!reasons.size) armFrame(job);
      return job;
    },
    cancelAnimationFrame(job) {
      if (frames.delete(job)) native.cancel(job.handle);
      else if (typeof job === "number") native.cancel(job);
    },
    pause(reason = "book") {
      if (reasons.has(reason)) return;
      if (!reasons.size) {
        pausedAt = native.now();
        timers.forEach(job => native.clear(job.handle));
        frames.forEach(job => native.cancel(job.handle));
      }
      reasons.add(reason);
    },
    resume(reason = "book") {
      if (!reasons.delete(reason) || reasons.size) return;
      pausedTotal += native.now() - pausedAt;
      pausedAt = null;
      timers.forEach(armTimer);
      frames.forEach(armFrame);
    },
  });
})();
