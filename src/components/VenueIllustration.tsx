/**
 * Stand-in line drawing of a reception hall. This is an original illustration,
 * not a depiction of the real venue. Swap it by setting `venue.illustration`
 * in the config to an image path.
 */
export function VenueIllustration() {
  const wingWindows = (x0: number) =>
    [0, 1, 2].map((i) => {
      const x = x0 + i * 30;
      return (
        <g key={`${x0}-${i}`}>
          {/* upper arched window */}
          <path d={`M${x} 128 v-16 a7 7 0 0 1 14 0 v16 Z`} />
          <path d={`M${x + 7} 105 v23 M${x} 118 h14`} strokeWidth="0.6" />
          <path d={`M${x - 2} 130 h18`} />
          {/* lower window */}
          <rect x={x} y={160} width={14} height={24} />
          <path d={`M${x + 7} 160 v24 M${x} 172 h14`} strokeWidth="0.6" />
          <path d={`M${x - 2} 186 h18 M${x - 2} 157 h18`} />
        </g>
      );
    });

  const columns = [176, 200, 224, 248, 272].map((x) => (
    <g key={x}>
      <path d={`M${x} 102 v94 M${x + 8} 102 v94`} />
      <path d={`M${x - 2} 102 h12 M${x - 2} 196 h12`} />
      <path d={`M${x - 1} 99 h10 M${x - 1} 199 h10`} strokeWidth="0.7" />
    </g>
  ));

  const balusters = Array.from({ length: 34 }, (_, i) => {
    const x = 74 + i * 9.4;
    if (x > 166 && x < 290) return null;
    return <path key={i} d={`M${x} 84 v9`} strokeWidth="0.7" />;
  });

  const palm = (x: number, flip: boolean) => {
    const s = flip ? -1 : 1;
    return (
      <g transform={`translate(${x} 0) scale(${s} 1)`}>
        <path d="M0 214 C2 180 -3 150 4 112" />
        <path d="M2 214 C4 180 -1 150 6 112" strokeWidth="0.6" />
        <path d="M5 112 C18 100 32 104 40 114" />
        <path d="M5 112 C14 92 30 88 38 92" />
        <path d="M5 112 C0 92 -14 86 -26 92" />
        <path d="M5 112 C-8 102 -22 106 -30 118" />
        <path d="M5 112 C8 96 6 86 0 78" />
        <path d="M14 106 l4 6 M22 104 l3 6 M30 107 l2 6 M-10 104 l-3 6 M-18 106 l-2 6" strokeWidth="0.6" />
      </g>
    );
  };

  const shrubs = (x: number) => (
    <path
      d={`M${x} 214 c-2-8 4-12 9-9 c1-8 11-8 12 0 c6-3 11 2 8 9`}
      strokeWidth="0.8"
    />
  );

  return (
    <svg
      viewBox="0 0 460 230"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Line drawing of the reception venue"
    >
      {/* ground */}
      <path d="M20 214 h420" />
      <path d="M40 220 h120 M300 220 h120" strokeWidth="0.6" />

      {/* wings */}
      <rect x="70" y="96" width="320" height="104" />
      <path d="M66 96 h328 M66 92 h328" />
      <path d="M70 84 h96 M290 84 h100 M70 93 v-9 M390 93 v-9" />
      {balusters}
      <path d="M70 145 h320" strokeWidth="0.7" />
      <path d="M70 200 h320" />
      {wingWindows(82)}
      {wingWindows(304)}

      {/* side towers */}
      <path d="M58 200 V88 h14 V200 M388 200 V88 h14 V200" />
      <path d="M55 88 h20 l-10 -14 Z M385 88 h20 l-10 -14 Z" />

      {/* central portico */}
      <path d="M160 96 L228 44 L298 96" />
      <path d="M156 99 h146" />
      <path d="M174 92 L228 52 L282 92 Z" strokeWidth="0.7" />
      <circle cx="228" cy="76" r="7" strokeWidth="0.7" />
      <path d="M228 69 v14 M221 76 h14" strokeWidth="0.5" />
      {columns}

      {/* entrance */}
      <path d="M210 196 v-34 a18 18 0 0 1 36 0 v34" />
      <path d="M228 144 v52 M214 168 h28" strokeWidth="0.6" />

      {/* steps */}
      <path d="M150 200 h158 M144 205 h170 M138 210 h182" />
      <path d="M138 214 v-4 M320 214 v-4" strokeWidth="0.6" />

      {/* greenery */}
      {palm(28, false)}
      {palm(432, true)}
      {shrubs(84)}
      {shrubs(118)}
      {shrubs(320)}
      {shrubs(354)}
    </svg>
  );
}
