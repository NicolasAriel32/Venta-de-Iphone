import Image from "next/image";
import { imageUrl } from "@/lib/images";

/**
 * Imagen de producto con fallback.
 *
 * Mientras el bucket esté vacío, esto NO tiene que verse como un error.
 * El fallback dibuja un bloque con la marca y el nombre: se lee como una
 * decisión de diseño, no como una imagen rota. El día que se suban fotos
 * reales aparecen solas, sin tocar una línea de código.
 */
export default function ProductImage({
  path,
  alt,
  brand,
  name,
  priority = false,
  sizes = "(max-width: 768px) 50vw, 300px",
}: {
  path: string | null;
  alt: string;
  brand?: string;
  name?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const src = imageUrl(path);

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-line/60 to-surface p-3 text-center"
    >
      {brand && (
        <span className="font-display text-[10px] tracking-[0.18em] text-muted uppercase">
          {brand}
        </span>
      )}
      {name && (
        <span className="line-clamp-3 font-display text-sm leading-tight font-bold text-muted/80">
          {name}
        </span>
      )}
    </div>
  );
}
