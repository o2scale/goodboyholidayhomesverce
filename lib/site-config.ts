export const siteConfig = {
  name: "Goodboy Holiday Homes",
  contact: {
    // Phone number in international format without spaces/dashes for tel: and wa.me links.
    // Update this single value to change it across the whole site (footer, contact page, floating buttons).
    phoneE164: "+919876543210",
    // Display version (how it shows in UI)
    phoneDisplay: "+91 98765 43210",
    email: "hello@goodboyholidayhomes.com",
    address: "123 Goodboy Lane, Pawsome City, PC 56789",
  },
} as const;

// Helper to build a WhatsApp deep link with a prefilled message
export function buildWhatsAppUrl(message = "Hi! I'd like to book a stay with Goodboy Holiday Homes."): string {
  const number = siteConfig.contact.phoneE164.replace(/\+/g, "").replace(/\s/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
