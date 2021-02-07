const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { v4 } = require('uuid');
const validUrl = require('./lib/validUrl');
const { Queue, QueueScheduler, Worker } = require('bullmq');

const app = express();
const port = 3500;

const queueScheduler = new QueueScheduler('hooks');
const hooksQueue = new Queue('hooks');

const worker = new Worker('hooks', async ({ name, data }) => {
  const { url, body } = data;
  const res = await fetch(url, {
    method: 'post',
    body: body ? JSON.stringify(body) : '{}',
    headers: { 'Content-Type': 'application/json' },
  });
});

app.use(bodyParser.json({ type: 'application/json' }));

app.post('/hooks', async (req, res) => {
  try {
    const { every, limit, cron, url, delay, body } = req.body;

    if (!cron && !every) {
      throw new Error('One of the following must not be null');
    }

    if (cron && every) {
      throw new Error('Cron and every parameters cannot be used together');
    }

    if (!validUrl(url)) {
      throw new Error('A url must be provided for the webhook');
    }

    await hooksQueue.add(
      v4(),
      { url, body },
      {
        delay,
        repeat: {
          every,
          limit,
          cron,
        },
      }
    );

    res.status(200).send(JSON.stringify({ status: 'queued', url }));
  } catch (e) {
    res.status(400).send(JSON.stringify({ error: e.message }));
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
