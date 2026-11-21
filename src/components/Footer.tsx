import { wedding } from '../config/wedding';

export function Footer() {
  const { footerCredit, designer } = wedding.meta;
  return (
    <footer className="site-footer">
      <p>{footerCredit}</p>
      {designer && (
        <p className="site-footer__credit">
          {designer.label}{' '}
          <a href={designer.url} target="_blank" rel="noopener noreferrer">
            {designer.handle}
          </a>
        </p>
      )}
    </footer>
  );
}
