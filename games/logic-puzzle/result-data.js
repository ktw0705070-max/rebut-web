"use strict";

(() => {
  const STORAGE_KEY = "rebut.logic-puzzle.result.v1";
  const ROUND_COUNT = 9;

  // This measures this run only; time and retries do not lower the accuracy score.
  class RunMetrics {
    constructor(now = () => (window.RebutGameClock?.now() ?? performance.now())) {
      this.now = now;
      this.rounds = new Map();
      this.current = null;
      this.activeSince = null;
    }

    enterRound(id) {
      this.setActive(false);
      if (!this.rounds.has(id)) {
        this.rounds.set(id, { elapsedMs: 0, retryCount: 0, lastOrder: null, completed: false });
      }
      // Restarting a problem keeps its elapsed time, wrong answers and last order.
      this.current = this.rounds.get(id);
    }

    setActive(active) {
      if (this.activeSince !== null) {
        this.current.elapsedMs += Math.max(0, this.now() - this.activeSince);
        this.activeSince = null;
      }
      if (active && this.current && !this.current.completed) this.activeSince = this.now();
    }

    recordAnswer(order, correct) {
      const round = this.current;
      if (!round || round.completed) return;
      const signature = JSON.stringify(order);
      // Re-dropping the same full arrangement is not a new attempt.
      if (signature === round.lastOrder) return;
      round.lastOrder = signature;
      if (!correct) {
        round.retryCount += 1;
        return;
      }
      this.setActive(false);
      round.firstAttemptCorrect = round.retryCount === 0;
      round.completed = true;
    }

    snapshot() {
      const completed = [...this.rounds.values()].filter(round => round.completed);
      return {
        completedRounds: completed.length,
        firstAttemptCorrectRounds: completed.filter(round => round.firstAttemptCorrect).length,
        reactionTimesMs: completed.map(round => round.elapsedMs),
        retryCount: [...this.rounds.values()].reduce((sum, round) => sum + round.retryCount, 0),
      };
    }
  }

  function summarize(result) {
    if (!result || result.completedRounds !== ROUND_COUNT ||
        !Number.isInteger(result.firstAttemptCorrectRounds) ||
        result.firstAttemptCorrectRounds < 0 || result.firstAttemptCorrectRounds > ROUND_COUNT ||
        !Number.isInteger(result.retryCount) || result.retryCount < 0 ||
        !Array.isArray(result.reactionTimesMs) || result.reactionTimesMs.length !== ROUND_COUNT ||
        !result.reactionTimesMs.every(value => Number.isFinite(value) && value >= 0)) return null;
    return {
      accuracy: Math.round(result.firstAttemptCorrectRounds / ROUND_COUNT * 100),
      time: result.reactionTimesMs.reduce((sum, value) => sum + value, 0) / ROUND_COUNT / 1000,
      retry: result.retryCount,
    };
  }

  function read() {
    try { return summarize(JSON.parse(sessionStorage.getItem(STORAGE_KEY))); }
    catch { return null; }
  }

  function save(result) {
    if (!summarize(result)) return false;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result)); return true; }
    catch { return false; }
  }

  function clear() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Private storage may be unavailable. */ }
  }

  window.RebutLogicResults = Object.freeze({ RunMetrics, summarize, read, save, clear, STORAGE_KEY });
})();
