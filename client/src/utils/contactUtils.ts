/**
 * Helper utility to handle Email and WhatsApp links responsively:
 * - On Laptop / Desktop: Opens in a NEW browser tab (Gmail Web / WhatsApp Web).
 * - On Mobile Screen: Opens native Gmail App / WhatsApp App directly with prefilled draft.
 */

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  // iPadOS 13+ reports as Macintosh in UA string, but supports touch points
  const isIPadOS = /Macintosh/i.test(userAgent) && (navigator.maxTouchPoints > 0);
  const screenWidthCheck = window.innerWidth <= 1024;
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  return userAgentCheck || isIPadOS || (screenWidthCheck && hasTouch);
};

export const openEmailDraft = (email: string, subject: string = '', body: string = '') => {
  if (!email) return;
  const cleanedEmail = email.trim();
  const encEmail = encodeURIComponent(cleanedEmail);
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);

  if (isMobileDevice()) {
    // On Mobile: triggers native Gmail App / Mail App composer directly without opening browser tab
    const mailtoUrl = `mailto:${cleanedEmail}?subject=${encSubject}&body=${encBody}`;
    window.location.href = mailtoUrl;
  } else {
    // On Laptop / Desktop: Open Gmail web compose in a new browser tab
    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encEmail}&su=${encSubject}&body=${encBody}`;
    window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
  }
};

export const openWhatsAppDraft = (phone: string, text: string = '') => {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encText = encodeURIComponent(text);

  if (isMobileDevice()) {
    // On Mobile: triggers native WhatsApp App directly on iOS/Android
    const nativeAppUrl = `whatsapp://send?phone=${cleanPhone}&text=${encText}`;
    window.location.href = nativeAppUrl;
  } else {
    // On Laptop / Desktop: Open WhatsApp Web in a new browser tab
    const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encText}`;
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
};
