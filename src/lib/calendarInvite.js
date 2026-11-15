/**
 * Calendar invite helper for Google Calendar link & RFC 5545 .ics download
 */

function parseDateTime(dateStr, timeStr) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm" (IST: UTC+5:30)
  if (!dateStr) return new Date();
  const time = timeStr || '14:00';
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(hours || 14, minutes || 0, 0, 0);
  return d;
}

function formatUtcCompact(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateGoogleCalendarUrl({
  title = 'Interview Discussion',
  description = '',
  location = 'Google Meet',
  date = '',
  time = '14:00',
  durationMinutes = 45,
}) {
  const start = parseDateTime(date, time);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const startUtc = formatUtcCompact(start);
  const endUtc = formatUtcCompact(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile({
  title = 'Interview Discussion',
  description = '',
  location = 'Google Meet',
  date = '',
  time = '14:00',
  durationMinutes = 45,
  fileName = 'interview-invite.ics',
}) {
  const start = parseDateTime(date, time);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const startUtc = formatUtcCompact(start);
  const endUtc = formatUtcCompact(end);
  const nowUtc = formatUtcCompact(new Date());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JobConnect India//Recruitment Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@jobconnect.in`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/\n/g, ' ')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
