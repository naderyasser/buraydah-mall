/** علامة المول: نخلة داخل قوس نجدي — هوية بريدة (عاصمة التمور) بلا شعارات رسمية */
export default function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--brand)" />
      <path d="M8 11 L11 8 L14 11 L17 8 L20 11 L23 8 L26 11 L29 8 L32 11" fill="none" stroke="var(--sand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 33V19" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 20c-2-5-6-6-9-5 3 1 6 3 9 5Zm0 0c2-5 6-6 9-5-3 1-6 3-9 5Zm0-2c-3-3-4-7-2-10 1 3 2 6 2 10Zm0 0c3-3 4-7 2-10-1 3-2 6-2 10Zm0 1c-4-1-8 1-9 4 3-1 6-2 9-4Zm0 0c4-1 8 1 9 4-3-1-6-2-9-4Z" fill="#fff" />
      <path d="M12 33h16" stroke="var(--sand)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
