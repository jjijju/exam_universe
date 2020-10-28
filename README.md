# 도커 개발 환경 구성하기

대중적으로 많이 쓰이는 환경을 도커로 구축해봤다.

구성은 다음과 같다.

-   Client : React
-   API Server : NodeJS Express
-   DB : Mongo
-   Server : Nginx
-   Cache : Redis

## Root

3개의 폴더와 `docker-compose.yml` 파일로 구성된다.

```cmd
📦docker-base
 ┣ 📂client
 ┃ ┗ 📂sources
 ┃ ┗ 📜Dockerfile
 ┣ 📂nginx
 ┃ ┗ 📂conf
 ┃ ┃ ┗ 📜dev.conf
 ┃ ┗ 📂logs
 ┃ ┗ 📜Dockerfile
 ┣ 📂server
 ┃ ┗ 📂sources
 ┃ ┗ 📜Dockerfile
 ┗ 📜docker-compose.yml
```

## Client

1. `create-react-app`을 이용해서 구성

    ```cmd
    npx create-react-app client
    ```

2. `Dockerfile` 파일을 생성

    ```
    # node가 담긴 alpine 이미지 가져오기
    FROM node:12.18-alpine

    # 작업할 디렉토리 설정
    WORKDIR /usr/app

    # npm install을 캐싱하기 위해 package.json만 따로 copy
    COPY package*.json ./

    # NPM 설치
    RUN npm install

    # 소스 복사
    COPY . .

    # Port 설정
    EXPOSE 3000

    # client 소스 실행
    CMD ["npm", "run", "start"]
    ```

## Server

1. `express generator`를 이용해서 구성

    ```cmd
    npm install -g express-generator

    express server
    ```

2. `package.json`에 실시간 개발환경을 위해 `nodemon` 추가

    ```
    "scripts": {
    	"dev": "nodemon" ./bin/www,
    	"start": "node ./bin/www"
    },
    ```

3. `Dockerfile` 파일을 생성

    ```
    # node가 담긴 alpine 이미지 가져오기
    FROM node:12.18-alpine

    # 작업할 디렉토리 설정
    WORKDIR /usr/app

    # npm install을 캐싱하기 위해 package.json만 따로 copy
    COPY package*.json ./

    # NPM 설치 && nodemon 설치
    RUN npm install -g nodemon \
     && npm install

    # 소스 복사
    COPY . .

    # client 소스 실행
    CMD ["npm", "run", "start"]
    ```

## Nginx

> 프록시 서버로 동작

Client와 Sever 부분을 따로 프록시로 관리  
Server는 / 로 들어오는 요청을 `/api` 로 바꿔준다.

1. `nginx/dev.conf` 파일 작성

    ```
    upstream server {
        server server:3000;
    }

    upstream client {
        server client:3000;
    }

    server {
    	listen 80;

    	# 로그 파일을 저장하는 부분
    	access_log /var/log/nginx/access.log;
    	error_log /var/log/nginx/error.log;

    	location / {
    		proxy_pass http://client;
    	}

    	location /sockjs-node {
            proxy_pass http://client;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
        }

    	location /api {
    		proxy_pass http://server;
    		rewrite /api/(.*) /$1 break;
    	}
    }
    ```

2. `Dockerfile` 파일을 생성

    ```
    FROM nginx

    RUN mkdir -p /var/log/nginx

    COPY ./conf/dev.conf /etc/nginx/conf.d/default.conf
    ```

## Docker Compose

기본 생성된 파일들을 간편하게 한번에 올릴수 있도록 `docker-compose`로 묶어준다.

```yaml
version: '3.4'

services:
    nginx:
        restart: always
        build:
            dockerfile: Dockerfile
            context: ./nginx
        ports:
            - '8080:80'
        volumes:
            - ./Nginx/logs:/var/log/nginx
        networks:
            - backend

    mongo:
        container_name: mongo
        image: mongo
        volumes:
            - data:/data/db
        ports:
            - '27017:27017'
        networks:
            - backend

    client:
        build:
            dockerfile: Dockerfile
            context: ./client
        ports:
            - '${CLIENT_PORT}:3000'
        volumes:
            - ./client:/usr/app
            - /usr/app/node_modules
        env_file:
            - .env
        networks:
            - backend

    server:
        build:
            dockerfile: Dockerfile
            context: ./server
        ports:
            - '${SERVER_PORT}:3000'
        volumes:
            - ./server:/usr/app
            - /usr/app/node_modules
        env_file:
            - .env
        networks:
            - backend
        depends_on:
            - mongo
            - redis

    redis:
        container_name: redis
        image: redis
        networks:
            - backend
        volumes:
            - data:/data/redis
        ports:
            - '6379:6379'
        restart: always

networks:
    backend:
        driver: bridge

volumes:
    data:
        driver: local
```

위 내용은 기본적으로 서비스를 5개를 실행한다.

-   client
-   server
-   mongo
-   redis
-   nginx

위 서비스를 파일 하나로 묶어서 배포가 가능하다.

## 실행

```
# --build는 내부 Dockerfile 이 변경시 다시 컴파일 해준다.
docker-compose up --build
or
docker-compose up

```
