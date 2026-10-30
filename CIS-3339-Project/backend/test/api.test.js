const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const models = require('../models/models');
const { seed } = require('../scripts/init-db');
const { validateConfig } = require('../config');
let mongo,
  app,
  admin,
  viewer,
  b,
  foreignClient,
  foreignEvent,
  foreignService,
  localClient,
  localEvent;
const token = (role, orgId) =>
  jwt.sign({ role, orgId, name: 'test' }, process.env.JWT_SECRET, {
    subject: 'test-user',
    expiresIn: '1h'
  });
const auth = (r, t = admin) => r.set('Authorization', 'Bearer ' + t);
before(async () => {
  process.env.ORG_ID = '64e0380b3cc28d087655693b';
  process.env.JWT_SECRET =
    'test-only-secret-with-more-than-thirty-two-characters';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.SEED_VIEWER_USERNAME = 'user';
  process.env.SEED_VIEWER_PASSWORD = 'user';
  process.env.SEED_EDITOR_USERNAME = 'admin';
  process.env.SEED_EDITOR_PASSWORD = 'admin';
  mongo = await MongoMemoryServer.create({
    instance: { args: ['--nounixsocket'] }
  });
  process.env.MONGO_URL = mongo.getUri();
  await mongoose.connect(process.env.MONGO_URL);
  await seed();
  app = require('../app').app;
  admin = (
    await request(app)
      .post('/users/login')
      .send({ username: 'admin', password: 'admin' })
      .expect(200)
  ).body.token;
  viewer = (
    await request(app)
      .post('/users/login')
      .send({ username: 'user', password: 'user' })
      .expect(200)
  ).body.token;
  b = new mongoose.Types.ObjectId();
  await models.orgs.create({ _id: b, name: 'Other organization' });
  foreignClient = await models.clients.create({
    firstName: 'Private',
    lastName: 'B',
    phoneNumber: { primary: '7135559999' },
    address: { city: 'Houston', zip: '99999' },
    orgs: [b]
  });
  foreignService = await models.services.create({
    name: 'Private service',
    org: b
  });
  foreignEvent = await models.events.create({
    name: 'Private event',
    date: new Date(),
    org: b,
    attendees: [foreignClient._id],
    services: [foreignService._id]
  });
  localClient = await models.clients.findOne({ orgs: process.env.ORG_ID });
  localEvent = await models.events.findOne({
    org: process.env.ORG_ID,
    attendees: { $size: 0 }
  });
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test('init is idempotent, preserves edited data, uses hashed accounts', async () => {
  const before = await Promise.all(
    Object.values(models).map((m) => m.countDocuments())
  );
  await models.clients.updateOne(
    { _id: localClient._id },
    { $set: { middleName: 'Keep me' } }
  );
  await seed();
  assert.deepEqual(
    await Promise.all(Object.values(models).map((m) => m.countDocuments())),
    before
  );
  assert.equal(
    (await models.clients.findById(localClient._id)).middleName,
    'Keep me'
  );
  for (const u of await models.users.find({ org: process.env.ORG_ID })) {
    assert.notEqual(u.password, u.username);
    assert.ok(await bcrypt.compare(u.username, u.password));
  }
});
test('preflight rejects invalid configuration before writes', () => {
  const old = process.env.ORG_ID;
  process.env.ORG_ID = 'bad';
  assert.throws(() => validateConfig({ seed: true }), /ORG_ID/);
  process.env.ORG_ID = old;
});
test('generic login failures and trusted token claims', async () => {
  const a = await request(app)
    .post('/users/login')
    .send({ username: 'missing', password: 'bad' })
    .expect(401);
  const c = await request(app)
    .post('/users/login')
    .send({ username: 'admin', password: 'bad' })
    .expect(401);
  assert.deepEqual(a.body, c.body);
  const claims = jwt.verify(admin, process.env.JWT_SECRET);
  assert.equal(claims.orgId, process.env.ORG_ID);
  assert.equal(claims.role, 'editor');
});
test('all read route families require authentication', async () => {
  for (const path of [
    '/clients',
    '/clients/byzip',
    '/clients/id/' + localClient._id,
    '/clients/search?searchBy=name',
    '/events',
    '/events/attendance',
    '/events/attendees/' + localEvent._id,
    '/events/client/' + localClient._id,
    '/events/client/' + localClient._id + '/not-registered',
    '/events/service/' + foreignService._id,
    '/services',
    '/services/search?searchBy=name'
  ])
    await request(app).get(path).expect(401);
});
test('viewer is denied every mutation family', async () => {
  for (const [method, path] of [
    ['post', '/clients'],
    ['put', '/clients/update/' + localClient._id],
    ['delete', '/clients/' + localClient._id],
    ['post', '/events'],
    ['put', '/events/update/' + localEvent._id],
    ['delete', '/events/' + localEvent._id],
    ['put', '/events/register'],
    ['put', '/events/deregister'],
    ['post', '/services'],
    ['put', '/services/update/' + foreignService._id],
    ['delete', '/services/' + foreignService._id]
  ])
    await auth(request(app)[method](path), viewer).send({}).expect(403);
});
test('lists, searches, aggregates, detail and relation lookups isolate organizations', async () => {
  for (const [path, secret] of [
    ['/clients', 'Private'],
    ['/clients/search?searchBy=name&firstName=Private', 'Private'],
    ['/events', 'Private event'],
    ['/services', 'Private service'],
    ['/events/attendance', 'Private event'],
    ['/clients/byzip', '99999']
  ]) {
    const r = await auth(request(app).get(path)).expect(200);
    assert.ok(!JSON.stringify(r.body).includes(secret));
  }
  for (const path of [
    '/clients/id/' + foreignClient._id,
    '/events/id/' + foreignEvent._id,
    '/events/attendees/' + foreignEvent._id,
    '/services/id/' + foreignService._id,
    '/events/client/' + foreignClient._id,
    '/events/service/' + foreignService._id
  ])
    await auth(request(app).get(path)).expect(404);
  const r = await auth(
    request(app).get('/clients'),
    token('editor', String(b))
  ).expect(200);
  assert.equal(r.body.length, 1);
});
test('cross-organization updates/deletes/registration cannot change records', async () => {
  for (const [method, path, body] of [
    ['put', '/clients/update/' + foreignClient._id, { firstName: 'Changed' }],
    ['delete', '/clients/' + foreignClient._id, {}],
    ['put', '/events/update/' + foreignEvent._id, { name: 'Changed' }],
    ['delete', '/events/' + foreignEvent._id, {}],
    ['put', '/services/update/' + foreignService._id, { name: 'Changed' }],
    ['delete', '/services/' + foreignService._id, {}],
    [
      'put',
      `/events/register?event=${localEvent._id}&client=${foreignClient._id}`,
      {}
    ],
    [
      'put',
      `/events/register?event=${foreignEvent._id}&client=${localClient._id}`,
      {}
    ],
    [
      'put',
      `/events/deregister?event=${foreignEvent._id}&client=${foreignClient._id}`,
      {}
    ]
  ])
    await auth(request(app)[method](path)).send(body).expect(404);
  assert.equal(
    (await models.clients.findById(foreignClient._id)).firstName,
    'Private'
  );
});
test('editor CRUD validates fields, ownership, references and preserves delete restrictions', async () => {
  const data = {
    firstName: 'New',
    lastName: 'Person',
    phoneNumber: { primary: '7135551234' },
    address: { city: 'Houston' },
    email: 'new@example.test'
  };
  await auth(request(app).post('/clients')).send(data).expect(201);
  const c = await models.clients.findOne({ firstName: 'New' });
  await auth(request(app).put('/clients/update/' + c._id))
    .send({ firstName: 'Updated' })
    .expect(200);
  await auth(request(app).put('/clients/update/' + c._id))
    .send({ orgId: String(b) })
    .expect(400);
  await auth(request(app).put('/clients/update/' + c._id))
    .send({ firstName: '' })
    .expect(400);
  await auth(request(app).post('/services'))
    .send({ name: 'New service', status: 'Active' })
    .expect(201);
  const s = await models.services.findOne({ name: 'New service' });
  await auth(request(app).post('/events'))
    .send({
      name: 'New event',
      date: new Date().toISOString(),
      services: [String(s._id)]
    })
    .expect(201);
  const e = await models.events.findOne({ name: 'New event' });
  await auth(request(app).delete('/services/' + s._id)).expect(409);
  await auth(request(app).post('/events'))
    .send({
      name: 'Foreign link',
      date: new Date().toISOString(),
      services: [String(foreignService._id)]
    })
    .expect(404);
  await auth(
    request(app).put(`/events/register?event=${e._id}&client=${c._id}`)
  ).expect(200);
  await auth(request(app).delete('/clients/' + c._id)).expect(409);
  await auth(request(app).delete('/events/' + e._id)).expect(409);
  await auth(
    request(app).put(`/events/deregister?event=${e._id}&client=${c._id}`)
  ).expect(200);
  await auth(request(app).delete('/events/' + e._id)).expect(200);
  await auth(request(app).delete('/services/' + s._id)).expect(200);
  await auth(request(app).delete('/clients/' + c._id)).expect(200);
});
test('concurrent duplicate registration and repeated deregistration are idempotent', async () => {
  const url = `/events/register?event=${localEvent._id}&client=${localClient._id}`;
  await Promise.all(
    Array.from({ length: 8 }, () => auth(request(app).put(url)).expect(200))
  );
  assert.equal(
    (await models.events.findById(localEvent._id)).attendees.filter(
      (x) => String(x) === String(localClient._id)
    ).length,
    1
  );
  assert.equal(
    (await auth(request(app).put(url)).expect(200)).body.message,
    'Already registered'
  );
  const remove = `/events/deregister?event=${localEvent._id}&client=${localClient._id}`;
  await auth(request(app).put(remove)).expect(200);
  assert.equal(
    (await auth(request(app).put(remove)).expect(200)).body.message,
    'Not registered'
  );
  const absent = new mongoose.Types.ObjectId();
  await auth(
    request(app).put(
      `/events/register?event=${absent}&client=${localClient._id}`
    )
  ).expect(404);
});
test('safe 400, 404, 500 envelope, health and CORS', async () => {
  const bad = await auth(request(app).get('/clients/id/bad')).expect(400);
  assert.equal(typeof bad.body.error, 'string');
  const missing = await request(app).get('/missing').expect(404);
  assert.equal(typeof missing.body.error, 'string');
  const original = models.clients.find;
  models.clients.find = () => {
    throw new Error('SECRET-STACK-DETAIL');
  };
  try {
    const error = await auth(request(app).get('/clients')).expect(500);
    assert.deepEqual(error.body, { error: 'Unexpected server error' });
  } finally {
    models.clients.find = original;
  }
  const h = await request(app).get('/health').expect(200);
  assert.equal(h.body.db, 'connected');
  const ok = await request(app)
    .options('/clients')
    .set('Origin', 'http://localhost:5173')
    .set('Access-Control-Request-Method', 'GET');
  assert.equal(
    ok.headers['access-control-allow-origin'],
    'http://localhost:5173'
  );
  const badOrigin = await request(app)
    .get('/health')
    .set('Origin', 'https://untrusted.test');
  assert.notEqual(
    badOrigin.headers['access-control-allow-origin'],
    'https://untrusted.test'
  );
});
test('search escapes regex metacharacters', async () => {
  const { literal } = require('../lib/http');
  assert.ok(new RegExp(literal('a.b')).test('a.b'));
  assert.ok(!new RegExp(literal('a.b')).test('axb'));
  await auth(
    request(app).get('/clients/search?searchBy=name&firstName=%28')
  ).expect(200);
});
