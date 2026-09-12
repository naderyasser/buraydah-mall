"use client";
import { sar } from "@/lib/money";
import Riyal from "@/components/Riyal";

/**
 * شريط «كم بقي على التوصيل المجاني» — أعلى ما يرفع متوسط قيمة الطلب في
 * المتاجر السعودية، ويعمل بلا بوابة دفع لأنه منطق سلة بحت.
 */
export default function FreeDeliveryBar({
  subtotal, freeOver, fee, storeName,
}: { subtotal: number; freeOver: number | null; fee: number; storeName: string }) {
  if (freeOver == null || freeOver <= 0) {
    return fee > 0
      ? <p className="fd-note">التوصيل من {storeName}: <b className="tabular">{sar(fee)} <Riyal /></b></p>
      : null;
  }

  const remaining = Math.max(0, freeOver - subtotal);
  const pct = Math.min(100, Math.round((subtotal / freeOver) * 100));

  return (
    <div className={`fd-bar${remaining === 0 ? " done" : ""}`}>
      <div className="fd-track"><span style={{ width: `${pct}%` }} /></div>
      <p>
        {remaining === 0
          ? <>حصلت على <b>التوصيل المجاني</b> من {storeName} ✓</>
          : <>أضف <b className="tabular">{sar(remaining)} <Riyal /></b> من {storeName} وتحصل على التوصيل المجاني</>}
      </p>
    </div>
  );
}
