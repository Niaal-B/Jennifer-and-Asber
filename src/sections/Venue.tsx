import { wedding } from '../config/wedding';
import { Reveal } from '../components/Reveal';
import { VenueIllustration } from '../components/VenueIllustration';
import './Venue.css';

function MapPinIcon() {
  return (
    <svg width="40" height="50" viewBox="0 0 40 50" aria-hidden="true">
      <ellipse cx="20" cy="45" rx="13" ry="4" fill="#7d6a4c" />
      <path
        d="M20 2C10.6 2 3 9.4 3 18.6 3 30.4 20 44 20 44s17-13.6 17-25.4C37 9.4 29.4 2 20 2Z"
        fill="var(--accent)"
      />
      <circle cx="20" cy="18" r="6.2" fill="var(--band)" />
    </svg>
  );
}

/** S4: venue band with illustration, address and Google Maps link. */
export function Venue() {
  const { venue } = wedding;
  return (
    <section className="section section--band venue" aria-labelledby="venue-title">
      <Reveal className="column">
        <div className="venue__art">
          {venue.illustration ? (
            <img src={venue.illustration} alt={`${venue.name} venue`} loading="lazy" />
          ) : (
            <VenueIllustration />
          )}
        </div>
        <h2 id="venue-title" className="script venue__name">
          {venue.name}
        </h2>
        <address className="venue__address">
          {venue.addressLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>
        <a className="venue__map" href={venue.mapsUrl} target="_blank" rel="noopener noreferrer">
          <MapPinIcon />
          <span className="caps">Google Map</span>
        </a>
      </Reveal>
    </section>
  );
}
