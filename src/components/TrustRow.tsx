/** صف الثقة تحت زر الشراء — نمط جرير: أربع إشارات قصيرة لا فقرة */
export default function TrustRow() {
  const items = [
    { i: "٧", t: "استرجاع خلال ٧ أيام" },
    { i: "₪", t: "الدفع عند الاستلام" },
    { i: "✓", t: "شامل الضريبة" },
    { i: "◎", t: "رمز استلام للطلب" },
  ];
  return (
    <ul className="trust-row">
      {items.map((x) => (
        <li key={x.t}><span className="ti">{x.i}</span>{x.t}</li>
      ))}
    </ul>
  );
}
