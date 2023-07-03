import { DateTime, DateTimeFormatOptions, Duration } from 'luxon';
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

export function getAge(date: string): number {
  return DateTime.fromISO(date).diffNow('years').years * -1;
}

export function birthdayLine(record: BirthdayData): string {
  const duration = Duration.fromObject({ days: record.diff });

  return `\`${formatDate(record.date)}\` — ${record.name} — ${duration.toFormat('d')} dias`;
}

export function ageLine(record: BirthdayData): string {
  const age = getAge(record.date);

  return `\`${formatDate(record.date)}\` — ${record.name}, ${Math.floor(age)}`;
}

export function nextBirthday(record: BirthdayData): string {
  const age = getAge(record.date);

  const differenceToBirthday = DateTime.now()
    .setLocale('pt-PT')
    .plus({ days: record.diff })
    .toRelative();

  let name = record.name;

  if (record.tgId) {
    name = `[${name}](tg://user?id=${record.tgId})`;
  }

  const nextAge = Math.floor(age) + (record.diff === 0 ? 0 : 1);

  const daysToBirthday = record.diff > 0 ? differenceToBirthday : 'hoje 🎉';

  return `Próximo aniversariante — *${name}*, faz *${nextAge}* anos \\(${daysToBirthday}\\)`;
}
