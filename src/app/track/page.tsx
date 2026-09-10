import type { Metadata } from "next";
import TrackForm from "./TrackForm";

export const metadata: Metadata = {
  title: "تتبّع طلبك",
  description: "اعرف حالة طلبك في مول بريدة برقم الطلب ورقم جوالك.",
};

export default function TrackPage() {
  return <TrackForm />;
}
