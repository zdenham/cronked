# Cronked

Cronked is an API to schedule recurring tasks via webhooks. It's particularly useful as an alternative to cron for distributed or serverless applications. Cronked exposes a simple http API on top of two battle tested frameworks: [redis](https://github.com/redis/redis) and [bullmq](https://github.com/taskforcesh/bullmq).

## Why Cronked?

Originally, I was using CloudWatch Events for a similar use case (scheduling recurring hooks), but CWE maxes out at 5k rules. If you need to schedule a significant number of recurring jobs, you'll need to roll your own solution: hence, Cronked. The Cronked API is also easy to deploy and consume, requiring far less tinkering than CWE to get up and running.

## Schedule Your First Sequence

The following will schedule a recurring `POST` request to 'https://example.com/api/path' with the specified body every 10 seconds (after a 5 second delay) until the hook has been called 10 times.

```
curl --request POST \
  --url https://api.cronked.io/v1/hooks \
  --header 'Content-Type: application/json' \
  --data '{
    "delay": 5000,
    "every": 10000, // repeat interval ms
    "limit": 10, // max occurances
    "hookUrl": "https://example.com/api/path",
    "hookBody": {
      "optional_key": "optional_value"
    }
  }'
```

## API

For now, there is just one endpoint: a `POST` request to `/v1/hooks`

**Request Body**
| Key |Type |Description |
|----------------|-------------------------------|-----------------------------|
|hookUrl | String | The url which will be posted to by cronked |
|delay? |Number |Time in MS before firing first Webhook |
|every? |Number |Interval in MS for hook to fire. **Note** cannot be used with 'cron'. |
|limit? |Number |Maximum number of times the hook will fire |
|cron? |String |Cron expression which specifies when to fire the webhook using [cron-parser](https://github.com/harrisiirak/cron-parser)'s "unix cron w/ optional seconds" format. **Note** cannot be used with 'every'.|
|hookBody?|Object |Optional body to be passed by the web hook|

## Development

**Note**: Redis must be running locally for the dev environment to work, you can see instructions to get redis up and running [here](https://redis.io/topics/quickstart).

In dev, both the cronked Server and Worker will run concurrently and interact with your local redis server.

```
git clone https://github.com/zdenham/cronked.git
cd cronked
yarn install
yarn dev
```

## Deploy Your Own Instance (via Heroku)

## TODO

- [ ] Authentication
- [ ] `GET` endpoint to see current status of a sequence by webhook ID
- [ ] `DELETE` endpoint to cancel a given sequence
- [ ] Specify logic around webhook retries / failures
