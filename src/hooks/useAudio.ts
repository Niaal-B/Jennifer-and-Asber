import { useCallback, useEffect, useRef, useState } from 'react';

type Availability = 'checking' | 'available' | 'missing';

/**
 * Audio-file player (the fallback when no YouTube ID is configured). It first
 * checks that the file exists and really is audio: the Vite dev server answers
 * missing files with index.html, so a plain status check isn't enough. Playback
 * only starts after a user tap.
 */
export function useAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantPlay = useRef(false);
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
    audio.preload = 'auto';
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
    if (wantPlay.current) audio.play().catch(() => setPlaying(false));

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [availability, src]);

  const play = useCallback(() => {
    wantPlay.current = true;
    audioRef.current?.play().catch(() => setPlaying(false));
  }, []);

  const pause = useCallback(() => {
    wantPlay.current = false;
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else pause();
  }, [play, pause]);

  return { available: availability === 'available', playing, play, pause, toggle };
}
