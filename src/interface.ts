import { DateTime, DateTimeFormatOptions } from 'luxon';
import { BirthdayData } from './database';

export function formatDate(date: string): string {
  const dateJS = new Date(date);

  const options: DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  };

  return dateJS.toLocaleDateString('pt-PT', { ...options });
}

export function formatLine(record: BirthdayData): string {
  const age = DateTime.fromISO(record.date).diffNow('years').years * -1;

  return `<code>${formatDate(record.date)}</code> — ${record.name} (${Math.floor(age)})`;
}
