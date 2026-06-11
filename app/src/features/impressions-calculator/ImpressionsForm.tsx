'use client';

import { useMemo, useState } from 'react';
import { WARSAW_DISTRICTS } from './data/aadt-warsaw';
import { calculate, type CalculatorInput } from './lib/calculator';
import { formatPLN } from '@/lib/pricing';
import { sendToWebhook } from '@/lib/tracking/webhook';

const DEFAULT_INPUT: CalculatorInput = {
  districtIds: ['srodmiescie', 'mokotow'],
  numVehicles: 5,
  kmDailyPerVehicle: 100,
  months: 6,
};

function fmt(n: number): string {
  return n.toLocaleString('pl-PL');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Wszystkie dzielnice + skrót „cała Warszawa"
const ALL_DISTRICT_IDS = WARSAW_DISTRICTS.map(d => d.id);

export function ImpressionsForm() {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const result = useMemo(() => calculate(input), [input]);

  const allSelected = input.districtIds.length === ALL_DISTRICT_IDS.length;

  function toggleDistrict(id: string) {
    setInput(p => {
      const has = p.districtIds.includes(id);
      const next = has ? p.districtIds.filter(x => x !== id) : [...p.districtIds, id];
      return { ...p, districtIds: next };
    });
  }

  function toggleAll() {
    setInput(p => ({
      ...p,
      districtIds: allSelected ? [] : [...ALL_DISTRICT_IDS],
    }));
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || submitState === 'loading') return;

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
          // API przyjmuje pojedyncze districtId (text, max 64) — łączymy wybrane
          districtId: input.districtIds.join(',').slice(0, 64),
          numVehicles: input.numVehicles,
          kmDailyPerVehicle: input.kmDailyPerVehicle,
          months: input.months,
          budgetMonthlyPLN: result.recommendedPackage.monthlyPLN,
          impressionsTotal: result.impressionsTotal,
        }),
      });
      if (res.ok) {
        sendToWebhook('lead_kalkulator', {
          email: trimmedEmail,
          company: company.trim() || null,
          phone: phone.trim() || null,
          dzielnice: input.districtIds.join(','),
          pojazdy: input.numVehicles,
          km_dziennie: input.kmDailyPerVehicle,
          miesiace: input.months,
          wyswietlenia: result.impressionsTotal,
          pakiet: result.recommendedPackage.name,
        });
      }
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

        {/* Dzielnice — multi-select */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[#A0AEC0]">
              Dzielnice Warszawy{' '}
              <span className="text-[#4A5568] font-normal">
                ({input.districtIds.length} wybrano)
              </span>
            </label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-[#FF6B35] hover:text-[#FF9A35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF6B35] rounded px-1"
            >
              {allSelected ? 'Wyczyść' : 'Cała Warszawa'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
            {WARSAW_DISTRICTS.map(d => {
              const checked = input.districtIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDistrict(d.id)}
                  aria-pressed={checked}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF6B35] ${
                    checked
                      ? 'bg-[#FF6B35]/15 border-[#FF6B35]/50 text-[#E6EDF3]'
                      : 'bg-[#0A0D12] border-[#1E2A38] text-[#718096] hover:border-[#FF6B35]/40'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${
                      checked ? 'bg-[#FF6B35] text-white' : 'border border-[#4A5568]'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span className="truncate">{d.name}</span>
                </button>
              );
            })}
          </div>
          {input.districtIds.length === 0 && (
            <p className="text-[#FC8181] text-xs mt-2">Wybierz min. jedną dzielnicę.</p>
          )}
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

        {/* Km dziennie 20–200 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-[#A0AEC0]">Km dziennie / pojazd</label>
            <span className="text-sm font-bold text-[#FF6B35]">{input.kmDailyPerVehicle} km</span>
          </div>
          <input
            type="range" min={20} max={200} step={5}
            value={input.kmDailyPerVehicle}
            onChange={e => setInput(p => ({ ...p, kmDailyPerVehicle: Number(e.target.value) }))}
            className="w-full accent-[#FF6B35]"
          />
          <div className="flex justify-between text-xs text-[#4A5568] mt-1">
            <span>20 km</span><span>200 km</span>
          </div>
        </div>

        {/* Czas kampanii — suwak 6–24 mies. */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-[#A0AEC0]">Czas kampanii</label>
            <span className="text-sm font-bold text-[#FF6B35]">
              {input.months} mies.{input.months >= 12 ? ` (${(input.months / 12).toFixed(input.months % 12 === 0 ? 0 : 1)} ${input.months >= 24 ? 'lata' : 'rok'})` : ''}
            </span>
          </div>
          <input
            type="range" min={6} max={24} step={1}
            value={input.months}
            onChange={e => setInput(p => ({ ...p, months: Number(e.target.value) }))}
            className="w-full accent-[#FF6B35]"
          />
          <div className="flex justify-between text-xs text-[#4A5568] mt-1">
            <span>6 mies.</span><span>24 mies.</span>
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
                  Szacowany efekt kampanii
                </p>
                <span className="text-xs text-[#4A5568] bg-[#0A0D12] border border-[#1E2A38] px-2.5 py-1 rounded-full">
                  {result.districts.length === 1 ? result.districts[0]?.name : `${result.districts.length} dzielnic`}
                </span>
              </div>

              <div className="space-y-5">
                <Stat
                  label="Wyświetlenia miesięcznie"
                  value={fmt(result.impressionsMonthly)}
                  accent
                />
                <Stat
                  label={`Wyświetlenia łącznie (${input.months} mies.)`}
                  value={fmt(result.impressionsTotal)}
                  large
                  accent
                />

                {/* Nowe metryki: zapamiętywalność + klienci */}
                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[#1E2A38]">
                  <Stat
                    label="Wzrost zapamiętywalności marki"
                    value={`+${result.brandRecallLiftPct}%`}
                    sub="w obszarze kampanii"
                  />
                  <Stat
                    label="Szacowani nowi klienci"
                    value={`~${fmt(result.estimatedNewClients)}`}
                    sub="z ekspozycji kampanii"
                  />
                </div>

                <div className="pt-5 border-t border-[#1E2A38]">
                  <Stat
                    label={`Średni CPM (pakiet ${result.recommendedPackage.marketingName})`}
                    value={`${result.cpmPLN.toFixed(2)} zł`}
                    sub={`Cennik: ${formatPLN(result.recommendedPackage.monthlyPLN)}/mies. · bez kosztów oklejania`}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-[#4A5568] px-1 leading-relaxed">
              Metodologia: dane natężenia ruchu GDDKiA 2023 dla dzielnic Warszawy.
              Współczynnik widoczności 0,15. Zapamiętywalność i liczba klientów to szacunki
              oparte na unikalnym zasięgu (40% kontaktów) i konserwatywnych współczynnikach
              recall/konwersji — wartości orientacyjne, nie gwarancja wyniku.
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

        {!result && (
          <div className="bg-[#111720] rounded-2xl border border-[#1E2A38] p-8 text-center">
            <div className="text-3xl mb-3">🗺️</div>
            <p className="text-[#A0AEC0] font-medium">Wybierz dzielnice</p>
            <p className="text-sm text-[#4A5568] mt-1">
              Zaznacz min. jedną dzielnicę, aby zobaczyć szacowany zasięg kampanii.
            </p>
          </div>
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
