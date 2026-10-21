import postgres from 'postgres';
import { readFile } from 'node:fs/promises';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL ontbreekt');

const sql = postgres(url, { max: 1, prepare: false });

try {
  const schema = await readFile(
    new URL('../schema.sql', import.meta.url),
    'utf8'
  );
  await sql.begin(async transaction => {
    await transaction.unsafe(schema);
  });
  console.log('Databasetabel is klaar.');
} finally {
  await sql.end();
}
