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

// export function daysToBirthday(date: string): number {
//   const birthdayThisYear = DateTime.fromISO(date).set({ year: DateTime.now().year });

//   let daysToBirthday = birthdayThisYear.diffNow('days').days;

//   if (daysToBirthday < 0) {
//     daysToBirthday = birthdayThisYear.plus({ years: 1 }).diffNow('days').days;
//   }

//   return daysToBirthday;
// }

export function birthdayLine(record: BirthdayData): string {
  const duration = Duration.fromObject({ days: Math.abs(record.diff) });

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

  const nextAge = Math.floor(age) + 1;

  const daysToBirthday = record.diff > 0 ? differenceToBirthday : 'hoje\\!';

  return `Próximo aniversariante — *${record.name}*, faz *${nextAge}* anos \\(${daysToBirthday}\\)`;
}
