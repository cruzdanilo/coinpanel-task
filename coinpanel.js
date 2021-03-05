#!/usr/bin/env node
require('dotenv').config();
const WebSocket = require('ws');
const { dirname } = require('path');
const { appendFile, mkdir } = require('fs/promises');

const {
  OUTPUT_FILE = 'output/price.jsonl',
  BINANCE_BASE_WS = 'wss://stream.binance.com',
} = process.env;

/** @type {WebSocket} */
let websocket = null;

const monitor = async ({ symbol: userSymbol, value }) => {
  if (websocket) return;

  websocket = new WebSocket(`${BINANCE_BASE_WS}/ws`, { perMessageDeflate: false });

  let messageId = 0;
  websocket.on('open', async () => websocket.send(JSON.stringify({
    id: messageId++, method: 'SUBSCRIBE', params: [`${userSymbol.toLowerCase()}@trade`],
  })));

  websocket.on('message', async (json) => {
    const {
      e: event,
      T: timestamp,
      s: symbol,
      p: priceString,
      q: quantityString,
    } = JSON.parse(json);
    if (event !== 'trade' || symbol !== userSymbol) return;

    const price = Number(priceString);
    if (price <= value) return;

    const time = new Date(timestamp);
    const quantity = Number(quantityString);
    console.log(time, symbol, price);
    await appendFile(OUTPUT_FILE, `${JSON.stringify({
      time, symbol, price, quantity,
    })}\n`);
  });

  websocket.on('error', () => websocket.terminate());
  websocket.on('close', () => {
    websocket = false;
    setTimeout(monitor, 5_000, { symbol: userSymbol, value });
  });
};

require('yargs').command({
  command: ['monitor <symbol> <value>', '$0'],
  describe: 'monitor trade stream data',
  builder: (yargs) => yargs
    .positional('symbol', { describe: 'pair to be monitored (ex: BTCUSDT)', type: 'string' })
    .positional('value', { describe: 'minimum price for action', type: 'number' }),
  handler: async (args) => {
    await mkdir(dirname(OUTPUT_FILE), { recursive: true });
    monitor(args);
  },
}).demandCommand().parse();
