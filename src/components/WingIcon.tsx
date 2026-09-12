/** أيقونات خطّية بسيطة للأقسام الستة — كصفّ أقسام حراج: الأيقونة تُقرأ قبل الكلمة */
const ICONS: Record<string, React.ReactNode> = {
  all: <><circle cx="5" cy="5" r="2.2" /><circle cx="12" cy="5" r="2.2" /><circle cx="19" cy="5" r="2.2" /><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" /><circle cx="5" cy="19" r="2.2" /><circle cx="12" cy="19" r="2.2" /><circle cx="19" cy="19" r="2.2" /></>,
  gold: <><path d="M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" /><path d="M9 7l1.5-4h3L15 7" /><path d="M8.5 3h7" /></>,
  watches: <><circle cx="12" cy="12" r="6.5" /><path d="M12 8.5V12l2.5 1.5" /><path d="M9 5.5 9.6 2h4.8l.6 3.5M9 18.5l.6 3.5h4.8l.6-3.5" /></>,
  bags: <><path d="M4 9h16l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H6.7a1.5 1.5 0 0 1-1.5-1.3L4 9Z" /><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" /></>,
  fabrics: <><path d="M3 7c3-2 6-2 9 0s6 2 9 0M3 12c3-2 6-2 9 0s6 2 9 0M3 17c3-2 6-2 9 0s6 2 9 0" /></>,
  clothing: <><path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0Z" /></>,
  stores: <><path d="M3 10 5 4h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v9h14v-9M10 21v-6h4v6" /></>,
  restaurants: <><path d="M6 3v8a3 3 0 0 0 3 3v7M9 3v8M12 3v8" /><path d="M18 3c-2 0-3 3-3 7h3v11" /></>,
  pharmacies: <><rect x="4" y="6" width="16" height="14" rx="3" /><path d="M12 10v6M9 13h6" /><path d="M9 6V4h6v2" /></>,
  beauty: <><path d="M12 3c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10Z" /><path d="M9 21h6" /></>,
  clinics: <><path d="M4 21V9l8-5 8 5v12" /><path d="M12 11v6M9 14h6" /><path d="M9 21v-4h6v4" /></>,
  electronics: <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M10 18h4" /><path d="M9 3.5h6" /></>,
  home: <><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-6h4v6" /></>,
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
