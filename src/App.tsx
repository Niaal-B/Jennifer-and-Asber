import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Backdrop } from './components/Backdrop';
import { Footer } from './components/Footer';
import { Closing } from './sections/Closing';
import { Countdown } from './sections/Countdown';
import { Cover } from './sections/Cover';
import { EventFlow } from './sections/EventFlow';
import { Hero } from './sections/Hero';
import { Invitation } from './sections/Invitation';
import { Quote } from './sections/Quote';
import { Venue } from './sections/Venue';

export default function App() {
  const [opened, setOpened] = useState(false);

  const open = () => {
    if (opened) return;
    window.scrollTo({ top: 0 });
    setOpened(true);
  };

  return (
    <>
      <Backdrop />
      <AnimatePresence mode="wait">
        {!opened ? (
          <Cover key="cover" onOpen={open} />
        ) : (
          <motion.main
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Hero />
            <Countdown />
            <Invitation />
            <Venue />
            <EventFlow />
            <Quote />
            <Closing />
          </motion.main>
        )}
      </AnimatePresence>
      <Footer />
    </>
  );
}
