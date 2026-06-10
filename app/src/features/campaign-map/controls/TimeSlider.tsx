'use client';

import { useEffect, useRef } from 'react';
import { useMapStore } from '../store';

const HOURS = Array.from({ length: 25 }, (_, i) => i);

export function TimeSlider() {
  const timeOfDay = useMapStore((s) => s.filters.timeOfDay);
  const setTimeOfDay = useMapStore((s) => s.setTimeOfDay);
  const isPlaying = useMapStore((s) => s.isPlaying);
  const setIsPlaying = useMapStore((s) => s.setIsPlaying);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Animacja "playback" — przesuwa okno czasowe co ~400ms
  useEffect(() => {
    if (!isPlaying) return;

    const tick = (now: number) => {
      if (now - lastTickRef.current > 400) {
        lastTickRef.current = now;
        const [from, to] = useMapStore.getState().filters.timeOfDay;
        const width = Math.max(1, to - from);
        let nextFrom = from + 1;
        let nextTo = nextFrom + width;
        if (nextTo > 24) {
          nextFrom = 0;
          nextTo = width;
        }
        setTimeOfDay([nextFrom, nextTo]);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, setTimeOfDay]);

  const [from, to] = timeOfDay;

  return (
    <div className="absolute bottom-6 left-1/2 z-10 w-[640px] max-w-[90vw] -translate-x-1/2 rounded-lg border border-panel-border bg-panel-bg p-3 shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-white/60">
          Godzina dnia
        </span>
        <span className="font-mono text-adride-orange">
          {String(from).padStart(2, '0')}:00 – {String(to).padStart(2, '0')}:00
        </span>
      </div>

      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-adride-orange text-black transition-transform hover:scale-105"
          aria-label={isPlaying ? 'Pauza' : 'Odtwarzaj'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="relative flex-1 py-2">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/10" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-adride-orange"
            style={{
              left: `${(from / 24) * 100}%`,
              right: `${100 - (to / 24) * 100}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={from}
            onChange={(e) => {
              const v = Math.min(Number(e.target.value), to - 1);
              setTimeOfDay([v, to]);
            }}
            className="absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent accent-adride-orange"
            aria-label="Godzina od"
          />
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={to}
            onChange={(e) => {
              const v = Math.max(Number(e.target.value), from + 1);
              setTimeOfDay([from, v]);
            }}
            className="absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent accent-adride-orange"
            aria-label="Godzina do"
          />
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-white/40">
        {HOURS.filter((h) => h % 4 === 0).map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}</span>
        ))}
      </div>
    </div>
  );
}
