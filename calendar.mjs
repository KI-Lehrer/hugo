import ICAL from 'ical.js';

export function calendarWeek(text, week) {
  if (
    typeof text !== 'string' ||
    text.length > 1800000 ||
    !text.includes('BEGIN:VCALENDAR')
  )
    throw new Error(
      'Bitte eine gültige Kalenderdatei (.ics, maximal 1.8 MB) auswählen.',
    );
  ICAL.TimezoneService.reset();
  let root;
  try {
    root = new ICAL.Component(ICAL.parse(text));
  } catch {
    throw new Error('Die Kalenderdatei konnte nicht gelesen werden.');
  }
  for (const component of root.getAllSubcomponents('vtimezone')) {
    const zone = new ICAL.Timezone(component);
    ICAL.TimezoneService.register(zone.tzid, zone);
  }
  const events = [],
    warnings = [],
    components = root.getAllSubcomponents('vevent');
  let budget = 20000;
  const wall = (time) => {
    if (time.isDate || time.zone.tzid === 'floating')
      return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}T${String(time.hour || 0).padStart(2, '0')}:${String(time.minute || 0).padStart(2, '0')}`;
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Zurich',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .format(time.toJSDate())
      .replace(' ', 'T');
  };
  for (const component of components) {
    if (
      component.hasProperty('recurrence-id') ||
      !component.hasProperty('dtstart')
    )
      continue;
    if (component.getFirstPropertyValue('status') === 'CANCELLED') continue;
    const tzid = component.getFirstProperty('dtstart').getParameter('tzid');
    if (tzid && !ICAL.TimezoneService.has(tzid)) {
      warnings.push(
        `Zeitzone ${tzid} fehlt in der Datei; betroffene Termine wurden ausgelassen.`,
      );
      continue;
    }
    try {
      const uid = component.getFirstPropertyValue('uid');
      const exceptions = components.filter(
        (c) =>
          c.hasProperty('recurrence-id') &&
          c.getFirstPropertyValue('uid') === uid,
      );
      const event = new ICAL.Event(component, { exceptions });
      const append = (start, end, item) => {
        if (item.component.getFirstPropertyValue('status') === 'CANCELLED')
          return;
        const begin = wall(start),
          finish = wall(end);
        if (begin.slice(0, 10) > week.end || finish < `${week.start}T00:01`)
          return;
        events.push({
          title: String(item.summary || 'Ohne Titel'),
          date: begin.slice(0, 10),
          time: start.isDate ? 'Ganztägig' : begin.slice(11, 16),
          allDay: start.isDate,
          location: String(item.location || ''),
          sortKey: begin,
        });
      };
      if (event.isRecurring()) {
        const iterator = event.iterator();
        let occurrence;
        while (budget-- > 0 && (occurrence = iterator.next())) {
          if (wall(occurrence).slice(0, 10) > week.end) break;
          const detail = event.getOccurrenceDetails(occurrence);
          append(detail.startDate, detail.endDate, detail.item);
        }
      } else append(event.startDate, event.endDate, event);
    } catch {
      warnings.push(
        'Ein Kalendereintrag konnte nicht vollständig gelesen werden.',
      );
    }
    if (events.length > 500 || budget <= 0) {
      warnings.push(
        'Auswertungsgrenze erreicht; der Kalenderauszug ist unvollständig.',
      );
      break;
    }
  }
  return {
    events: events
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(0, 100),
    warnings: [...new Set(warnings)],
    week,
  };
}

// Seven calendar days in Swiss local time, including today, across week/year/DST boundaries.
export function calendarNextDays(text, now = new Date()) {
  const start = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const last = new Date(start + 'T12:00:00Z');
  last.setUTCDate(last.getUTCDate() + 6);
  const range = { start, end: last.toISOString().slice(0, 10) };
  const parsed = text
    ? calendarWeek(text, range)
    : { events: [], warnings: [], week: range };
  return { ...parsed, range, configured: !!text };
}
