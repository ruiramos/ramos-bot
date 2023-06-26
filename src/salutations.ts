import { BirthdayData } from './database';
import { getAge } from './interface';

type CongratMessage = (record: BirthdayData) => string;

const messages: CongratMessage[] = [
  ({ name, date }) =>
    `🎂 O bebé de hoje é *${name}* que faz ${Math.round(
      getAge(date),
    )} anos! 🥳🎉 Parabéns ${name}, FELICIDADE SEM FIM ❤️❤️❤️`,
  ({ name, date }) =>
    `🎂 Hoje é o dia de *${name}* que celebra ${Math.round(
      getAge(date),
    )} anos! 🥳🎉 Muitos parabéns ${name}, FELICIDADE SEM FIM ❤️❤️❤️`,
  ({ name, date }) =>
    `🎂 Que dia épico! *${name}* faz anos e conta já com ${Math.round(
      getAge(date),
    )} aninhos! 🥳🎉 Parabéns ${name}, FELICIDADE SEM FIM ❤️❤️❤️`,
];

export default messages;
