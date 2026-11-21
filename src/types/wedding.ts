export interface Person {
  /** Honorific shown before the name, e.g. "Dr". */
  title: string;
  name: string;
  /** Relation prefix, e.g. "D/O" or "S/O". */
  relation: string;
  /** Parents exactly as provided by the client. */
  parents: string;
}

export type ScheduleIconName = 'arrival' | 'rings' | 'cake' | 'camera' | 'dining' | 'car';

export interface ScheduleItem {
  time: string;
  title: string;
  icon: ScheduleIconName;
}

export interface Contact {
  /** e.g. "Bride's Father" */
  role: string;
  name: string;
  /** International format without "+" or spaces, e.g. "919876543210". */
  whatsapp: string;
}

export interface WeddingConfig {
  couple: {
    bride: Person;
    groom: Person;
    /** Which name appears first on the cover and hero. */
    order: 'bride-first' | 'groom-first';
  };
  event: {
    label: string;
    /** ISO 8601 with timezone offset. The countdown targets this. */
    startsAt: string;
    endsAt: string;
    weekday: string;
    /** Short numeric date shown in the hero, e.g. "04.01.2027". */
    dateShort: string;
    /** Long date, e.g. "4 January 2027". */
    dateLong: string;
    time: string;
  };
  venue: {
    name: string;
    /** Short place name used in the invitation card, e.g. "Thalassery". */
    city: string;
    addressLines: string[];
    mapsUrl: string;
    /** Path to a line-art image of the venue. Empty = built-in stand-in drawing. */
    illustration: string;
  };
  invitation: {
    invocation: string;
    inviteLine: string;
  };
  quote: { text: string; source: string } | null;
  /** Leave empty to hide the Event Flow section. */
  schedule: ScheduleItem[];
  /** Leave empty to hide the Contact block. */
  contacts: Contact[];
  music: {
    /** Path to the song in /public. The player hides itself if the file is missing. */
    src: string;
    title: string;
  };
  rsvp: {
    endpoint: string;
    maxGuests: number;
    /** e.g. { weekday: "Monday", date: "21 December 2026" }. null = no deadline line. */
    deadline: { weekday: string; date: string } | null;
    heading: string;
    lines: string[];
  };
  meta: {
    title: string;
    description: string;
    footerCredit: string;
  };
}
