import { useCountdown } from '../hooks/useCountdown';
import { wedding } from '../config/wedding';
import { Reveal } from '../components/Reveal';
import './Countdown.css';

const pad = (n: number) => String(n).padStart(2, '0');

/** S3 (top): dark band with the live countdown. */
export function Countdown() {
  const { days, hours, minutes, seconds, done } = useCountdown(wedding.event.startsAt);
  const units = [
    { value: String(days), label: 'Days' },
    { value: pad(hours), label: 'Hours' },
    { value: pad(minutes), label: 'Minutes' },
    { value: pad(seconds), label: 'Seconds' },
  ];

  return (
    <section className="section section--band countdown" aria-label="Countdown to the reception">
      <Reveal className="column">
        <h2 className="script countdown__title">Counting Days</h2>
        {done ? (
          <p className="countdown__done">Today we celebrate</p>
        ) : (
          <div className="countdown__grid" role="timer" aria-live="off">
            {units.map((u, i) => (
              <div className="countdown__unit" key={u.label}>
                <span className="countdown__value">{u.value}</span>
                <span className="countdown__label">{u.label}</span>
                {i < units.length - 1 && <span className="countdown__sep" aria-hidden="true">:</span>}
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
