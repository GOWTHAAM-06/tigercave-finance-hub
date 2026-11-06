const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const YahooFinance = require('yahoo-finance2').default;
require('dotenv').config();

const app = express();
const yahooFinance = new YahooFinance();
const marketSymbols = [
  { symbol: '^NSEI', name: 'Nifty 50' },
  { symbol: '^BSESN', name: 'Sensex' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'INFY.NS', name: 'Infosys' },
];
app.use(cors());
app.use(express.json());

// Connect to your local Docker Postgres container
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'tigercave',
});

const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance NUMERIC(18, 2) NOT NULL DEFAULT 100000.00 CHECK (balance >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(32) NOT NULL,
      type VARCHAR(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
      order_type VARCHAR(8) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT')),
      product_type VARCHAR(10) NOT NULL DEFAULT 'DELIVERY' CHECK (product_type IN ('INTRADAY', 'DELIVERY')),
      quantity NUMERIC(24, 8) NOT NULL CHECK (quantity > 0),
      price NUMERIC(24, 8) NOT NULL CHECK (price > 0),
      "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS product_type VARCHAR(10) NOT NULL DEFAULT 'DELIVERY'
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS orders_user_timestamp_idx
    ON orders (user_id, "timestamp" DESC, id DESC)
  `);

  await pool.query(`
    INSERT INTO wallets (user_id)
    SELECT id FROM users
    ON CONFLICT (user_id) DO NOTHING
  `);

  console.log('Connected to local PostgreSQL & verified tables');
};

const getPortfolio = async (database, userId) => {
  const walletResult = await database.query(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [userId],
  );

  if (walletResult.rows.length === 0) return null;

  const orderResult = await database.query(
    `SELECT id, symbol, type, order_type, product_type, quantity, price, "timestamp"
     FROM orders
     WHERE user_id = $1
     ORDER BY "timestamp" ASC, id ASC`,
    [userId],
  );
  const positionsBySymbol = new Map();
  const orders = orderResult.rows.map((order) => ({
    id: Number(order.id),
    symbol: order.symbol,
    type: order.type,
    orderType: order.order_type,
    productType: order.product_type,
    quantity: Number(order.quantity),
    price: Number(order.price),
    timestamp: order.timestamp,
  }));

  for (const order of orders) {
    const positionKey = `${order.productType}:${order.symbol}`;
    const position = positionsBySymbol.get(positionKey) || {
      symbol: order.symbol,
      productType: order.productType,
      quantity: 0,
      averagePrice: 0,
      lastPrice: order.price,
      realizedPnl: 0,
    };

    if (order.type === 'BUY') {
      const newQuantity = position.quantity + order.quantity;
      position.averagePrice =
        (position.quantity * position.averagePrice + order.quantity * order.price) / newQuantity;
      position.quantity = newQuantity;
    } else {
      position.realizedPnl += order.quantity * (order.price - position.averagePrice);
      position.quantity -= order.quantity;
    }

    position.lastPrice = order.price;
    positionsBySymbol.set(positionKey, position);
  }

  const positions = Array.from(positionsBySymbol.values())
    .filter((position) => position.quantity > 0.00000001)
    .map((position) => ({ ...position, id: `${position.productType}:${position.symbol}` }));
  const marginUsed = positions.reduce(
    (total, position) => total + position.quantity * position.averagePrice,
    0,
  );

  return {
    cashBalance: Number(walletResult.rows[0].balance),
    marginUsed,
    positions,
    orders: orders.slice(-50).reverse(),
  };
};

// Simple Signup Route
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, password]
    );
    await client.query('INSERT INTO wallets (user_id) VALUES ($1)', [result.rows[0].id]);
    await client.query('COMMIT');
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: 'User already exists or invalid data' });
  } finally {
    client.release();
  }
});

// Simple Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await Promise.all(marketSymbols.map(async ({ symbol, name }) => {
      const quote = await yahooFinance.quote(symbol);
      const currentPrice = quote.regularMarketPrice;
      const previousClose = quote.regularMarketPreviousClose;

      if (
        !Number.isFinite(currentPrice) ||
        !Number.isFinite(previousClose) ||
        previousClose === 0
      ) {
        throw new Error(`Missing market price data for ${symbol}`);
      }

      return {
        symbol,
        name,
        currentPrice,
        previousClose,
        percentageChange: Number((((currentPrice - previousClose) / previousClose) * 100).toFixed(2)),
      };
    }));

    res.json({ success: true, quotes });
  } catch (err) {
    console.error('Quote request failed:', err);
    res.status(502).json({ success: false, error: 'Unable to fetch market quotes' });
  }
});

app.get('/api/quote', (req, res) => {
  res.status(404).json({ success: false, error: 'Ticker symbol is required' });
});

app.get('/api/quote/:symbol', async (req, res) => {
  const symbol = req.params.symbol.trim().toUpperCase();
  if (!/^[A-Z0-9.&^=_-]{1,32}$/.test(symbol)) {
    return res.status(404).json({ success: false, error: 'Ticker symbol not found' });
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    const currentPrice = quote?.regularMarketPrice;
    const previousClose = quote?.regularMarketPreviousClose;

    if (
      !Number.isFinite(currentPrice) ||
      !Number.isFinite(previousClose) ||
      previousClose === 0
    ) {
      return res.status(404).json({ success: false, error: 'Ticker symbol not found' });
    }

    res.json({
      success: true,
      quote: {
        symbol,
        currentPrice,
        previousClose,
        percentageChange: Number((((currentPrice - previousClose) / previousClose) * 100).toFixed(2)),
      },
    });
  } catch (err) {
    console.error(`Quote request failed for ${symbol}:`, err);
    res.status(502).json({ success: false, error: 'Unable to fetch ticker quote' });
  }
});

app.get('/api/chart', (req, res) => {
  res.status(404).json({ success: false, error: 'Ticker symbol is required' });
});

app.get('/api/chart/:symbol', async (req, res) => {
  const symbol = req.params.symbol.trim().toUpperCase();
  const interval = typeof req.query.interval === 'string' ? req.query.interval : '1d';
  const chartRangeByInterval = {
    '1d': { yahooInterval: '5m' },
    '1w': { yahooInterval: '1d' },
    '1m': { yahooInterval: '1d' },
    '1y': { yahooInterval: '1wk' },
  };

  if (!/^[A-Z0-9.&^=_-]{1,32}$/.test(symbol)) {
    return res.status(404).json({ success: false, error: 'Ticker symbol not found' });
  }
  if (!Object.hasOwn(chartRangeByInterval, interval)) {
    return res.status(400).json({ success: false, error: 'Unsupported chart interval' });
  }

  try {
    const period2 = new Date();
    const period1 = new Date(period2);
    if (interval === '1d') period1.setDate(period1.getDate() - 1);
    if (interval === '1w') period1.setDate(period1.getDate() - 7);
    if (interval === '1m') {
      const monthDay = period1.getDate();
      period1.setDate(1);
      period1.setMonth(period1.getMonth() - 1);
      const lastDayOfMonth = new Date(period1.getFullYear(), period1.getMonth() + 1, 0).getDate();
      period1.setDate(Math.min(monthDay, lastDayOfMonth));
    }
    if (interval === '1y') period1.setFullYear(period1.getFullYear() - 1);

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: chartRangeByInterval[interval].yahooInterval,
    });
    const candles = result.quotes
      .filter((candle) =>
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close),
      )
      .map((candle) => ({
        timestamp: candle.date.toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: Number.isFinite(candle.volume) ? candle.volume : 0,
      }));

    if (candles.length === 0) {
      return res.status(404).json({ success: false, error: 'No historical data found for ticker' });
    }

    const periodStartPrice = candles[0].open;
    const periodEndPrice = candles[candles.length - 1].close;
    const rawAbsoluteChange = periodEndPrice - periodStartPrice;
    const absoluteChange = Number(rawAbsoluteChange.toFixed(2));
    const percentageChange = Number(((rawAbsoluteChange / periodStartPrice) * 100).toFixed(2));

    res.json({ success: true, symbol, interval, absoluteChange, percentageChange, candles });
  } catch (err) {
    if (/no data found|symbol may be delisted/i.test(err.message || '')) {
      return res.status(404).json({ success: false, error: 'Ticker symbol not found' });
    }
    console.error(`Chart request failed for ${symbol}:`, err);
    res.status(502).json({ success: false, error: 'Unable to fetch historical chart data' });
  }
});

app.get('/api/portfolio/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  try {
    const portfolio = await getPortfolio(pool, userId);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'User wallet not found' });
    }
    res.json({ success: true, ...portfolio });
  } catch (err) {
    console.error('Portfolio request failed:', err);
    res.status(500).json({ success: false, error: 'Unable to load portfolio' });
  }
});

app.post('/api/orders', async (req, res) => {
  const userId = Number(req.body.userId);
  const symbol = typeof req.body.symbol === 'string' ? req.body.symbol.trim().toUpperCase() : '';
  const type = typeof req.body.type === 'string' ? req.body.type.toUpperCase() : '';
  const orderType = typeof req.body.orderType === 'string' ? req.body.orderType.toUpperCase() : '';
  const productType = typeof req.body.productType === 'string'
    ? req.body.productType.toUpperCase()
    : 'DELIVERY';
  const quantity = Number(req.body.quantity);
  const price = Number(req.body.price);

  if (
    !Number.isSafeInteger(userId) || userId <= 0 || !symbol || symbol.length > 32 ||
    !['BUY', 'SELL'].includes(type) || !['MARKET', 'LIMIT'].includes(orderType) ||
    !['INTRADAY', 'DELIVERY'].includes(productType) ||
    !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0
  ) {
    return res.status(400).json({ success: false, error: 'Invalid order details' });
  }

  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query('BEGIN');
    transactionOpen = true;

    const walletResult = await client.query(
      'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId],
    );
    if (walletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return res.status(404).json({ success: false, error: 'User wallet not found' });
    }

    const balance = Number(walletResult.rows[0].balance);
    const orderValue = quantity * price;
    if (!Number.isFinite(orderValue)) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return res.status(400).json({ success: false, error: 'Order value is invalid' });
    }

    if (type === 'BUY' && orderValue > balance) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return res.status(400).json({ success: false, error: 'Insufficient cash balance' });
    }

    if (type === 'SELL') {
      const holdingsResult = await client.query(
        `SELECT COALESCE(SUM(CASE WHEN type = 'BUY' THEN quantity ELSE -quantity END), 0) AS quantity
         FROM orders
         WHERE user_id = $1 AND symbol = $2 AND product_type = $3`,
        [userId, symbol, productType],
      );
      if (quantity > Number(holdingsResult.rows[0].quantity) + 0.00000001) {
        await client.query('ROLLBACK');
        transactionOpen = false;
        return res.status(400).json({ success: false, error: 'Sell quantity exceeds your active position' });
      }
    }

    const balanceChange = type === 'BUY' ? -orderValue : orderValue;
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
      [balanceChange, userId],
    );
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, symbol, type, order_type, product_type, quantity, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, symbol, type, order_type, product_type, quantity, price, "timestamp"`,
      [userId, symbol, type, orderType, productType, quantity, price],
    );
    const portfolio = await getPortfolio(client, userId);
    await client.query('COMMIT');
    transactionOpen = false;

    const order = orderResult.rows[0];
    res.json({
      success: true,
      order: {
        id: Number(order.id),
        symbol: order.symbol,
        type: order.type,
        orderType: order.order_type,
        productType: order.product_type,
        quantity: Number(order.quantity),
        price: Number(order.price),
        timestamp: order.timestamp,
      },
      ...portfolio,
    });
  } catch (err) {
    if (transactionOpen) await client.query('ROLLBACK');
    console.error('Order request failed:', err);
    res.status(500).json({ success: false, error: 'Unable to execute order' });
  } finally {
    client.release();
  }
});

const PORT = 5000;
initializeDatabase()
  .then(() => app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exitCode = 1;
  });