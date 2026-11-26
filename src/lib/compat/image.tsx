import type { CSSProperties, ImgHTMLAttributes } from "react";

type StaticImage = { src: string; width?: number; height?: number };

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string | StaticImage;
  width?: number;
  height?: number;
  /** Fill the positioned parent, as the reference's images do. */
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
};

/** A plain <img> with the reference's call-site API: lazy unless `priority`. */
export default function Image({ src, width, height, fill, priority, quality: _quality, placeholder: _placeholder, style, loading, ...rest }: ImageProps) {
  const url = typeof src === "string" ? src : src.src;
  const w = width ?? (typeof src === "string" ? undefined : src.width);
  const h = height ?? (typeof src === "string" ? undefined : src.height);
  const fillStyle: CSSProperties | undefined = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : undefined;
  return (
    <img
      src={url}
      width={fill ? undefined : w}
      height={fill ? undefined : h}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
}
