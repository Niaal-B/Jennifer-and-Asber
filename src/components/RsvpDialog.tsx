import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Minus, Plus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { wedding } from '../config/wedding';
import { useScrollLock } from '../hooks/useScrollLock';
import { LIMITS, validateRsvp, type Attendance, type FieldErrors } from '../lib/rsvpValidation';
import { newSubmissionId, saveStoredRsvp, submitRsvp, type StoredRsvp } from '../services/rsvp';
import './RsvpDialog.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: (value: StoredRsvp) => void;
  initial?: StoredRsvp | null;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function RsvpDialog({ open, onClose, onSubmitted, initial }: Props) {
  return (
    <AnimatePresence>
      {open && <DialogBody key="rsvp" onClose={onClose} onSubmitted={onSubmitted} initial={initial} />}
    </AnimatePresence>
  );
}

function DialogBody({ onClose, onSubmitted, initial }: Omit<Props, 'open'>) {
  const max = wedding.rsvp.maxGuests;
  const [name, setName] = useState(initial?.name ?? '');
  const [attendance, setAttendance] = useState<Attendance | ''>(initial?.attendance ?? '');
  const [guests, setGuests] = useState(initial && initial.guests > 0 ? initial.guests : 1);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [formError, setFormError] = useState('');
  // One ID per opened dialog: retrying after an error reuses it, so the backend can drop duplicates.
  const [submissionId] = useState(newSubmissionId);
  const [startedAt] = useState(() => Date.now());

  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useScrollLock(true);

  useEffect(() => {
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 250);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) trapFocus(e, panelRef.current);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;

    const body = {
      name,
      attendance: attendance as Attendance,
      guests: attendance === 'attending' ? guests : 0,
      message,
      submissionId,
      website,
      startedAt,
    };

    const check = validateRsvp(body, max);
    if (!check.ok) {
      setErrors(check.errors);
      setFormError('');
      return;
    }

    setErrors({});
    setFormError('');
    setStatus('submitting');
    const result = await submitRsvp(body);

    if (result.ok) {
      const stored: StoredRsvp = {
        name: check.data.name,
        attendance: check.data.attendance,
        guests: check.data.guests,
        submittedAt: Date.now(),
      };
      saveStoredRsvp(stored);
      onSubmitted(stored);
      setStatus('success');
      return;
    }

    setStatus('error');
    setFormError(result.message);
    if (result.kind === 'validation') setErrors(result.errors);
  }

  const submitting = status === 'submitting';

  return (
    <motion.div
      className="rsvp-dialog"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <motion.div
        ref={panelRef}
        className="rsvp-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" className="rsvp-dialog__close" onClick={onClose} aria-label="Close">
          <X size={22} strokeWidth={1.4} />
        </button>

        {status === 'success' ? (
          <div className="rsvp-dialog__done" role="status">
            <span className="rsvp-dialog__check">
              <Check size={28} strokeWidth={1.4} />
            </span>
            <h2 id={titleId} className="script rsvp-dialog__title">Thank you</h2>
            <p className="rsvp-dialog__lead">
              {attendance === 'attending'
                ? `We look forward to celebrating with you, ${name.trim()}.`
                : `Thank you for letting us know, ${name.trim()}. You will be missed.`}
            </p>
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
            <h2 id={titleId} className="script rsvp-dialog__title">RSVP</h2>
            <p className="rsvp-dialog__lead caps">
              {wedding.event.label} · {wedding.event.dateShort}
            </p>

            <div className="rsvp-field">
              <label htmlFor="rsvp-name" className="caps">Your name</label>
              <input
                ref={nameRef}
                id="rsvp-name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={LIMITS.nameMax}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'rsvp-name-error' : undefined}
                disabled={submitting}
              />
              {errors.name && <p id="rsvp-name-error" className="rsvp-field__error">{errors.name}</p>}
            </div>

            <fieldset className="rsvp-field" aria-invalid={!!errors.attendance} disabled={submitting}>
              <legend className="caps">Will you attend?</legend>
              <div className="rsvp-choice">
                {(
                  [
                    ['attending', 'Joyfully accept'],
                    ['not_attending', 'Regretfully decline'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className={`rsvp-choice__option ${attendance === value ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="attendance"
                      value={value}
                      checked={attendance === value}
                      onChange={() => setAttendance(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {errors.attendance && <p className="rsvp-field__error">{errors.attendance}</p>}
            </fieldset>

            <AnimatePresence initial={false}>
              {attendance === 'attending' && (
                <motion.div
                  className="rsvp-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="caps rsvp-field__label" id="rsvp-guests-label">Number of guests</span>
                  <div className="rsvp-stepper" role="group" aria-labelledby="rsvp-guests-label">
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.max(LIMITS.minGuests, g - 1))}
                      disabled={submitting || guests <= LIMITS.minGuests}
                      aria-label="Fewer guests"
                    >
                      <Minus size={18} strokeWidth={1.4} />
                    </button>
                    <output aria-live="polite">{guests}</output>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.min(max, g + 1))}
                      disabled={submitting || guests >= max}
                      aria-label="More guests"
                    >
                      <Plus size={18} strokeWidth={1.4} />
                    </button>
                  </div>
                  {errors.guests && <p className="rsvp-field__error">{errors.guests}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rsvp-field">
              <label htmlFor="rsvp-message" className="caps">
                Message to the couple <span className="rsvp-field__optional">(optional)</span>
              </label>
              <textarea
                id="rsvp-message"
                name="message"
                rows={3}
                maxLength={LIMITS.messageMax}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
              />
              {errors.message && <p className="rsvp-field__error">{errors.message}</p>}
            </div>

            {/* Honeypot: hidden from people and screen readers. */}
            <div className="rsvp-hp" aria-hidden="true">
              <label htmlFor="rsvp-website">Website</label>
              <input
                id="rsvp-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {formError && (
              <p className="rsvp-form__error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="btn rsvp-form__submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={18} className="rsvp-spin" aria-hidden="true" /> Sending…
                </>
              ) : status === 'error' ? (
                'Try again'
              ) : (
                'Send RSVP'
              )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function trapFocus(e: KeyboardEvent, root: HTMLElement) {
  const focusable = root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), [href]',
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
