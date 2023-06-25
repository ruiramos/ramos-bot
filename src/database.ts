import { Database } from 'sqlite3';
const db = new Database('./db.sqlite');

// 21/08/1951 — Avó Madá (71)
// 17/07/1977 — Miguel (45)
// 01/07/1980 — Ricardo (42)
// 06/03/1986 — Julia (37)
// 23/09/1995 — Madalena (27)

export interface BirthdayData {
  name: string;
  date: string;
}

export function createDatabase() {
  db.run('CREATE TABLE IF NOT EXISTS birthdays (name TEXT, date TEXT)');
}

export function addRecord({ name, date }: BirthdayData): BirthdayData {
  const record = { name: name.trim(), date: date.trim() };

  db.run('INSERT INTO birthdays (name, date) VALUES (?, ?)', [record.name, record.date]);

  return record;
}

export function removeRecord({ name }: { name: string }) {
  db.run('DELETE FROM birthdays WHERE name = ?', [name]);
}

export function getRecords(): Promise<BirthdayData[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT name, date FROM birthdays ORDER BY date ASC', (err, rows: BirthdayData[]) => {
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
