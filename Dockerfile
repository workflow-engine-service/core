FROM node:alpine as build

# Set the working directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json .

# RUN npm install
# If you are building your code for production
RUN npm i --only=production

# Bundle app source
COPY . .

RUN mkdir -p docker/configs
RUN mv configs.json docker/configs

# RUN ls
# RUN ls /app/docker/configs
# compile sources
RUN npm run build

EXPOSE 8080

CMD ["node", "build/index.js", "prod"]