import { coupleInOrder, wedding } from '../config/wedding';
import { Frame } from '../components/Frame';
import { Reveal } from '../components/Reveal';
import type { Person } from '../types/wedding';
import './Invitation.css';

function PersonBlock({ person }: { person: Person }) {
  return (
    <div className="invite__person">
      <p className="script invite__name">
        {person.title} {person.name}
      </p>
      <p className="caps invite__parents">
        {person.relation} {person.parents}
      </p>
    </div>
  );
}

/** S3 (bottom): the formal invitation inside the finer floral frame. */
export function Invitation() {
  const [first, second] = coupleInOrder();
  const { event, venue, invitation } = wedding;
  return (
    <section className="invite" aria-label="Invitation">
      <Reveal>
        <Frame variant="invite" aspect={0.62} className="invite__frame">
          <p className="caps invite__small">{invitation.invocation}</p>
          <p className="caps invite__small invite__lead">{invitation.inviteLine}</p>
          <PersonBlock person={first} />
          <p className="invite__amp amp">&amp;</p>
          <PersonBlock person={second} />
          <div className="caps invite__details">
            <p>
              {event.weekday}, {event.dateShort}
            </p>
            <p>{event.time}</p>
            <p>
              {venue.name}, {venue.city}
            </p>
          </div>
        </Frame>
      </Reveal>
    </section>
  );
}
