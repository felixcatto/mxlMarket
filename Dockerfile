FROM node:12.18.4

RUN mkdir mxlMarket
WORKDIR mxlMarket
COPY package.json package-lock.json /mxlMarket/
RUN npm i
COPY . .
RUN make build
EXPOSE 4000

CMD ["node", "dist/bin/server.js"]
