import type { WeddingConfig } from '../types/wedding';

/**
 * All client-specific content lives here. UI components never hard-code
 * wedding details. To reuse this site for another couple, edit only this
 * file (plus the assets in /public).
 *
 * Names and parents are exactly as confirmed by the client. Do not edit
 * their spelling.
 */
export const wedding: WeddingConfig = {
  couple: {
    bride: {
      title: 'Dr',
      name: 'Jennifer',
      relation: 'D/o',
      parents: ['Abdul Majid Kanhirandy', 'Saira Majid'],
      grandparents: {
        relation: 'Grand D/o',
        names: ['Late Aboobacker TK', 'Late AK Abdulla'],
      },
    },
    groom: {
      title: 'Dr',
      name: 'Asber',
      relation: 'S/o',
      parents: ['Dr Mohammed Saleem', 'Dr Fathimathul Zohara'],
    },
    order: 'bride-first',
  },

  event: {
    label: 'Wedding Reception',
    startsAt: '2027-01-04T12:00:00+05:30',
    endsAt: '2027-01-04T15:00:00+05:30',
    weekday: 'Monday',
    dateShort: '04.01.2027',
    dateLong: '4 January 2027',
    time: '12:00 PM – 3:00 PM',
  },

  venue: {
    name: 'Xenel',
    locality: 'Mele Champad, Thalassery',
    addressLines: ['Mele Champad, Thalassery,', 'Kerala, India'],
    mapsUrl: 'https://maps.app.goo.gl/63YEjHRV7ytixqBZ8?g_st=iw',
    illustration: '/images/venue.webp',
  },

  // Wording is pending client sign-off.
  invitation: {
    invocation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    inviteLine: 'We cordially invite you to the wedding reception of our daughter',
  },

  quote: {
    text: 'And We created you in pairs',
    source: 'An-Naba [78:8]',
  },

  // Example: { time: '12:00 PM', title: 'Guests Arrival', icon: 'arrival' }
  schedule: [],

  // Example: { role: "Bride's Father", name: '…', whatsapp: '919876543210' }
  contacts: [],

  // Starts when the guest taps OPEN and loops endlessly.
  // "Dheema Dheema" piano by Pianist Ram: https://youtu.be/SGxMtHCisZU
  music: {
    youtubeId: 'SGxMtHCisZU',
    src: '/audio/song.mp3',
    title: 'Our song',
  },

  rsvp: {
    endpoint: import.meta.env.VITE_RSVP_API_URL || '/api/rsvp',
    maxGuests: 10,
    deadline: null,
    heading: 'Kindly RSVP',
    lines: ['We would be most grateful', 'for your response.', 'Thank you.'],
  },

  meta: {
    // Keep index.html (page title + link-preview tags) in sync with these.
    title: 'Asber & Jennifer · Wedding Reception',
    description:
      'You are warmly invited to the wedding reception of Dr Asber & Dr Jennifer on Monday, 4 January 2027 at Xenel, Mele Champad, Thalassery.',
    footerCredit: 'With love, Jennifer & Asber · 2027',
    designer: {
      label: 'Digital invitation by',
      handle: '@niaal._',
      url: 'https://www.instagram.com/niaal._/',
    },
  },
};

/** The couple in display order. */
export function coupleInOrder() {
  const { bride, groom, order } = wedding.couple;
  return order === 'bride-first' ? [bride, groom] as const : [groom, bride] as const;
}
