import { useCallback, useEffect, useRef, useState } from 'react';

type Availability = 'checking' | 'available' | 'missing';

/**
 * Background song player. It first checks that the file exists and really is
 * audio: the Vite dev server answers missing files with index.html, so a plain
 * status check isn't enough. Playback only starts on a user tap.
 */
export function useAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [availability, setAvailability] = useState<Availability>(src ? 'checking' : 'missing');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    fetch(src, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? '';
        if (!cancelled) setAvailability(res.ok && type.startsWith('audio/') ? 'available' : 'missing');
      })
      .catch(() => !cancelled && setAvailability('missing'));
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (availability !== 'available') return;
    const audio = new Audio();
    audio.src = src;
    audio.loop = true;
    audio.preload = 'none';
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      setAvailability('missing');
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audioRef.current = audio;

    // Pause when the guest switches away (e.g. back to WhatsApp).
    const onVisibility = () => document.hidden && audio.pause();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', onVisibility);
      audioRef.current = null;
    };
  }, [availability, src]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  return { available: availability === 'available', playing, toggle };
}
