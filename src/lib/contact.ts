import { z } from "zod";

/** Messages are delivered by Formspree (a hosted form service); the site has no server of its own. */
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjybdbyl";

export const CONTACT_REASONS = ["Hiring", "Collaboration", "Open Source", "Other"] as const;

/** Formspree's spam trap: a field people never see or fill, so anything in it marks a bot. */
export const CONTACT_HONEYPOT_FIELD = "_gotcha";

// Header-safe single-line text: CR/LF and other control characters (including
// tab) become spaces so a name cannot inject lines into the email subject.
const singleLine = (value: string) =>
  value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ").replace(/ {2,}/g, " ");

export const contactSchema = z.object({
  name: z.string().transform(singleLine).pipe(z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long.")),
  email: z.string().trim().email("Please enter a valid email address.").max(120, "Email is too long."),
  reason: z.enum(CONTACT_REASONS),
  message: z
    .string()
    .trim()
    .min(10, "Please share a little more detail in your message.")
    .max(2000, "Message is too long."),
});

export type ContactFormData = z.infer<typeof contactSchema>;

/** The email subject Formspree sends with each message. */
export function contactSubject(data: Pick<ContactFormData, "name" | "reason">) {
  return `[Portfolio] ${data.reason} inquiry from ${data.name}`;
}
