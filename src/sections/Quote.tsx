import { wedding } from '../config/wedding';
import { Reveal } from '../components/Reveal';
import './Quote.css';

/** S5 (bottom): dark band with the verse. */
export function Quote() {
  const { quote } = wedding;
  if (!quote) return null;
  return (
    <section className="section section--band quote" aria-label="Quote">
      <Reveal className="column">
        <figure className="quote__figure">
          <blockquote className="quote__text">
            <p className="script">
              <span className="quote__mark" aria-hidden="true">“</span>
              {quote.text.charAt(0).toLowerCase() + quote.text.slice(1)}
              <span className="quote__mark" aria-hidden="true">”</span>
            </p>
          </blockquote>
          <figcaption className="caps quote__source">{quote.source}</figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
