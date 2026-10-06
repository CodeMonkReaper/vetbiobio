import Link from 'next/link';
import { SearchBar } from '@/features/search/SearchBar';
import { Card } from '@/components/ui/display';

const POPULAR = [
  { label: 'Consultas', href: '/veterinarias?service=consulta-general' },
  { label: 'Vacunación', href: '/veterinarias?service=vacunacion' },
  { label: 'Cirugía', href: '/veterinarias?service=cirugia-general' },
  { label: 'Radiografía', href: '/veterinarias?exam=radiografia' },
  { label: 'Ecografía', href: '/veterinarias?exam=ecografia' },
  { label: 'Urgencias', href: '/veterinarias?emergency=true' },
];

const COMMUNES = [
  { label: 'Concepción', href: '/veterinarias?commune=concepcion' },
  { label: 'Talcahuano', href: '/veterinarias?commune=talcahuano' },
  { label: 'San Pedro de la Paz', href: '/veterinarias?commune=san-pedro-de-la-paz' },
  { label: 'Los Ángeles', href: '/veterinarias?commune=los-angeles' },
];

export default function Home() {
  return (
    <main className="space-y-10">
      <section className="space-y-4 pt-6 text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Encuentra una veterinaria en el Biobío</h1>
        <p className="mx-auto max-w-xl text-ink-soft">
          Busca veterinarias, servicios, especialistas y exámenes con información verificada.
        </p>
        <div className="mx-auto max-w-2xl text-left">
          <SearchBar />
        </div>
      </section>

      <section aria-labelledby="servicios-populares" className="space-y-3">
        <h2 id="servicios-populares" className="text-xl font-semibold">Servicios populares</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {POPULAR.map((s) => (
            <li key={s.label}>
              <Link href={s.href}>
                <Card className="px-4 py-3 text-center font-medium text-brand-800 hover:border-brand-400">
                  {s.label}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="comunas" className="space-y-3">
        <h2 id="comunas" className="text-xl font-semibold">Explora por comuna</h2>
        <ul className="flex flex-wrap gap-2">
          {COMMUNES.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="inline-block rounded-full border border-slate-300 bg-white px-4 py-1.5 hover:border-brand-500">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
