FROM debian:stretch-slim

LABEL "com.github.actions.name"="NPM Test Matrix"
LABEL "com.github.actions.description"="Runs npm test with several versions of node"
LABEL "com.github.actions.icon"="check-circle"
LABEL "com.github.actions.color"="orange"

RUN apt-get update && \
  apt-get install -y gnupg apt-transport-https

COPY config/docker.key /tmp/docker.key
RUN apt-key add /tmp/docker.key
COPY config/nodesource.key /tmp/nodesource.key
RUN apt-key add /tmp/nodesource.key
COPY config/sources.list /etc/apt/sources.list.d/custom.list

RUN apt-get update && \
  apt-get install -y docker-ce nodejs

WORKDIR /matrix

COPY *.md /
COPY package*.json ./

RUN npm ci

COPY . .

ENTRYPOINT ["node", "/matrix/index.js"]
