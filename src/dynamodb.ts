import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DateTime } from 'luxon';

console.log('Connecting to the dynamo DB:', process.env.DYNAMO_DB_NAME);
// const db = CyclicDB(process.env.DYNAMO_DB_NAME);
const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const ddbDocClient = DynamoDBDocument.from(client);

export interface BirthdayData {
  name: string;
  date: string;
}

const COLLECTION_NAME = 'birthdays';
console.log('Collection name:', COLLECTION_NAME);

export async function addBirthday(record: BirthdayData) {
  await ddbDocClient.put({
    TableName: COLLECTION_NAME,
    Item: {
      name: record.name,
      date: record.date,
    },
  });
}

export async function getBirthdays() {
  //return await birthdays.list();
}

export async function getBirthday(name: string) {
  //return await birthdays.get(name);
}

export async function removeBirthday(name: string) {
  //return await birthdays.delete(name);
}
