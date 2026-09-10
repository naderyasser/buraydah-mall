"use client";
import { useState } from "react";

/** معرض صور المنتج: صورة كبيرة ومصغّرات — أول ما يفحصه المشتري */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return <div className="product-img" />;

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={images[i]} alt={alt} />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, n) => (
            <button
              key={src + n}
              type="button"
              className={n === i ? "on" : ""}
              onClick={() => setI(n)}
              aria-label={`صورة ${n + 1}`}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
