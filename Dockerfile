FROM node:11

RUN apt-get update && \
  apt-get install -y lsof vim

WORKDIR /code/

ADD package-lock.json /code/package-lock.json
ADD package.json /code/package.json

RUN npm install

ADD lib /code/lib
ADD test /code/test
ADD . /code/

ENTRYPOINT "/bin/bash"
