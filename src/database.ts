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

export function addRecord({ name, date }: Pick<BirthdayData, 'name' | 'date'>) {
  db.run('INSERT INTO birthdays (name, date) VALUES (?, ?)', [name, date]);
}

export function removeRecord({ name }: Pick<BirthdayData, 'name'>) {
  db.run('DELETE FROM birthdays WHERE name = ?', [name]);
}

export function clearDB() {
  db.run('DELETE from birthdays');
}


type QueryProps = {
  sort?: string;
  direction?: 'ASC' | 'DESC';
  limit?: number;
  where?: string;
};

const buildQuery = ({ sort = 'date', where = '1=1', direction = 'ASC', limit = 400 }): string => {
  const year = DateTime.now().year;
  const bday = (y = year) => `julianday(strftime('${y}-%m-%d', date))`;
  const now = `julianday(date('now'))`;
  const diff = `IIF(${bday()} > ${now},  ${bday()} - ${now}, ${bday(year+1)} - ${now})`;

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
