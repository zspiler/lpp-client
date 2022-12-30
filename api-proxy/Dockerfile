FROM node:lts-alpine
WORKDIR /app
COPY package*.json .
RUN npm i
RUN npm i -g nodemon
COPY . . 
CMD [ "npm", "run", "dev" ]