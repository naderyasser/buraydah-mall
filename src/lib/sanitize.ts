/**
 * تنقية النص الذي يكتبه الزوار: أرقام التواصل والروابط تُحجب في التقييمات
 * والأسئلة وطلبات الشراء — كما يفعل «مركز الأمان» في حراج. السبب تجاري لا
 * أمني فقط: الصفقة التي تخرج من المنصّة لا تُقاس ولا يحميها أحد.
 */
const PHONE = /(?:\+?9665|05|5)[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d/g;
const URL = /\b((https?:\/\/|www\.)\S+|\S+\.(com|net|sa|org|io|me|co)\b\S*)/gi;
const HANDLE = /(?:@[A-Za-z0-9._]{3,})/g;

export function scrubContact(text: string): { text: string; hits: number } {
  let hits = 0;
  const count = (m: string) => { hits++; return m; };
  const out = text
    .replace(URL, (m) => (count(m), "[رابط محجوب]"))
    .replace(PHONE, (m) => (count(m), "[رقم محجوب]"))
    .replace(HANDLE, (m) => (count(m), "[حساب محجوب]"));
  return { text: out, hits };
}

/** هل يحتوي النص على تواصل مباشر؟ يُستعمل لرفض الإدخال بدل تشويهه */
export function hasContact(text: string): boolean {
  return scrubContact(text).hits > 0;
}
