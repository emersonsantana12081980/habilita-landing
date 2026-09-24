// Only booking pages are accepted, never a public calendar/event listing.
export function googleBookingUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return "";
    const short =
      url.hostname === "calendar.app.google" &&
      /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
    const full =
      url.hostname === "calendar.google.com" &&
      /^\/calendar\/(?:u\/\d+\/)?appointments\/schedules\/[A-Za-z0-9_-]+\/?$/.test(
        url.pathname,
      );
    if (!short && !full) return "";
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

export const DEFAULT_GOOGLE_BOOKING_URL = googleBookingUrl(
  import.meta.env?.VITE_GOOGLE_BOOKING_URL ??
    "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3YunACeLtRkfTZQIqF-YDY0tmk2jwcdws2m9l5XyiXeunMfQgof0w8OYKlZYQAiL79MMHNIsd-",
);
