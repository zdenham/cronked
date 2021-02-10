const fetch = require('node-fetch');
const Redis = require('ioredis');
const { Worker } = require('bullmq');
const connection = new Redis(
  process.env.REDIS_URL || { host: process.env.REDIS_HOST }
);

// pluck scheduled jobs from the redis queue and fire off webhook
new Worker(
  'hooks',
  async ({ data }) => {
    const { hookUrl, hookBody } = data;
    console.log('FIRING WEBHOOK: ', hookUrl);
    const res = await fetch(hookUrl, {
      method: 'post',
      body: hookBody ? JSON.stringify(hookBody) : undefined,
      headers: { 'Content-Type': 'application/json' },
    });
  },
  {
    connection,
  }
);

console.log('Cronked worker waiting for jobs');
