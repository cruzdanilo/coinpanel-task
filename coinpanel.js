#!/usr/bin/env node
require('dotenv').config();
const WebSocket = require('ws');

const {
  BINANCE_BASE_WS = 'wss://stream.binance.com',
} = process.env;

/** @type {WebSocket} */
let websocket = null;

const monitor = async ({ symbol, value }) => {
  if (websocket) return;

  websocket = new WebSocket(`${BINANCE_BASE_WS}/ws`, { perMessageDeflate: false });

  let messageId = 0;
  websocket.on('open', async () => websocket.send(JSON.stringify({
    id: messageId++, method: 'SUBSCRIBE', params: [`${symbol.toLowerCase()}@trade`],
  })));

  websocket.on('message', (json) => {
    const { e: event, p: priceString, s: eventSymbol } = JSON.parse(json);
    if (event !== 'trade' || eventSymbol !== symbol) return;

    const price = Number(priceString);
    if (price <= value) return;

    console.log(new Date(), symbol, price);
  });

  websocket.on('error', () => websocket.terminate());
  websocket.on('close', () => {
    websocket = false;
    setTimeout(monitor, 5_000, { symbol, value });
  });
};

require('yargs').command({
  command: ['monitor <symbol> <value>', '$0'],
  describe: 'monitor trade stream data',
  builder: (yargs) => yargs
    .positional('symbol', { describe: 'pair to be monitored (ex: BTCUSDT)', type: 'string' })
    .positional('value', { describe: 'minimum price for action', type: 'number' }),
  handler: monitor,
}).demandCommand().parse();
