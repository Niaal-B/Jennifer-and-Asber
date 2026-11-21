import { wedding } from '../config/wedding';
import { Reveal } from '../components/Reveal';
import { ScheduleIcon } from '../components/ScheduleIcon';
import './EventFlow.css';

function Heart() {
  return (
    <svg className="flow__heart" width="22" height="20" viewBox="0 0 22 20" aria-hidden="true">
      <path d="M11 19S1 12.6 1 6.2A5 5 0 0 1 11 4a5 5 0 0 1 10 2.2C21 12.6 11 19 11 19Z" fill="currentColor" />
    </svg>
  );
}

/** S5 (top): timeline. Renders nothing until the client supplies a schedule. */
export function EventFlow() {
  const items = wedding.schedule;
  if (items.length === 0) return null;

  return (
    <section className="section flow" aria-labelledby="flow-title">
      <div className="column">
        <Reveal>
          <h2 id="flow-title" className="script flow__title">Event Flow</h2>
        </Reveal>
        <ol className="flow__list">
          {items.map((item, i) => (
            <li key={`${item.time}-${item.title}`} className={`flow__item ${i % 2 ? 'is-flipped' : ''}`}>
              <Reveal className="flow__row">
                <div className="flow__icon">
                  <ScheduleIcon name={item.icon} />
                </div>
                <Heart />
                <div className="flow__text">
                  <p className="flow__time">{item.time}</p>
                  <p className="flow__label">{item.title}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
