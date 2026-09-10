import type { Metadata } from "next";
import MerchantLoginForm from "./LoginForm";

export const metadata: Metadata = { title: "دخول التاجر", robots: { index: false } };
export default function Page() { return <MerchantLoginForm />; }
