import { DateTime } from 'luxon';
import { Database } from 'sqlite3';
const db = new Database('./db.sqlite');

// 21/08/1951 — Avó Madá
// 17/07/1977 — Miguel
// 01/07/1980 — Ricardo — 41346049
// 06/03/1986 — Julia
// 23/09/1995 — Madalena
// 25/04/1991 - João
// 23/01/2023 - Maria Benedita
// 1983/05/19 - Susana
// 1984/11/28 - Rui
// 2015/06/17 - Tomas
// 2017/06/11 - Afonso

export interface BirthdayData {
  name: string;
  date: string;
  tgId?: number;
  diff: number;
}

export function createDatabase() {
  db.run('CREATE TABLE IF NOT EXISTS birthdays (name TEXT, date TEXT, tgId INTEGER)');
}

export function resetDatabase() {
  db.run('DELETE FROM birthdays');

  const records = [
    { name: 'Avó Madá', date: '1951-08-21' },
    { name: 'Miguel', date: '1977-07-17' },
    { name: 'Ricardo', date: '1980-07-01', tgId: 41346049 },
    { name: 'Júlia', date: '1986-03-06' },
    { name: 'Madalena', date: '1995-09-23' },
    { name: 'João', date: '1991-04-25' },
    { name: 'Maria Benedita', date: '2023-01-23' },
    { name: 'Susana', date: '1983-05-19' },
    { name: 'Rui', date: '1984-11-28' },
    { name: 'Tomás', date: '2015-06-17' },
    { name: 'Afonso', date: '2017-06-11' },
  ];

  records.forEach((record) => {
    db.run('INSERT INTO birthdays (name, date, tgId) VALUES (?, ?, ?)', [
      record.name,
      record.date,
      record.tgId,
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

  const query = `SELECT name, ${diff} as diff, date, tgId
                  FROM birthdays
                  WHERE ${where}
                  ORDER BY ${sort} ${direction}
                  LIMIT ${limit}`;
  console.log('SQL: ', query);
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
        console.log('RESOLVING', rows);
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
          console.log('RESOLVING', row);
          resolve(row);
        }
      },
    );
  });
}
