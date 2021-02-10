# Cronked

Cronked is an API to schedule recurring tasks via webhooks. It's particularly useful as an alternative to cron for distributed or serverless applications. Cronked exposes a simple http API on top of two battle tested frameworks: [redis](https://github.com/redis/redis) and [bullmq](https://github.com/taskforcesh/bullmq).

## Why Cronked?

Originally, I was using CloudWatch Events for a similar use case (scheduling recurring hooks), but CWE maxes out at 5k rules. If you need to schedule a significant number of recurring jobs, you'll need to roll your own solution: hence, Cronked. The Cronked API is also easy to deploy and consume, requiring far less tinkering than CWE to get up and running after cloning the repo.

## Schedule Your First Sequence

The following will schedule a recurring `POST` request to 'https://example.com/api/path' with the specified body every 10 seconds (after a 5 second delay) until the hook has been called 10 times.

```
curl --request POST \
  --url https://cronked.herokuapp.com/v1/hooks \
  --header 'Content-Type: application/json' \
  --data '{
    "delay": 5000,
    "every": 10000,
    "limit": 10,
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

In dev, both the cronked Server and Worker will run concurrently and interact with your local redis server.

```
git clone https://github.com/zdenham/cronked.git
cd cronked
yarn install
yarn dev
```

**Note**: Redis must be running locally for the dev environment to work, you can see instructions to get redis up and running [here](https://redis.io/topics/quickstart).

Alternatively, to run a containerized version of cronked and redis, simply run `docker-compouse up --build`.

The server will be made available at http://localhost:3500

## Deploy Your Own Instance

The quickest & scrappiest way to deploy Cronked is via the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli). For simplicity you can run the worker and server on the same node and utilize Heroku's Redis add on. Here are some deployment instructions to get up and running:

1. `git clone https://github.com/zdenham/cronked.git && cd cronked`
2. `heroku login`
3. `heroku apps:create [app_name]`
4. Navigate to https://dashboard.heroku.com > [app_name] > Resources
5. In the add ons section, search "Heroku Redis," select the add on and confirm
6. `heroku git:remote -a [app_name]`
7. `git push heroku main`

## TODO

- [ ] Authentication
- [ ] `GET` endpoint to see current status of a sequence by webhook ID
- [ ] `DELETE` endpoint to cancel a given sequence
- [ ] Specify logic around webhook retries / failures
