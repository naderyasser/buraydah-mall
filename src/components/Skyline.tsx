/**
 * أفق بريدة كظلّ: برج مياه بريدة (معلم المدينة)، نخيل، وسور بشرفات نجدية.
 * رسم مبسّط بخط واحد — يُقرأ كبريدة من بعيد بلا أي صورة فوتوغرافية.
 */
export default function Skyline({ height = 90, className = "" }: { height?: number; className?: string }) {
  return (
    <svg className={`skyline ${className}`.trim()} viewBox="0 0 640 120" height={height} width="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true" fill="currentColor">
      {/* سور بشرفات نجدية */}
      <path d="M0 120V96h20l6-10 6 10h22l6-10 6 10h22l6-10 6 10h22l6-10 6 10h20v24Z" opacity=".55" />
      <path d="M480 120V98h18l5-9 5 9h20l5-9 5 9h20l5-9 5 9h20l5-9 5 9h18v22Z" opacity=".55" />
      {/* برج مياه بريدة: ساق نحيلة وتاج مخروطي مقلوب مع حلقة */}
      <path d="M318 120V52h-6l-26-30h68l-26 30h-6v68Z" />
      <path d="M286 22c0-8 15-14 34-14s34 6 34 14-15 12-34 12-34-4-34-12Z" opacity=".85" />
      <rect x="296" y="30" width="48" height="4" rx="2" opacity=".6" />
      {/* نخيل */}
      <g opacity=".9">
        <path d="M200 120V70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M200 72c-10-16-26-20-38-16 12 2 24 8 38 16Zm0 0c10-16 26-20 38-16-12 2-24 8-38 16Zm0-4c-14-8-20-22-14-34 4 12 10 22 14 34Zm0 0c14-8 20-22 14-34-4 12-10 22-14 34Zm0 6c-16-2-30 6-34 18 10-6 22-12 34-18Zm0 0c16-2 30 6 34 18-10-6-22-12-34-18Z" />
      </g>
      <g opacity=".9">
        <path d="M430 120V82" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M430 84c-8-13-21-16-31-13 10 2 20 7 31 13Zm0 0c8-13 21-16 31-13-10 2-20 7-31 13Zm0-3c-11-7-16-18-11-28 3 10 8 18 11 28Zm0 0c11-7 16-18 11-28-3 10-8 18-11 28Zm0 5c-13-2-24 5-27 15 8-5 18-10 27-15Zm0 0c13-2 24 5 27 15-8-5-18-10-27-15Z" />
      </g>
      <g opacity=".75">
        <path d="M120 120V90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M120 92c-7-11-18-13-26-11 8 2 17 6 26 11Zm0 0c7-11 18-13 26-11-8 2-17 6-26 11Zm0-3c-9-6-13-15-9-23 2 8 6 15 9 23Zm0 0c9-6 13-15 9-23-2 8-6 15-9 23Z" />
      </g>
      {/* بيوت طينية */}
      <path d="M540 120V88h30v32Zm38 0V80h22v40Z" opacity=".45" />
      <path d="M40 120V92h26v28Z" opacity=".45" />
    </svg>
  );
}
