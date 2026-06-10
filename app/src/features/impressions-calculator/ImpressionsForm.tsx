'use client';

import { useMemo, useState } from 'react';
import { WARSAW_DISTRICTS } from './data/aadt-warsaw';
import { calculate, type CalculatorInput } from './lib/calculator';

const DEFAULT_INPUT: CalculatorInput = {
  districtId: 'srodmiescie',
  numVehicles: 5,
  kmDailyPerVehicle: 150,
  months: 3,
  budgetMonthlyPLN: null,
};

const MONTH_OPTIONS = [1, 3, 6, 12] as const;

function fmt(n: number): string {
  return n.toLocaleString('pl-PL');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ImpressionsForm() {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const result = useMemo(() => calculate(input), [input]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || submitState === 'loading') return;

    // Client-side email validation
    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Podaj poprawny adres email');
      return;
    }
    setEmailError(null);

    setSubmitState('loading');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          company: company.trim() || null,
          phone: phone.trim() || null,
          districtId: input.districtId,
          numVehicles: input.numVehicles,
          kmDailyPerVehicle: input.kmDailyPerVehicle,
          months: input.months,
          budgetMonthlyPLN: input.budgetMonthlyPLN,
          impressionsTotal: result.impressionsTotal,
        }),
      });
      setSubmitState(res.ok ? 'success' : 'error');
    } catch {
      setSubmitState('error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Inputs ── */}
      <div className="bg-[#111720] rounded-2xl border border-[#1E2A38] p-6 space-y-6">
        <p className="text-xs font-bold text-[#4A5568] uppercase tracking-wider">
          Parametry kampanii
        </p>

        {/* Dzielnica */}
        <div>
          <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
            Dzielnica Warszawy
          </label>
          <select
            value={input.districtId}
            onChange={e => setInput(p => ({ ...p, districtId: e.target.value }))}
            className="w-full bg-[#0A0D12] border border-[#1E2A38] rounded-lg px-4 py-3 text-[#E6EDF3] focus:border-[#FF6B35] focus:outline-none"
          >
            {WARSAW_DISTRICTS.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Liczba pojazdów */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-[#A0AEC0]">Liczba pojazdów</label>
            <span className="text-sm font-bold text-[#FF6B35]">{input.numVehicles}</span>
          </div>
          <input
            type="range" min={1} max={50} step={1}
            value={input.numVehicles}
            onChange={e => setInput(p => ({ ...p, numVehicles: Number(e.target.value) }))}
            className="w-full accent-[#FF6B35]"
          />
          <div className="flex justify-between text-xs text-[#4A5568] mt-1">
            <span>1</span><span>50</span>
          </div>
        </div>

        {/* Km dziennie */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-[#A0AEC0]">Km dziennie / pojazd</label>
            <span className="text-sm font-bold text-[#FF6B35]">{input.kmDailyPerVehicle} km</span>
          </div>
          <input
            type="range" min={30} max={400} step={10}
            value={input.kmDailyPerVehicle}
            onChange={e => setInput(p => ({ ...p, kmDailyPerVehicle: Number(e.target.value) }))}
            className="w-full accent-[#FF6B35]"
          />
          <div className="flex justify-between text-xs text-[#4A5568] mt-1">
            <span>30 km</span><span>400 km</span>
          </div>
        </div>

        {/* Czas kampanii */}
        <div>
          <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
            Czas kampanii
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MONTH_OPTIONS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setInput(p => ({ ...p, months: m }))}
                className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  input.months === m
                    ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                    : 'bg-[#0A0D12] border-[#1E2A38] text-[#718096] hover:border-[#FF6B35] hover:text-[#E6EDF3]'
                }`}
              >
                {m === 12 ? '1 rok' : `${m} mies.`}
              </button>
            ))}
          </div>
        </div>

        {/* Budżet (opcjonalny) */}
        <div>
          <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
            Budżet miesięczny{' '}
            <span className="text-[#4A5568] font-normal">(opcjonalny — do wyliczenia CPM)</span>
          </label>
          <div className="relative">
            <input
              type="number" min={0} step={100}
              placeholder="np. 5 000"
              value={input.budgetMonthlyPLN ?? ''}
              onChange={e =>
                setInput(p => ({
                  ...p,
                  budgetMonthlyPLN: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full bg-[#0A0D12] border border-[#1E2A38] rounded-lg px-4 py-3 text-[#E6EDF3] pr-16 focus:border-[#FF6B35] focus:outline-none"
            />
            <span className="absolute right-4 top-3.5 text-[#718096] text-sm">PLN</span>
          </div>
        </div>
      </div>

      {/* ── Results + Lead capture ── */}
      <div className="space-y-4">
        {result && (
          <>
            {/* Results card */}
            <div className="bg-[#111720] rounded-2xl border border-[#1E2A38] p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-bold text-[#4A5568] uppercase tracking-wider">
                  Szacowany zasięg
                </p>
                <span className="text-xs text-[#4A5568] bg-[#0A0D12] border border-[#1E2A38] px-2.5 py-1 rounded-full">
                  {result.district.zone}
                </span>
              </div>

              <div className="space-y-5">
                <Stat
                  label="Impressions dziennie"
                  value={fmt(result.impressionsDaily)}
                  sub={`${fmt(result.impressionsPerVehicleDaily)} / pojazd`}
                />
                <Stat
                  label="Impressions miesięcznie"
                  value={fmt(result.impressionsMonthly)}
                  accent
                />
                {input.months > 1 && (
                  <Stat
                    label={`Łącznie (${input.months} ${input.months === 12 ? 'miesięcy / rok' : 'miesiące'})`}
                    value={fmt(result.impressionsTotal)}
                    large
                    accent
                  />
                )}

                {result.cpmPLN !== null && (
                  <div className="pt-5 border-t border-[#1E2A38]">
                    <Stat
                      label="CPM (koszt 1 000 wyświetleń)"
                      value={`${result.cpmPLN.toFixed(2)} zł`}
                      sub="Benchmark reklamy OOH w Polsce: 2–8 zł CPM"
                    />
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-[#4A5568] px-1 leading-relaxed">
              Metodologia: dane natężenia ruchu GDDKiA 2023 dla dzielnic Warszawy.
              Współczynnik widoczności 0,15 (15% pojazdów mija reklamowany samochód w zasięgu wzroku).
            </p>

            {/* Lead capture */}
            <div className="bg-[#111720] rounded-2xl border border-[#FF6B35]/20 p-6">
              <h3 className="text-base font-bold text-[#E6EDF3] mb-1">
                Pobierz szczegółowy raport
              </h3>
              <p className="text-sm text-[#718096] mb-4">
                Wyślemy Ci pełną analizę z mapą zasięgu, benchmarkami CPM i przykładowymi kampaniami.
              </p>

              {submitState === 'success' ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-3">✓</div>
                  <p className="text-[#48BB78] font-semibold">Raport zostanie wysłany wkrótce!</p>
                  <p className="text-sm text-[#718096] mt-1">Sprawdź skrzynkę email.</p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3" noValidate>
                  <div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Email firmowy *"
                      aria-label="Email firmowy"
                      aria-invalid={emailError ? 'true' : 'false'}
                      aria-describedby={emailError ? 'email-error' : undefined}
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      className={`w-full bg-[#0A0D12] border rounded-lg px-4 py-3 text-[#E6EDF3] placeholder-[#4A5568] focus:outline-none text-sm ${
                        emailError ? 'border-[#FC8181]' : 'border-[#1E2A38] focus:border-[#FF6B35]'
                      }`}
                    />
                    {emailError && (
                      <p id="email-error" className="text-[#FC8181] text-xs mt-1.5">
                        {emailError}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nazwa firmy"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      className="w-full bg-[#0A0D12] border border-[#1E2A38] rounded-lg px-4 py-3 text-[#E6EDF3] placeholder-[#4A5568] focus:border-[#FF6B35] focus:outline-none text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Telefon"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#0A0D12] border border-[#1E2A38] rounded-lg px-4 py-3 text-[#E6EDF3] placeholder-[#4A5568] focus:border-[#FF6B35] focus:outline-none text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitState === 'loading'}
                    className="w-full bg-[#FF6B35] hover:bg-[#FF9A35] disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    {submitState === 'loading' ? 'Wysyłanie…' : 'Pobierz raport →'}
                  </button>
                  {submitState === 'error' && (
                    <p className="text-[#FC8181] text-sm text-center">
                      Wystąpił błąd. Spróbuj ponownie.
                    </p>
                  )}
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent = false,
  large = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-[#718096]">{label}</p>
      <p
        className={`font-bold mt-0.5 ${large ? 'text-3xl' : 'text-2xl'} ${
          accent ? 'text-[#FF6B35]' : 'text-[#E6EDF3]'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[#4A5568] mt-0.5">{sub}</p>}
    </div>
  );
}
