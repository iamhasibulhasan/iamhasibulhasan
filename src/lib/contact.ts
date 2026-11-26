/** Messages are delivered by Formspree (a hosted form service); the site has no server of its own. */
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjybdbyl";

export const CONTACT_REASONS = ["Hiring", "Collaboration", "Open Source", "Other"] as const;

/** Formspree's spam trap: a field people never see or fill, so anything in it marks a bot. */
export const CONTACT_HONEYPOT_FIELD = "_gotcha";

/** The form's fields. Validation is in contact-schema.ts, loaded only when the form is sent. */
export type ContactFormData = {
  name: string;
  email: string;
  reason: (typeof CONTACT_REASONS)[number];
  message: string;
};

/** The email subject Formspree sends with each message. */
export function contactSubject(data: Pick<ContactFormData, "name" | "reason">) {
  return `[Portfolio] ${data.reason} inquiry from ${data.name}`;
}
