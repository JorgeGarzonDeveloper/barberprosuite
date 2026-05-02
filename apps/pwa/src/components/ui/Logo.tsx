interface LogoProps {
  /** "full" = ícono + texto | "icon" = solo ícono | "text" = solo texto */
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const iconSizes = { sm: 32, md: 48, lg: 64, xl: 80 };
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
      {/* Fondo redondeado */}
      <rect width="64" height="64" rx="14" fill="rgba(201,162,39,0.12)" />
      <rect
        width="64"
        height="64"
        rx="14"
        stroke="rgba(201,162,39,0.25)"
        strokeWidth="1"
      />

      {/* Tijeras estilizadas */}
      {/* Eje central */}
      <circle cx="32" cy="32" r="3" fill="#c9a227" />

      {/* Hoja superior-izquierda */}
      <path
        d="M32 32 L14 16"
        stroke="#c9a227"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="13" cy="15" r="5" stroke="#c9a227" strokeWidth="2.5" fill="none" />

      {/* Hoja superior-derecha */}
      <path
        d="M32 32 L50 16"
        stroke="#c9a227"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="51" cy="15" r="5" stroke="#c9a227" strokeWidth="2.5" fill="none" />

      {/* Mango izquierdo */}
      <path
        d="M32 32 L18 52"
        stroke="#c9a227"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <ellipse
        cx="16"
        cy="54"
        rx="4"
        ry="3"
        stroke="#c9a227"
        strokeWidth="2"
        fill="none"
        opacity="0.75"
      />

      {/* Mango derecho */}
      <path
        d="M32 32 L46 52"
        stroke="#c9a227"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <ellipse
        cx="48"
        cy="54"
        rx="4"
        ry="3"
        stroke="#c9a227"
        strokeWidth="2"
        fill="none"
        opacity="0.75"
      />

      {/* Brillo superior */}
      <path
        d="M20 10 Q32 6 44 10"
        stroke="rgba(201,162,39,0.2)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  variant = "full",
  size = "md",
  className = "",
}: LogoProps) {
  const iconPx = iconSizes[size];
  const txt = textSizes[size];

  if (variant === "icon") {
    return (
      <div className={className}>
        <BarberIcon size={iconPx} />
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

  // variant === "full"
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <BarberIcon size={iconPx} />
      <div className="flex flex-col items-center">
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
          <span style={{ WebkitTextFillColor: "rgba(255,255,255,0.75)" }}>Suite</span>
        </span>
        <span className={`${txt.sub} text-text-secondary tracking-widest uppercase mt-0.5`}>
          Tu barbería favorita
        </span>
      </div>
    </div>
  );
}
