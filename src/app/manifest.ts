import type { MetadataRoute } from "next";

/** تطبيق ويب قابل للتثبيت — أهل بريدة يفتحونه من الشاشة الرئيسية كأي تطبيق */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مول بريدة الإلكتروني",
    short_name: "مول بريدة",
    description: "تسوّق من محلات بريدة في سلة واحدة — الدفع عند الاستلام.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6F8",
    theme_color: "#0B7A4B",
    lang: "ar",
    dir: "rtl",
    categories: ["shopping"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
