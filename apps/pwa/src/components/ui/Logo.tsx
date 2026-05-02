import Image from "next/image";

interface LogoProps {
  /** "full" = logo completo | "icon" = solo ícono SVG | "text" = solo texto */
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  tagline?: string;
}

const logoHeights = { sm: 80, md: 110, lg: 150, xl: 180 };
const textSizes = {
  sm: { title: "text-lg", sub: "text-[10px]" },
  md: { title: "text-2xl", sub: "text-xs" },
  lg: { title: "text-3xl", sub: "text-sm" },
  xl: { title: "text-4xl", sub: "text-base" },
};

function BarberIcon({ size }: { size: number }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="rgba(201,162,39,0.12)" />
      <rect width="64" height="64" rx="14" stroke="rgba(201,162,39,0.25)" strokeWidth="1" />
      <circle cx="32" cy="32" r="3" fill="#c9a227" />
      <path d="M32 32 L14 16" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" />
      <circle cx="13" cy="15" r="5" stroke="#c9a227" strokeWidth="2.5" fill="none" />
      <path d="M32 32 L50 16" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" />
      <circle cx="51" cy="15" r="5" stroke="#c9a227" strokeWidth="2.5" fill="none" />
      <path d="M32 32 L18 52" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      <ellipse cx="16" cy="54" rx="4" ry="3" stroke="#c9a227" strokeWidth="2" fill="none" opacity="0.75" />
      <path d="M32 32 L46 52" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      <ellipse cx="48" cy="54" rx="4" ry="3" stroke="#c9a227" strokeWidth="2" fill="none" opacity="0.75" />
    </svg>
  );
}

export default function Logo({
  variant = "full",
  size = "md",
  className = "",
  tagline,
}: LogoProps) {
  const h = logoHeights[size];
  const txt = textSizes[size];

  if (variant === "icon") {
    const iconSizes = { sm: 32, md: 48, lg: 64, xl: 80 };
    return (
      <div className={className}>
        <BarberIcon size={iconSizes[size]} />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={`flex flex-col ${className}`}>
        <span
          className={`${txt.title} font-black tracking-tight leading-none`}
          style={{
            background: "linear-gradient(135deg, #c9a227 0%, #f0d060 50%, #c9a227 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          BarberPro
          <span style={{ WebkitTextFillColor: "rgba(255,255,255,0.7)" }}>Suite</span>
        </span>
      </div>
    );
  }

  // variant === "full" — usa la imagen real del logo
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="BarberProSuite"
        width={320}
        height={h}
        style={{ height: h, width: "auto", objectFit: "contain" }}
        priority
      />
      {tagline && (
        <span
          className="text-sm mt-2 tracking-wide"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          {tagline}
        </span>
      )}
    </div>
  );
}
