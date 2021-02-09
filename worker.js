const fetch = require('node-fetch');
const { Worker } = require('bullmq');

// pluck scheduled jobs from the redis queue and fire off webhook
new Worker('hooks', async ({ data }) => {
  const { hookUrl, hookBody } = data;
  const res = await fetch(url, {
    method: 'post',
    body: hookBody ? JSON.stringify(hookBody) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
});

console.log('Cronked worker waiting for jobs');
