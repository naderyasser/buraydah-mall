"use client";
import { useEffect } from "react";
import { remember, type Seen } from "./RecentlyViewed";

export default function RememberSeen({ item }: { item: Seen }) {
  useEffect(() => { remember(item); }, [item.id]);
  return null;
}
