import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { ImpressionsForm } from '@/features/impressions-calculator/ImpressionsForm';

export const metadata: Metadata = {
  title: 'Kalkulator Zasięgu Reklamy Samochodowej | AdRide',
  description:
    'Oblicz ile osób zobaczy Twoją reklamę na samochodach w Warszawie. Sprawdź CPM i zasięg kampanii w wybranej dzielnicy. Dane GDDKiA 2023.',
};

export default function KalkulatorPage() {
  return (
    <main className="min-h-screen bg-[#0A0D12] text-[#E6EDF3]">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
            <span className="text-[#FF6B35] text-sm font-medium">Narzędzie bezpłatne</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            Kalkulator zasięgu<br />
            <span className="text-[#FF6B35]">reklamy samochodowej</span>
          </h1>

          <p className="text-[#718096] text-lg max-w-2xl leading-relaxed">
            Sprawdź, ile osób zobaczy Twoją reklamę na samochodach w Warszawie.
            Wybierz dzielnice, flotę i czas kampanii — wynik pojawia się od razu.
          </p>
        </div>

        <ImpressionsForm />
      </div>
    </main>
  );
}
