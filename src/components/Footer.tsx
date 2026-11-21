import { wedding } from '../config/wedding';

export function Footer() {
  return (
    <footer className="site-footer">
      <p>{wedding.meta.footerCredit}</p>
    </footer>
  );
}
