/** زرّ واتساب عائم للمول (كل متاجر سلة تقريباً) — يخاطب إدارة المول لا محلاً بعينه */
export default function WhatsAppFab({ number }: { number: string }) {
  if (!number) return null;
  const text = encodeURIComponent("السلام عليكم، عندي استفسار عن مول بريدة");
  return (
    <a className="wa-fab no-print" href={`https://wa.me/${number}?text=${text}`} target="_blank" rel="noopener" aria-label="تواصل معنا عبر واتساب">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.9.5a2.5 2.5 0 0 0 1.6-1.2 2 2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z" /></svg>
      <span>تواصل معنا</span>
    </a>
  );
}
