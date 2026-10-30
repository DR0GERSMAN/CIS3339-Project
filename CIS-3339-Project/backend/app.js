require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { validateConfig } = require('./config');
const app = express();
app.disable('x-powered-by');
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);
app.use(express.json({ limit: '100kb' }));
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res
    .status(connected ? 200 : 503)
    .json({
      status: connected ? 'ok' : 'degraded',
      db: connected ? 'connected' : 'disconnected'
    });
});
for (const name of ['clients', 'events', 'services', 'users', 'org'])
  app.use('/' + name, require('./routes/' + name));
app.use((req, res, next) =>
  next(Object.assign(new Error('Route not found'), { status: 404 }))
);
// All route failures, including malformed JSON and Mongoose validation, use one envelope.
app.use((err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    status = 400;
    message = 'Invalid input. Check required fields and record IDs.';
  }
  if (err.code === 11000) {
    status = 400;
    message = 'A record with that identifier already exists';
  }
  if (status >= 500) {
    console.error(err.name + ': ' + err.message);
    message = 'Unexpected server error';
  }
  res.status(status).json({ error: message });
});
async function start() {
  validateConfig();
  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000
  });
  const server = app.listen(process.env.PORT || 3000, () =>
    console.log('API ready on port ' + (process.env.PORT || 3000))
  );
  return server;
}
if (require.main === module)
  start().catch((err) => {
    console.error('Startup failed: ' + err.message);
    process.exit(1);
  });
module.exports = { app, start };
