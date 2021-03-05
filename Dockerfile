FROM node

WORKDIR /coinpanel
COPY . .

RUN npm install --only=prod

CMD ./coinpanel.js monitor BTCUSDT 45000
