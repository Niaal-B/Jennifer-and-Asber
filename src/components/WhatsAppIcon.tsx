interface Props {
  size?: number;
}

/** Outline WhatsApp glyph (Lucide has no brand icons). */
export function WhatsAppIcon({ size = 44 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 4.5c-10.77 0-19.5 8.73-19.5 19.5 0 3.62.99 7.01 2.71 9.92L4.5 43.5l9.86-2.62A19.42 19.42 0 0 0 24 43.5c10.77 0 19.5-8.73 19.5-19.5S34.77 4.5 24 4.5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M17.2 14.6c-.5-1.1-1-1.1-1.5-1.1h-1.3c-.4 0-1.2.2-1.8.9-.6.7-2.4 2.3-2.4 5.6s2.4 6.5 2.8 7c.3.4 4.7 7.5 11.6 10.2 5.7 2.3 6.9 1.8 8.1 1.7 1.2-.1 4-1.6 4.5-3.2.6-1.6.6-2.9.4-3.2-.2-.3-.6-.4-1.3-.8l-4.4-2.1c-.6-.2-1-.3-1.5.3-.4.7-1.7 2.1-2 2.6-.4.4-.8.5-1.4.2-.7-.3-2.8-1-5.3-3.3-2-1.7-3.3-3.9-3.7-4.5-.4-.7 0-1 .3-1.4l1-1.2c.3-.4.4-.7.7-1.2.2-.4.1-.9-.1-1.2l-2-4.3Z"
        fill="currentColor"
      />
    </svg>
  );
}
