## NOTE: connect.ts with handler function
###run=> docker build -t connect --target connect .

#connect
FROM amazon/aws-lambda-nodejs:18 AS connect

ARG FUNCTION_DIR="var/task"

COPY package.json .

RUN npm install && npm install typescript -g

COPY . .

RUN tsc

RUN mkdir -p ${FUNCTION_DIR}

CMD ["build/connect.handler"] 

#disconnect
FROM amazon/aws-lambda-nodejs:18 AS disconnect

ARG FUNCTION_DIR="var/task"

COPY package.json .

RUN npm install && npm install typescript -g

COPY . .

RUN tsc

RUN mkdir -p ${FUNCTION_DIR}

CMD ["build/disconnect.handler"] 

#sendmovie
FROM amazon/aws-lambda-nodejs:18 AS sendmovie

ARG FUNCTION_DIR="var/task"

COPY package.json .

RUN npm install && npm install typescript -g

COPY . .

RUN tsc

RUN mkdir -p ${FUNCTION_DIR}

CMD ["build/sendmovie.handler"] 

#getmovies
FROM amazon/aws-lambda-nodejs:18 AS getmovies

ARG FUNCTION_DIR="var/task"

COPY package.json .

RUN npm install && npm install typescript -g

COPY . .

RUN tsc

RUN mkdir -p ${FUNCTION_DIR}

CMD ["build/getmovies.handler"] 

#crudmovie
FROM amazon/aws-lambda-nodejs:18 AS crudmovie

ARG FUNCTION_DIR="var/task"

COPY package.json .

RUN npm install && npm install typescript -g

COPY . .

RUN tsc

RUN mkdir -p ${FUNCTION_DIR}

CMD ["build/crudmovie.handler"] 

