/** Fixed painting behind every light section (a fixed layer, which works on iOS). */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <picture>
        <source srcSet="/images/painting.webp" type="image/webp" />
        <img src="/images/painting.jpg" alt="" decoding="async" {...{ fetchpriority: "high" }} />
      </picture>
    </div>
  );
}
