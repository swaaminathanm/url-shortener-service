const nanoid = require('nanoid').nanoid;
const redis = require("redis");
const asyncRedis = require("async-redis");
const express = require('express');

const MAX_KEY_LENGTH = 6;
const USED_BUCKET_KEY = "keys:used";
const NEW_BUCKET_KEY = "keys:new";
const SERVER_PORT = process.env.PORT || "8000";
const MAX_PERSISTED_NEW_KEYS_COUNT = 1000000;

const redisConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost'
}
const redisClient = asyncRedis.decorate(redis.createClient(redisConnectionOptions));
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

const getBucketSize = async (bucketKey) => {
  return await redisClient.scard(bucketKey);
}

setInterval(async () => {
  try {
    const count = await getBucketSize(NEW_BUCKET_KEY);
    if (count < MAX_PERSISTED_NEW_KEYS_COUNT) {
      await putKey(generateRandomKey());
    }
  } catch (err) {
    console.log("error setInterval putKey " + err);
  }
}, 100);

server.get('/key', async (req, res) => {
  const key = await getKey();
  res.json({ key })
});

server.get('/', async (req, res) => {
  res.sendStatus(200);
});

server.listen(SERVER_PORT, () => console.log(`Key Generation Service listening at port ${SERVER_PORT}`));