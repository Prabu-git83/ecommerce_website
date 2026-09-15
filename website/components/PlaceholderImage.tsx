import Image from "next/image";

// Product photography isn't available in this local build, so every image
// slot falls back to the same diagonal-stripe placeholder used throughout
// the Atelier mockups themselves — a deliberate stand-in, not a broken image.
export default function PlaceholderImage({
  src,
  alt,
  label,
  className = "",
}: {
  src?: string | null;
  alt: string;
  label?: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
    );
  }

  return (
    <div className={`stripe-placeholder relative flex items-end justify-start p-3 ${className}`}>
      {label ? <span className="font-mono text-[9px] text-faint">{label}</span> : null}
    </div>
  );
}
