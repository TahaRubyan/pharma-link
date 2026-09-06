/**
 * Token Bucket Rate Limiter & Circuit Breaker for Supabase Free Tier
 * Prevents HTTP 429 (Too Many Requests), connection pool exhaustion,
 * and seamlessly diverts requests to offline queue during traffic spikes.
 */

export class RateLimiter {
  constructor(options = {}) {
    // Free tier safe settings: 10 burst capacity, 4 requests per second refill
    this.bucketCapacity = options.bucketCapacity || 10;
    this.tokens = this.bucketCapacity;
    this.refillRate = options.refillRate || 4; // tokens per second
    this.lastRefill = Date.now();

    // Priority Queues: CRITICAL (POS checkout/payment) vs NORMAL (search/lookups)
    this.highPriorityQueue = [];
    this.normalPriorityQueue = [];
    this.isProcessing = false;

    // Circuit Breaker: 'CLOSED' (normal), 'OPEN' (tripped), 'HALF_OPEN' (testing)
    this.circuitState = 'CLOSED';
    this.consecutiveFailures = 0;
    this.maxFailuresBeforeTrip = options.maxFailuresBeforeTrip || 3;
    this.coolingPeriodMs = options.coolingPeriodMs || 15000; // 15s cooling
    this.circuitTrippedAt = null;

    // Listeners for status updates (e.g. UI badges)
    this.listeners = new Set();
  }

  // Refill tokens according to time elapsed
  refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    if (elapsedSeconds > 0) {
      const tokensToAdd = elapsedSeconds * this.refillRate;
      this.tokens = Math.min(this.bucketCapacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  // Check circuit breaker status
  checkCircuit() {
    if (this.circuitState === 'OPEN') {
      const now = Date.now();
      if (now - this.circuitTrippedAt >= this.coolingPeriodMs) {
        this.circuitState = 'HALF_OPEN';
        this.notifyListeners();
      }
    }
  }

  tripCircuit(reason = 'Rate limit 429 or network errors') {
    this.circuitState = 'OPEN';
    this.circuitTrippedAt = Date.now();
    console.warn(`[RateLimiter] ⚠️ Circuit breaker TRIPPED (${reason}). Switching to offline-safe fallback.`);
    this.notifyListeners();
  }

  resetCircuit() {
    this.circuitState = 'CLOSED';
    this.consecutiveFailures = 0;
    this.circuitTrippedAt = null;
    this.notifyListeners();
  }

  // Schedule an async task through the rate limiter
  async schedule(taskFn, priority = 'NORMAL') {
    this.checkCircuit();

    // If circuit is OPEN, immediately signal fallback so caller can route to local offline cache
    if (this.circuitState === 'OPEN') {
      const err = new Error('Circuit breaker is OPEN: Free tier rate limited or cooling down');
      err.code = 'CIRCUIT_OPEN';
      throw err;
    }

    return new Promise((resolve, reject) => {
      const queueItem = { taskFn, resolve, reject, priority, retries: 0 };
      if (priority === 'CRITICAL') {
        this.highPriorityQueue.push(queueItem);
      } else {
        this.normalPriorityQueue.push(queueItem);
      }
      this.processQueue();
    });
  }

  // Process queued tasks respecting token bucket and rate limits
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.highPriorityQueue.length > 0 || this.normalPriorityQueue.length > 0) {
        this.refill();
        this.checkCircuit();

        if (this.circuitState === 'OPEN') {
          // Reject remaining pending items with CIRCUIT_OPEN so they divert to offline queue
          const drain = (q) => {
            while (q.length > 0) {
              const item = q.shift();
              const err = new Error('Circuit breaker TRIPPED to OPEN during queue drain');
              err.code = 'CIRCUIT_OPEN';
              item.reject(err);
            }
          };
          drain(this.highPriorityQueue);
          drain(this.normalPriorityQueue);
          break;
        }

        if (this.tokens < 1) {
          // Wait for next token refill
          const delayMs = Math.ceil((1 - this.tokens) / this.refillRate * 1000);
          await new Promise((res) => setTimeout(res, Math.max(50, delayMs)));
          this.refill();
        }

        // Dequeue next task: High priority items take precedence
        const item = this.highPriorityQueue.length > 0 
          ? this.highPriorityQueue.shift() 
          : this.normalPriorityQueue.shift();

        if (!item) continue;

        this.tokens -= 1;
        this.notifyListeners();

        try {
          const result = await item.taskFn();
          if (this.circuitState === 'HALF_OPEN') {
            this.resetCircuit();
          } else {
            this.consecutiveFailures = 0;
          }
          item.resolve(result);
        } catch (err) {
          const isRateLimit = err?.status === 429 || (err?.message && err.message.includes('429'));
          if (isRateLimit) {
            this.tripCircuit('HTTP 429 Rate Limit Exceeded');
            err.code = 'CIRCUIT_OPEN';
            item.reject(err);
          } else {
            this.consecutiveFailures++;
            if (this.consecutiveFailures >= this.maxFailuresBeforeTrip) {
              this.tripCircuit(`${this.consecutiveFailures} consecutive network failures`);
            }
            // Auto retry with exponential backoff & jitter if retries < 2
            if (item.retries < 2) {
              item.retries++;
              const backoff = (item.retries * 200) + Math.floor(Math.random() * 100);
              await new Promise((res) => setTimeout(res, backoff));
              if (item.priority === 'CRITICAL') {
                this.highPriorityQueue.unshift(item);
              } else {
                this.normalPriorityQueue.unshift(item);
              }
            } else {
              item.reject(err);
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  // Diagnostics & Status
  getMetrics() {
    this.refill();
    return {
      tokens: Math.floor(this.tokens),
      capacity: this.bucketCapacity,
      queueLength: this.highPriorityQueue.length + this.normalPriorityQueue.length,
      highPriorityCount: this.highPriorityQueue.length,
      circuitState: this.circuitState,
      isThrottled: this.tokens < 2 || this.circuitState === 'OPEN',
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    const metrics = this.getMetrics();
    this.listeners.forEach((fn) => {
      try { fn(metrics); } catch {}
    });
  }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter;
