import { z } from "zod";
import { CONTACT_REASONS, type ContactFormData } from "@/lib/contact";

/*
 * Kept apart from contact.ts so zod (about 76KB) is downloaded only when the
 * visitor sends the form, not with the rest of the homepage.
 */

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

// The schema's output must stay the same shape as the form's plain type.
export type ParsedContact = z.infer<typeof contactSchema> & ContactFormData;
