/** أيقونات خطّية بسيطة للأقسام الستة — كصفّ أقسام حراج: الأيقونة تُقرأ قبل الكلمة */
const ICONS: Record<string, React.ReactNode> = {
  all: <><circle cx="5" cy="5" r="2.2" /><circle cx="12" cy="5" r="2.2" /><circle cx="19" cy="5" r="2.2" /><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" /><circle cx="5" cy="19" r="2.2" /><circle cx="12" cy="19" r="2.2" /><circle cx="19" cy="19" r="2.2" /></>,
  gold: <><path d="M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" /><path d="M9 7l1.5-4h3L15 7" /><path d="M8.5 3h7" /></>,
  watches: <><circle cx="12" cy="12" r="6.5" /><path d="M12 8.5V12l2.5 1.5" /><path d="M9 5.5 9.6 2h4.8l.6 3.5M9 18.5l.6 3.5h4.8l.6-3.5" /></>,
  bags: <><path d="M4 9h16l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H6.7a1.5 1.5 0 0 1-1.5-1.3L4 9Z" /><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" /></>,
  fabrics: <><path d="M3 7c3-2 6-2 9 0s6 2 9 0M3 12c3-2 6-2 9 0s6 2 9 0M3 17c3-2 6-2 9 0s6 2 9 0" /></>,
  clothing: <><path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0Z" /></>,
  stores: <><path d="M3 10 5 4h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v9h14v-9M10 21v-6h4v6" /></>,
  dresses: <><path d="M9 3h6l-1 5 4 12H6L10 8 9 3Z" /><path d="M10 8h4" /></>,
};

export default function WingIcon({ slug, size = 26 }: { slug: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[slug] ?? ICONS.all}
    </svg>
  );
}
