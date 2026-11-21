import type { CSSProperties, ReactNode } from 'react';
import './Frame.css';

interface FrameProps {
  /** 'cover' = bold-dot frame (S1), 'invite' = finer frame (S3). */
  variant: 'cover' | 'invite';
  /** Width / height. The source art is ~0.69; small vertical stretch is invisible. */
  aspect?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Ornate floral frame. The frame is a container-query box, so text inside is
 * sized in `cqw` and keeps the same proportions at every screen width.
 */
export function Frame({ variant, aspect = 0.69, className = '', children }: FrameProps) {
  return (
    <div
      className={`frame frame--${variant} ${className}`}
      style={{ '--frame-aspect': aspect } as CSSProperties}
    >
      <picture className="frame__art" aria-hidden="true">
        <source srcSet={`/images/frame-${variant}.webp`} type="image/webp" />
        <img src={`/images/frame-${variant}.png`} alt="" draggable={false} />
      </picture>
      <div className="frame__content">{children}</div>
    </div>
  );
}
