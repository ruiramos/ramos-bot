const CyclicDB = require('@cyclic.sh/dynamodb');
console.log(process.env.DYNAMO_DB_NAME);
const db = CyclicDB(process.env.DYNAMO_DB_NAME);

const run = async function () {
  let animals = db.collection('birthdays');

  // create an item in collection with key "leo"
  let leo = await animals.set('Ricardo', {
    name: 'Ricardo',
    date: '1980-07-01',
  });

  // get an item at key "leo" from collection animals
  let item = await animals.get('Ricardo');
  console.log(item);
};
run();
