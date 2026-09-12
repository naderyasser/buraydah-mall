/** حقل جوال سعودي: بادئة +966 ثابتة والرقم يبدأ بـ5 — الشكل الذي يعرفه كل عميل من أبشر وتطبيقات البنوك */
export default function PhoneField({ name = "phone", required = true, defaultValue = "", autoFocus = false }:
  { name?: string; required?: boolean; defaultValue?: string; autoFocus?: boolean }) {
  return (
    <span className="phone-field" dir="ltr">
      <span className="phone-cc">🇸🇦 +966</span>
      <input name={name} required={required} inputMode="tel" dir="ltr" placeholder="5xxxxxxxx" autoComplete="tel-national"
        pattern="0?5[0-9]{8}" title="رقم سعودي يبدأ بـ 05" maxLength={10} defaultValue={defaultValue} autoFocus={autoFocus} />
    </span>
  );
}
