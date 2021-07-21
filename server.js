const express = require('express');
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

const errorHandlingMiddleware = (error, _, res) => {
  console.log('CAUGHT AN ERROR:', error);
  if (error) {
    if (e.message.indexOf('Bad Request') !== -1) {
      e.status = 400;
    }

    res.status(error.status || 500).send({
      status: 'failed',
      error: error.message || 'Internal Server Error',
    });
  }
};

app.use(express.json({ type: 'application/json' }));

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

    console.log('CREATED A HOOK WITH ID: ', id);

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
        jobId: id,
      }
    );

    res.status(200).send(JSON.stringify({ status: 'succeeded', hookUrl, id }));
  } catch (e) {
    // fire error handling middleware
    next(e);
  }
});

app.get('/v1/hooks', async (req, res, next) => {
  try {
    const jobs = await hooksQueue.getJobs(['delayed', 'active']);

    console.log('FETCHING ALL HOOKS');

    const hooks = jobs.map((job) => {
      const { count: _, ...otherRepeatOpts } = job.opts.repeat;

      return {
        id: job.name,
        ...otherRepeatOpts,
        ...job.data,
      };
    });

    res.status(200).send(JSON.stringify({ status: 'succeeded', hooks }));
  } catch (e) {
    next(e);
  }
});

app.delete('/v1/hooks/:hookId', async (req, res, next) => {
  try {
    const hookIdToDelete = req.params.hookId;
    if (!hookIdToDelete) {
      throw new Error('Bad Request: No hook id was provided to delete');
    }

    const repeatables = await hooksQueue.getRepeatableJobs();

    console.log('ATTEMPTING TO DELETE HOOK: ', hookIdToDelete);

    const keysToDelete = repeatables
      .map(({ key }) => {
        return key;
      })
      .filter((key) => {
        return key.indexOf(hookIdToDelete) !== -1;
      });

    if (!keysToDelete.length) {
      throw new Error('Bad Request: hook with given id does not exist');
    }

    const keyToDelete = keysToDelete[0];

    await hooksQueue.removeRepeatableByKey(keyToDelete);

    // remove any pending jobs associated
    const delayedJobs = await hooksQueue.getJobs(['delayed']);

    const deleteJobPromises = delayedJobs
      .filter((job) => {
        return job.name === hookIdToDelete;
      })
      .map(async (job) => {
        try {
          await job.remove();
          return true;
        } catch (e) {
          // no-op remove function will throw
          // if the job is currently being processed
          return false;
        }
      });

    await Promise.all(deleteJobPromises);

    res.status(200).send(JSON.stringify({ status: 'succeeded' }));
  } catch (e) {
    next(e);
  }
});

app.post('/v1/ping', async (req, res) => {
  console.log('PING Received - PONGING');
  res.status(200).send('PONG');
});

app.use(errorHandlingMiddleware);

app.listen(port, () => {
  console.log(`Cronked server listening at http://localhost:${port}`);
});
