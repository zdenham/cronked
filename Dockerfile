FROM node:alpine
RUN yarn install

RUN mkdir -p /usr/src
WORKDIR /usr/src

COPY . /usr/src

RUN yarn install --production=true

CMD ["yarn", "run", "start"]