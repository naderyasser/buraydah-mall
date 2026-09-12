"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sar } from "@/lib/money";

type Sugg = {
  products: { name_ar: string; slug: string; price: string; image_path: string | null; store_name: string }[];
  stores: { name_ar: string; slug: string; district: string | null }[];
  categories: { name_ar: string; slug: string; wing_slug: string; wing_name: string }[];
};
const EMPTY: Sugg = { products: [], stores: [], categories: [] };

/**
 * صندوق البحث بإكمال فوري (نون/جرير/سلة): يقترح منتجات ومحلات وتصنيفات أثناء
 * الكتابة، ويعرض «الأكثر بحثاً» عند التركيز الفارغ. Enter يذهب لصفحة البحث كالمعتاد.
 */
export default function SearchBox({ trending = [] }: { trending?: string[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Sugg>(EMPTY);
  const box = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) { setData(EMPTY); return; }
    const ctl = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(t)}`, { signal: ctl.signal })
        .then((r) => r.json()).then(setData).catch(() => {});
    }, 180);
    return () => { clearTimeout(id); ctl.abort(); };
  }, [q]);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const has = data.products.length + data.stores.length + data.categories.length > 0;
  const showTrending = open && q.trim().length < 2 && trending.length > 0;
  const showList = open && q.trim().length >= 2 && has;

  return (
    <form className="hsearch" action="/search" ref={box} autoComplete="off"
      onSubmit={() => setOpen(false)}>
      <input name="q" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder="ابحث عن منتج أو محل…" aria-label="بحث"
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }} />
      <button type="submit">بحث</button>

      {(showTrending || showList) && (
        <div className="sugg" role="listbox">
          {showTrending && (
            <div className="sugg-sec">
              <span className="sugg-h">الأكثر بحثاً في بريدة</span>
              <div className="chips">
                {trending.map((t) => (
                  <button type="button" className="chip" key={t}
                    onClick={() => { setOpen(false); router.push(`/search?q=${encodeURIComponent(t)}`); }}>{t}</button>
                ))}
              </div>
            </div>
          )}
          {showList && data.categories.length > 0 && (
            <div className="sugg-sec">
              <span className="sugg-h">تصنيفات</span>
              {data.categories.map((c) => (
                <Link key={c.slug} href={`/wing/${c.wing_slug}?cat=${c.slug}`} onClick={() => setOpen(false)}>
                  {c.name_ar} <small>في {c.wing_name}</small>
                </Link>
              ))}
            </div>
          )}
          {showList && data.products.length > 0 && (
            <div className="sugg-sec">
              <span className="sugg-h">منتجات</span>
              {data.products.map((p) => (
                <Link key={p.slug} href={`/product/${p.slug}`} className="sugg-p" onClick={() => setOpen(false)}>
                  {p.image_path ? <img src={p.image_path} alt="" /> : <span className="sugg-noimg" />}
                  <span>{p.name_ar} <small>{p.store_name}</small></span>
                  <b className="tabular">{sar(p.price)} ر.س</b>
                </Link>
              ))}
            </div>
          )}
          {showList && data.stores.length > 0 && (
            <div className="sugg-sec">
              <span className="sugg-h">محلات</span>
              {data.stores.map((s) => (
                <Link key={s.slug} href={`/store/${s.slug}`} onClick={() => setOpen(false)}>
                  {s.name_ar} {s.district && <small>حي {s.district}</small>}
                </Link>
              ))}
            </div>
          )}
          {showList && (
            <Link href={`/search?q=${encodeURIComponent(q.trim())}`} className="sugg-all" onClick={() => setOpen(false)}>
              كل نتائج «{q.trim()}»
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
