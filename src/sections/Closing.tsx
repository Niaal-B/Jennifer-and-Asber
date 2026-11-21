import { Contact } from './Contact';
import { Rsvp } from './Rsvp';
import { Reveal } from '../components/Reveal';

/** S6: RSVP, contacts and back-to-top, all on one painted section. */
export function Closing() {
  return (
    <section className="section closing" aria-label="RSVP and contact">
      <div className="column">
        <Rsvp />
        <Contact />
        <Reveal>
          <button
            type="button"
            className="btn closing__top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to top
          </button>
        </Reveal>
      </div>
    </section>
  );
}
