const fetch = require('node-fetch');
const { Worker } = require('bullmq');

// pluck jobs from the redis queue and fire off webhook
new Worker('hooks', async ({ data }) => {
  const { url, body } = data;
  const res = await fetch(url, {
    method: 'post',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
});
