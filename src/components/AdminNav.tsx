import { BarChart3, CalendarDays, FileText } from 'lucide-react';

type AdminSection = 'events' | 'bulletins' | 'procesverbal' | 'metrics';

type AdminNavProps = {
  active: AdminSection;
};

const items = [
  {
    id: 'events',
    href: '/admin/events',
    label: 'Événements',
    icon: CalendarDays,
  },
  {
    id: 'bulletins',
    href: '/admin/bulletins',
    label: 'Bulletins',
    icon: FileText,
  },
  {
    id: 'procesverbal',
    href: '/admin/proces-verbaux',
    label: 'Procès-verbaux',
    icon: FileText,
  },
  {
    id: 'metrics',
    href: '/admin/metrics',
    label: 'Statistiques',
    icon: BarChart3,
  },
] as const;

export default function AdminNav({ active }: AdminNavProps) {
  return (
    <nav className="mt-4 space-y-2 border-b border-slate-200 pb-4">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;

        return (
          <a
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
              selected
                ? 'border-blue-700 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
