import type { Metadata } from "next";
import CheckoutForm from "./CheckoutForm";
export const metadata: Metadata = { title: "إتمام الطلب" };
export default function CheckoutPage() { return <CheckoutForm />; }
