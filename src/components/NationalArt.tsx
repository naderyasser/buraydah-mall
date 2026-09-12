/**
 * عناصر رسومية للافتة اليوم الوطني — كلها SVG مضمّن بلا أصول خارجية:
 * فارس بعلم على حصان (صورة ظلّية)، نخيل، درع بنخلة (لا شعار الدولة الرسمي).
 */
export function RiderFlag({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 260 220" aria-hidden="true">
      <defs>
        <linearGradient id="ndxFlag" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1B7A48" /><stop offset="1" stopColor="#0B4A30" />
        </linearGradient>
        <linearGradient id="ndxSil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A3A2B" /><stop offset="1" stopColor="#031C14" />
        </linearGradient>
      </defs>
      {/* العلم */}
      <path d="M150 22c18-10 34-4 52 0s34 8 50-2v46c-16 10-32 6-50 2s-34-8-52 0Z" fill="url(#ndxFlag)" />
      <path d="M162 40c14-6 28-2 42 1s28 6 40-1" stroke="#F6EFD9" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".9" />
      <path d="M170 52h60" stroke="#F6EFD9" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <rect x="146" y="14" width="4" height="120" rx="2" fill="#E5C77F" />
      {/* الفارس */}
      <circle cx="128" cy="70" r="9.5" fill="url(#ndxSil)" />
      <path d="M117 66c3-9 19-9 22 0l-1 6c-6-3-14-3-20 0Z" fill="url(#ndxSil)" />
      <path d="M116 80c7-5 18-5 25 0l6 22c1 6-3 10-9 10h-19c-6 0-10-4-9-10Z" fill="url(#ndxSil)" />
      <path d="M139 84l8 18c1 3-1 6-4 5l-9-16Z" fill="url(#ndxSil)" />
      <path d="M118 98l-8 26 6 2 10-24Z" fill="url(#ndxSil)" />
      {/* الحصان: رقبة ورأس، جذع، أرجل في عدوٍ، ذيل */}
      <path d="M176 104c10-6 22-2 30 8l12 14-7 5-11-12c-4 6-10 8-16 6Z" fill="url(#ndxSil)" />
      <path d="M198 104l14-6 4 6-12 8Z" fill="url(#ndxSil)" />
      <path d="M78 122c8-16 30-22 58-20 18 1 34 2 44 6 8 3 8 14 0 18-14 6-36 8-58 6-22-2-38-2-44-10Z" fill="url(#ndxSil)" />
      <path d="M78 120c-14-2-26 6-40 22l6 4c10-12 20-16 34-16Z" fill="url(#ndxSil)" />
      <path d="M96 132l-16 30 8 4 18-30Zm26 2-4 34h9l6-32Zm42-4 12 30 8-3-12-30Zm-14 2 2 32h-9l-4-32Z" fill="url(#ndxSil)" />
      <path d="M40 166c30-1 60 3 90 5s60-3 90-1" stroke="#C8A45D" strokeWidth="1.5" opacity=".35" fill="none" />
    </svg>
  );
}

export function Palms({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 200" aria-hidden="true" fill="currentColor">
      <path d="M60 200V96" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M60 100c-14-24-38-30-58-24 20 3 40 12 58 24Zm0 0c14-24 38-30 58-24-20 3-40 12-58 24Zm0-6c-20-12-28-34-18-52 5 18 12 34 18 52Zm0 0c20-12 28-34 18-52-5 18-12 34-18 52Zm0 8c-24-3-46 9-52 28 15-10 33-19 52-28Zm0 0c24-3 46 9 52 28-15-10-33-19-52-28Z" />
      <path d="M160 200v-70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M160 132c-10-16-26-20-40-16 14 2 27 8 40 16Zm0 0c10-16 26-20 40-16-14 2-27 8-40 16Zm0-4c-14-8-19-23-12-35 3 12 8 23 12 35Zm0 0c14-8 19-23 12-35-3 12-8 23-12 35Z" />
    </svg>
  );
}

export function PalmShield({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 76" aria-hidden="true" fill="none">
      <path d="M32 3 58 12v22c0 17-11 30-26 38C17 64 6 51 6 34V12Z" stroke="#D8BA75" strokeWidth="2" />
      <path d="M32 9 52 16v18c0 13-8 23-20 30-12-7-20-17-20-30V16Z" stroke="#D8BA75" strokeWidth="1" opacity=".5" />
      <path d="M32 58V38" stroke="#E5C77F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 40c-6-10-16-13-25-10 9 1 17 5 25 10Zm0 0c6-10 16-13 25-10-9 1-17 5-25 10Zm0-3c-9-5-12-15-8-23 2 8 5 15 8 23Zm0 0c9-5 12-15 8-23-2 8-5 15-8 23Zm0 5c-10-1-19 4-22 12 6-4 14-8 22-12Zm0 0c10-1 19 4 22 12-6-4-14-8-22-12Z" fill="#E5C77F" />
      <path d="M24 62h16" stroke="#D8BA75" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
