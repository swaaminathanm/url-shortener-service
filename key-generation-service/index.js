const nanoid = require('nanoid').nanoid;
const redis = require("redis");
const asyncRedis = require("async-redis");
const express = require('express');

const MAX_KEY_LENGTH = 6;
const USED_BUCKET_KEY = "keys:used";
const NEW_BUCKET_KEY = "keys:new";
const SERVER_PORT = "8000";
const MAX_KEY_CACHED_COUNT = 1000000;

const inMemoryKeys = [];
const redisClient = asyncRedis.decorate(redis.createClient());
const server = express();

const generateRandomKey = () => nanoid(MAX_KEY_LENGTH);

const getKey = async () => {
  const key = await redisClient.spop(NEW_BUCKET_KEY);

  const multi = redisClient.multi();
  await multi.hset(USED_BUCKET_KEY, key, true);
  await multi.exec();

  return key;
};

const putKey = async (key) => {
  await redisClient.watch(USED_BUCKET_KEY);
  const multi = redisClient.multi();
  const existingKey = await redisClient.hget(USED_BUCKET_KEY, key);
  if (!existingKey) await redisClient.sadd(NEW_BUCKET_KEY, key);
  await multi.exec();
};

setInterval(async () => {
  try {
    await putKey(generateRandomKey());
  } catch (err) {
    console.log("error setInterval putKey " + err);
  }
}, 100);

setInterval(async () => {
  try {
    if (inMemoryKeys.length < MAX_KEY_CACHED_COUNT) {
      const key = await getKey();
      if (key) {
        inMemoryKeys.push(key);
      }
    }
  } catch (err) {
    console.log("error setInterval getKey " + err);
  }
}, 100);

server.get('/', (req, res) => {
  res.json({ key: inMemoryKeys.pop() })
});

server.listen(SERVER_PORT, () => console.log(`Key Generation Service listening at port ${SERVER_PORT}`));