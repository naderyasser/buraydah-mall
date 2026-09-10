import LoginForm from "./LoginForm";
export const metadata = { title: "دخول لوحة التحكّم" };

export default function LoginPage() {
  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <section className="hero">
        <h1>لوحة التحكّم</h1>
        <p>الدخول للإدارة فقط.</p>
      </section>
      <LoginForm />
    </div>
  );
}
