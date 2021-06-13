FROM node:15.3.0

WORKDIR /code/

ADD tsconfig.json /code/tsconfig.json
ADD package-lock.json /code/package-lock.json
ADD package.json /code/package.json

RUN npm install

ADD packages /code/packages
ADD scripts /code/scripts
ADD test /code/test

RUN npm run libs:build && npm install

ENTRYPOINT "/bin/bash"
