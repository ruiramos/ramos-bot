import { DateTime } from 'luxon';
import { Database } from 'sqlite3';
const db = new Database('./db.sqlite');

export interface BirthdayData {
  name: string;
  date: string;
  tgId?: number;
  diff: number;
  pronoun: 'a' | 'o';
}

export function createDatabase() {
  db.run('CREATE TABLE IF NOT EXISTS birthdays (name TEXT, date TEXT, pronoun TEXT, tgId INTEGER)');
}

export function resetDatabase() {
  db.run('DELETE FROM birthdays');

  const records: Omit<BirthdayData, 'diff'>[] = [
    { name: 'Avó Madá', date: '1951-08-21', tgId: 571719707, pronoun: 'a' },
    { name: 'Miguel', date: '1977-07-17', tgId: 389395377, pronoun: 'o' },
    { name: 'Margarida', date: '1982-11-02', tgId: 588857213, pronoun: 'a' },
    { name: 'Kiko', date: '2016-07-16', pronoun: 'o' },
    { name: 'Ricardo', date: '1980-07-01', tgId: 41346049, pronoun: 'o' },
    { name: 'Júlia', date: '1986-03-06', tgId: 922178536, pronoun: 'a' },
    { name: 'Mariana', date: '1982-02-09', tgId: 660046681, pronoun: 'a' },
    { name: 'Susana', date: '1983-05-19', tgId: 504191960, pronoun: 'a' },
    { name: 'Rui', date: '1984-11-28', tgId: 516901179, pronoun: 'o' },
    { name: 'Tomás', date: '2015-06-17', pronoun: 'o' },
    { name: 'Afonso', date: '2017-06-11', pronoun: 'o' },
    { name: 'Manuel', date: '1986-10-28', tgId: 584326839, pronoun: 'o' },
    { name: 'Carolina', date: '1990-07-11', tgId: 499945316, pronoun: 'a' },
    { name: 'Madalena', date: '1995-09-23', tgId: 577000085, pronoun: 'a' },
    { name: 'João', date: '1991-04-25', tgId: 574795937, pronoun: 'o' },
    { name: 'Maria Benedita', date: '2023-01-23', pronoun: 'a' },
  ];

  records.forEach((record) => {
    db.run('INSERT INTO birthdays (name, date, tgId, pronoun) VALUES (?, ?, ?, ?)', [
      record.name,
      record.date,
      record.tgId,
      record.pronoun,
    ]);
  });
}

export function addRecord({ name, date }: Pick<BirthdayData, 'name' | 'date'>) {
  const record = { name: name.trim(), date: date.trim() };

  db.run('INSERT INTO birthdays (name, date) VALUES (?, ?)', [record.name, record.date]);
}

export function removeRecord({ name }: Pick<BirthdayData, 'name'>) {
  db.run('DELETE FROM birthdays WHERE name = ?', [name]);
}

type QueryProps = {
  sort?: string;
  direction?: 'ASC' | 'DESC';
  limit?: number;
  where?: string;
};

const buildQuery = ({ sort = 'date', where = '1=1', direction = 'ASC', limit = 400 }): string => {
  const year = DateTime.now().year;
  const diff = `julianday(strftime('${year}-%m-%d', date)) - julianday(date('now'))`;

  const query = `SELECT name, ${diff} as diff, date, tgId, pronoun
                  FROM birthdays
                  WHERE ${where}
                  ORDER BY ${sort} ${direction}
                  LIMIT ${limit}`;

  return query;
};

type GetProps = {
  sort?: string;
};

export function getRecords({ sort = 'date' }: GetProps): Promise<BirthdayData[]> {
  return new Promise((resolve, reject) => {
    db.all(buildQuery({ sort }), (err, rows: BirthdayData[]) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function getNext({ sort = 'diff' }: GetProps): Promise<BirthdayData> {
  return new Promise((resolve, reject) => {
    db.get(
      buildQuery({ sort, limit: 1, where: 'diff >= 0', direction: 'ASC' }),
      (err, row: BirthdayData) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(row);
        }
      },
    );
  });
}
