import { createContext, useContext } from 'react';

export interface MusicApi {
  /** A song is configured and ready to play. */
  available: boolean;
  playing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

export const MusicContext = createContext<MusicApi>({
  available: false,
  playing: false,
  play: () => {},
  pause: () => {},
  toggle: () => {},
});

export const useMusic = () => useContext(MusicContext);
