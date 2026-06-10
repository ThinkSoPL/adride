// =============================================================================
// AdRide GPS Tracking — typowany event emitter (wewnętrzny singleton)
// =============================================================================

import type { TrackingEventMap } from './types';

type Listener<T> = (data: T) => void;

/** Lekki typowany event emitter — brak zależności zewnętrznych */
class TypedEmitter<TEvents extends Record<string, unknown>> {
  private readonly listeners = new Map<string, Set<Listener<unknown>>>();

  /** Subskrybuje zdarzenie; zwraca funkcję odsubskrybowania */
  on<K extends keyof TEvents & string>(
    event: K,
    listener: Listener<TEvents[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as Listener<unknown>);
    return () => set.delete(listener as Listener<unknown>);
  }

  /** Emituje zdarzenie do wszystkich aktywnych listenerów */
  emit<K extends keyof TEvents & string>(event: K, data: TEvents[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  /** Usuwa wszystkich listenerów (przydatne przy teardown) */
  removeAll(): void {
    this.listeners.clear();
  }
}

/** Singleton event bus współdzielony przez tracking-service, hooki i background task */
export const trackingEmitter = new TypedEmitter<TrackingEventMap>();
