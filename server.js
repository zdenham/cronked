const express = require('express');
const bodyParser = require('body-parser');
const { v4 } = require('uuid');
const validUrl = require('./lib/validUrl');
const Redis = require('ioredis');
const { Queue, QueueScheduler } = require('bullmq');
const connection = new Redis(
  process.env.REDIS_URL || { host: process.env.REDIS_HOST }
);

const app = express();
const port = process.env.PORT || 3500;

new QueueScheduler('hooks', { connection });
const hooksQueue = new Queue('hooks', { connection });

const errorHandlingMiddleware = (error, req, res, next) => {
  if (error) {
    res.status(error.status || 500).send({
      status: 'failed',
      error: error.message || 'Internal Server Error',
    });
  }
};

app.use(bodyParser.json({ type: 'application/json' }));

app.post('/v1/hooks', async (req, res, next) => {
  try {
    const { every, limit, cron, hookUrl, delay, hookBody } = req.body;

    // validation
    if (!cron && !every) {
      throw new Error('Bad Request: Either cron or every must be provided');
    }

    if (cron && every) {
      throw new Error('Bad Request: Cron and every cannot be used together');
    }

    if (!validUrl(hookUrl)) {
      throw new Error('Bad Request: A valid url must be provided for the hook');
    }

    const id = v4();

    // add repeatable sequence to redis queue
    await hooksQueue.add(
      id,
      { hookUrl, hookBody },
      {
        delay,
        repeat: {
          every,
          limit,
          cron,
        },
      }
    );

    res.status(200).send(JSON.stringify({ status: 'succeeded', hookUrl, id }));
  } catch (e) {
    // fire error handling middleware
    if (e.message.indexOf('Bad Request') !== -1) {
      e.status = 400;
    }
    next(e);
  }
});

app.use(errorHandlingMiddleware);

app.listen(port, () => {
  console.log(`Cronked server listening at http://localhost:${port}`);
});
