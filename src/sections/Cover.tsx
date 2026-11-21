import { motion } from 'framer-motion';
import { coupleInOrder } from '../config/wedding';
import { Frame } from '../components/Frame';
import './Cover.css';

interface Props {
  onOpen: () => void;
}

/** S1: the cover gate shown when the invitation first loads. */
export function Cover({ onOpen }: Props) {
  const [first, second] = coupleInOrder();
  return (
    <motion.section
      className="cover"
      aria-label="Invitation cover"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Entrance is a pure fade: anything that moves under the finger can swallow an early tap. */}
      <motion.div
        className="cover__inner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.06 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        // Tapping anywhere on the framed card opens it; the OPEN button's click bubbles here too.
        onClick={onOpen}
      >
        <Frame variant="cover" aspect={0.69} className="cover__frame">
          <p className="caps cover__eyebrow">The wedding of</p>
          <h1 className="script cover__names">
            <span>{first.name}</span>
            <span className="cover__amp amp">&amp;</span>
            <span>{second.name}</span>
          </h1>
          <button type="button" className="caps cover__open">
            Open
          </button>
        </Frame>
      </motion.div>
    </motion.section>
  );
}
