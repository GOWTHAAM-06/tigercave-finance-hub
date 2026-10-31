const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
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
      quantity NUMERIC(24, 8) NOT NULL CHECK (quantity > 0),
      price NUMERIC(24, 8) NOT NULL CHECK (price > 0),
      "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
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
    `SELECT id, symbol, type, order_type, quantity, price, "timestamp"
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
    quantity: Number(order.quantity),
    price: Number(order.price),
    timestamp: order.timestamp,
  }));

  for (const order of orders) {
    const position = positionsBySymbol.get(order.symbol) || {
      symbol: order.symbol,
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
    positionsBySymbol.set(order.symbol, position);
  }

  const positions = Array.from(positionsBySymbol.values())
    .filter((position) => position.quantity > 0.00000001)
    .map((position) => ({ ...position, id: position.symbol }));
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
  const quantity = Number(req.body.quantity);
  const price = Number(req.body.price);

  if (
    !Number.isSafeInteger(userId) || userId <= 0 || !symbol || symbol.length > 32 ||
    !['BUY', 'SELL'].includes(type) || !['MARKET', 'LIMIT'].includes(orderType) ||
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
         WHERE user_id = $1 AND symbol = $2`,
        [userId, symbol],
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
      `INSERT INTO orders (user_id, symbol, type, order_type, quantity, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, symbol, type, order_type, quantity, price, "timestamp"`,
      [userId, symbol, type, orderType, quantity, price],
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