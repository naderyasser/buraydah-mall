"use client";
import { useEffect } from "react";
import { bumpViews } from "@/app/actions";

/** المشاهدة تُسجَّل من المتصفّح كالزيارة — فلا تعدّها الزواحف */
export default function ViewCounter({ id }: { id: number }) {
  useEffect(() => {
    const t = setTimeout(() => { bumpViews(id).catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, [id]);
  return null;
}
