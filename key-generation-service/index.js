const express = require('express');
const customAlphabet = require('nanoid').customAlphabet;
const { Pool } = require('pg')

require('dotenv').config();

const KEY_SIZE = 6;
const SERVER_PORT = process.env.PORT || "8000";
const KEY_CHARACTERS_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
const NEW_KEYS_MAX_COUNT = 1000000;
const KEY_GENERATION_INTERVAL_MS = 500;

const nanoId = customAlphabet(KEY_CHARACTERS_SET, KEY_SIZE);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const server = express();

const generateKey = () => nanoId();

const getKey = async () => {
  const client = await pool.connect();

  try {
    let queryResult;

    await client.query('BEGIN');

    await client.query("LOCK TABLE used_keys IN ACCESS EXCLUSIVE MODE");
    await client.query("LOCK TABLE new_keys IN ACCESS EXCLUSIVE MODE");

    const getKeyFromNewKeysTable = "SELECT key FROM new_keys LIMIT 1"
    queryResult = await client.query(getKeyFromNewKeysTable);

    if (queryResult.rows.length <= 0) {
      await client.query('ROLLBACK');
    } else {
      const key = queryResult.rows[0].key;

      const deleteKeyFromNewKeysTable = "DELETE FROM new_keys WHERE key LIKE $1";
      await client.query(deleteKeyFromNewKeysTable, [key]);

      const insertKeyIntoUsedTableQuery = "INSERT INTO used_keys(key) VALUES($1)"
      await client.query(insertKeyIntoUsedTableQuery, [key]);
      await client.query('COMMIT');

      return key;
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e
  } finally {
    client.release();
  }
}

const insertKey = async (key) => {
  const client = await pool.connect();

  try {
    let queryResult;

    await client.query('BEGIN');

    await client.query("LOCK TABLE used_keys IN ACCESS EXCLUSIVE MODE");
    await client.query("LOCK TABLE new_keys IN ACCESS EXCLUSIVE MODE");

    const checkIfKeyPresentInUsedTableQuery = "SELECT key FROM used_keys WHERE key LIKE $1"
    queryResult = await client.query(checkIfKeyPresentInUsedTableQuery, [key]);

    if (queryResult.rows.length > 0) {
      await client.query('ROLLBACK');
    } else {
      const insertKeyInNewKeysTableQuery = "INSERT INTO new_keys(key) VALUES($1)"
      await client.query(insertKeyInNewKeysTableQuery, [key]);
      await client.query('COMMIT');
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e
  } finally {
    client.release();
  }
}

const getCountOfNewKeys = async () => {
  const client = await pool.connect();
  const queryResult = await client.query("SELECT COUNT(*) FROM new_keys");
  client.release();
  return parseInt(queryResult.rows[0].count);
}

const startGeneratingNewKeys = () => {
  setInterval(async () => {
    const countOfNewKeys = await getCountOfNewKeys();
    if (countOfNewKeys < NEW_KEYS_MAX_COUNT) {
      try {
        await insertKey(generateKey());
      } catch (err) {
        console.error(err);
      }
    }
  }, KEY_GENERATION_INTERVAL_MS);
}

server.get('/key', async (req, res) => {
  let key;

  try {
    key = await getKey();
  } catch (err) {
    console.error(err);
  }

  res.json({ key: key || null });
});

server.get('/', async (req, res) => {
  res.sendStatus(200);
});

server.listen(SERVER_PORT, () => {
  startGeneratingNewKeys();
  console.log(`Key Generation Service listening at port ${SERVER_PORT}`);
});