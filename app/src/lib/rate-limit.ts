import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rozproszony rate limiting oparty o Upstash Redis.
 *
 * Na Vercel (serverless) każda instancja ma własną pamięć, więc rate limit
 * trzymany w `Map` jest nieskuteczny — limit resetuje się przy każdym cold
 * starcie i nie współdzieli stanu między instancjami. Upstash Redis daje
 * współdzielony, trwały licznik.
 *
 * Jeśli zmienne UPSTASH_* nie są ustawione, moduł degraduje się gracefully
 * do limitu in-memory (przydatne w dev / na pojedynczym serwerze PM2).
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

type LimitResult = { success: boolean; remaining: number }

// --- Wariant Upstash (produkcja rozproszona) ---------------------------------
let upstashLimiter: Ratelimit | null = null
if (UPSTASH_URL && UPSTASH_TOKEN) {
  const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 żądań / godzinę
    prefix: 'adride:leads',
    analytics: false,
  })
}

// --- Fallback in-memory (dev / single-instance) ------------------------------
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const memoryMap = new Map<string, { count: number; resetAt: number }>()

function memoryLimit(key: string): LimitResult {
  const now = Date.now()
  const entry = memoryMap.get(key)

  if (!entry || now > entry.resetAt) {
    memoryMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { success: true, remaining: RATE_LIMIT_MAX - 1 }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { success: false, remaining: 0 }
  }
  entry.count++
  return { success: true, remaining: RATE_LIMIT_MAX - entry.count }
}

/**
 * Sprawdza i zużywa jeden token dla danego klucza (zwykle IP).
 * Zwraca `success: false` gdy limit przekroczony.
 */
export async function checkLeadsRateLimit(key: string): Promise<LimitResult> {
  if (upstashLimiter) {
    try {
      const { success, remaining } = await upstashLimiter.limit(key)
      return { success, remaining }
    } catch (err) {
      // Awaria Redis nie może blokować realnych użytkowników — degraduj do in-memory
      console.error('[rate-limit] Upstash error, falling back to memory:', err)
      return memoryLimit(key)
    }
  }
  return memoryLimit(key)
}

/** True gdy aktywny jest rozproszony limiter (do logów / health-check). */
export const isDistributedRateLimit = upstashLimiter !== null
