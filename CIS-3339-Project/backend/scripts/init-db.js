require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { validateConfig } = require('../config');
const { orgs, users, clients, events, services } = require('../models/models');
async function seed() {
  validateConfig({ seed: true });
  const orgId = new mongoose.Types.ObjectId(process.env.ORG_ID);
  await orgs.updateOne(
    { _id: orgId },
    { $setOnInsert: { name: 'CIS 3339 Community Center' } },
    { upsert: true }
  );
  for (const [role, prefix] of [
    ['viewer', 'VIEWER'],
    ['editor', 'EDITOR']
  ]) {
    const username = process.env['SEED_' + prefix + '_USERNAME'];
    const password = process.env['SEED_' + prefix + '_PASSWORD'];
    await users.updateOne(
      { org: orgId, username },
      {
        $setOnInsert: {
          _id: new mongoose.Types.ObjectId(),
          role,
          password: await bcrypt.hash(password, 10),
          org: orgId
        }
      },
      { upsert: true }
    );
  }
  // Stable IDs are derived from ORG_ID so another course organization seeds independently.
  const key = (kind, n) =>
    new mongoose.Types.ObjectId(
      require('crypto')
        .createHash('sha256')
        .update(String(orgId) + kind + n)
        .digest('hex')
        .slice(0, 24)
    );
  for (let n = 1; n <= 18; n++) {
    const sid = key('service', n),
      cid = key('client', n),
      eid = key('event', n);
    await services.updateOne(
      { _id: sid, org: orgId },
      {
        $setOnInsert: {
          name: `Community Service ${String(n).padStart(2, '0')}`,
          description: 'Course sample service',
          status: n % 5 ? 'Active' : 'Inactive'
        }
      },
      { upsert: true }
    );
    await clients.updateOne(
      { _id: cid, orgs: orgId },
      {
        $setOnInsert: {
          firstName: 'Sample',
          lastName: `Client ${String(n).padStart(2, '0')}`,
          email: `client${n}@example.test`,
          phoneNumber: { primary: '713555' + String(n).padStart(4, '0') },
          address: { city: 'Houston', zip: String(77000 + n) },
          orgs: [orgId]
        }
      },
      { upsert: true }
    );
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + n - 9);
    date.setUTCHours(12, 0, 0, 0);
    await events.updateOne(
      { _id: eid, org: orgId },
      {
        $setOnInsert: {
          name: `Community Event ${String(n).padStart(2, '0')}`,
          date,
          description: 'Course sample event',
          address: { line1: '100 Main Street', city: 'Houston' },
          services: [sid],
          attendees: n === 1 ? [cid] : []
        }
      },
      { upsert: true }
    );
  }
  await Promise.all(
    [users, clients, services, events].map((m) => m.createIndexes())
  );
  console.log(
    'Initialization complete. Existing records and passwords were preserved.'
  );
  console.log(
    'Organization: ' +
      orgId +
      '; sample clients/services/events: 18 each; one initial registration.'
  );
  console.log(
    'Viewer: ' +
      process.env.SEED_VIEWER_USERNAME +
      '; editor: ' +
      process.env.SEED_EDITOR_USERNAME
  );
}
if (require.main === module)
  (async () => {
    try {
      validateConfig({ seed: true });
      await mongoose.connect(process.env.MONGO_URL, {
        serverSelectionTimeoutMS: 10000
      });
      await seed();
    } catch (err) {
      console.error('Initialization failed: ' + err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
module.exports = { seed };
