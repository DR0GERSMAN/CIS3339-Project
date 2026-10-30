const router = require('express').Router();
const { events, clients, services } = require('../models/models');
const { requireAuth, requireRole } = require('../auth/authMiddleWare');
const {
  asyncRoute: run,
  fail,
  id,
  withOrg,
  pick,
  literal
} = require('../lib/http');
router.use(requireAuth);
const editor = requireRole('editor');
async function clientExists(req, value) {
  const found = await clients.exists(
    withOrg({ _id: id(value) }, req, 'clients')
  );
  if (!found) throw fail(404, 'Client not found');
}
async function eventBody(req) {
  const d = pick(req.body, [
    'name',
    'description',
    'date',
    'address',
    'services'
  ]);
  if (d.services) {
    if (!Array.isArray(d.services))
      throw fail(400, 'Services must be an array');
    const ids = [...new Set(d.services.map((x) => String(id(x))))];
    if (
      (await services.countDocuments(withOrg({ _id: { $in: ids } }, req))) !==
      ids.length
    )
      throw fail(404, 'Service not found');
    d.services = ids;
  }
  return d;
}
router.get(
  '/',
  run(async (req, res) =>
    res.json(await events.find(withOrg({}, req)).sort({ date: -1 }))
  )
);
router.get(
  '/attendance',
  run(async (req, res) => {
    const since = new Date();
    since.setMonth(since.getMonth() - 2);
    res.json(
      await events
        .find(withOrg({ date: { $gte: since } }, req))
        .sort({ date: 1 })
    );
  })
);
router.get(
  '/search',
  run(async (req, res) => {
    const q = {};
    if (req.query.searchBy === 'name')
      q.name = { $regex: literal(req.query.name), $options: 'i' };
    else if (req.query.searchBy === 'date') {
      const start = new Date(req.query.eventDate);
      if (isNaN(start)) throw fail(400, 'Invalid date');
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      q.date = { $gte: start, $lt: end };
    } else throw fail(400, 'Choose a valid search type');
    res.json(await events.find(withOrg(q, req)));
  })
);
router.get(
  '/client/:id/not-registered',
  run(async (req, res) => {
    await clientExists(req, req.params.id);
    res.json(
      await events.find(
        withOrg({ attendees: { $nin: [id(req.params.id)] } }, req)
      )
    );
  })
);
router.get(
  '/client/:id',
  run(async (req, res) => {
    await clientExists(req, req.params.id);
    res.json(await events.find(withOrg({ attendees: id(req.params.id) }, req)));
  })
);
router.get(
  '/attendees/:id',
  run(async (req, res) => {
    const event = await events.findOne(
      withOrg({ _id: id(req.params.id) }, req)
    );
    if (!event) throw fail(404, 'Event not found');
    res.json(
      await clients.find(
        withOrg({ _id: { $in: event.attendees } }, req, 'clients')
      )
    );
  })
);
router.get(
  '/service/:id',
  run(async (req, res) => {
    if (!(await services.exists(withOrg({ _id: id(req.params.id) }, req))))
      throw fail(404, 'Service not found');
    res.json(await events.find(withOrg({ services: id(req.params.id) }, req)));
  })
);
router.get(
  '/id/:id',
  run(async (req, res) => {
    const d = await events.findOne(withOrg({ _id: id(req.params.id) }, req));
    if (!d) throw fail(404, 'Event not found');
    res.json(d);
  })
);
router.post(
  '/',
  editor,
  run(async (req, res) => {
    await events.create({
      ...(await eventBody(req)),
      org: req.user.orgId,
      attendees: []
    });
    res.status(201).json({ message: 'New event created successfully' });
  })
);
router.put(
  '/update/:id',
  editor,
  run(async (req, res) => {
    const d = await events.findOneAndUpdate(
      withOrg({ _id: id(req.params.id) }, req),
      { $set: await eventBody(req) },
      { new: true, runValidators: true }
    );
    if (!d) throw fail(404, 'Event not found');
    res.json({ message: 'Event updated successfully' });
  })
);
// Conditional atomic updates keep repeated/concurrent registration requests idempotent.
for (const [path, add] of [
  ['register', true],
  ['deregister', false]
])
  router.put(
    '/' + path,
    editor,
    run(async (req, res) => {
      const eventId = id(req.query.event),
        clientId = id(req.query.client);
      await clientExists(req, req.query.client);
      const filter = withOrg({ _id: eventId }, req);
      if (!(await events.exists(filter))) throw fail(404, 'Event not found');
      const changed = await events.findOneAndUpdate(
        withOrg(
          { _id: eventId, attendees: add ? { $ne: clientId } : clientId },
          req
        ),
        add
          ? { $addToSet: { attendees: clientId } }
          : { $pull: { attendees: clientId } },
        { new: true }
      );
      if (!changed)
        return res.json({
          message: add ? 'Already registered' : 'Not registered'
        });
      res.json(changed);
    })
  );
router.delete(
  '/:id',
  editor,
  run(async (req, res) => {
    const filter = withOrg({ _id: id(req.params.id) }, req);
    const event = await events.findOne(filter);
    if (!event) throw fail(404, 'Event not found');
    if (event.attendees.length)
      throw fail(409, 'Event has attendees and cannot be deleted');
    const result = await events.deleteOne(
      withOrg({ _id: event._id, attendees: { $size: 0 } }, req)
    );
    if (!result.deletedCount) throw fail(409, 'Event now has attendees');
    res.json({ message: 'Event deleted successfully' });
  })
);
module.exports = router;
