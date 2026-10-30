const router = require('express').Router();
const { clients, events } = require('../models/models');
const { requireAuth, requireRole } = require('../auth/authMiddleWare');
const {
  asyncRoute: run,
  fail,
  id,
  withOrg,
  pick,
  literal
} = require('../lib/http');
const editor = requireRole('editor');
router.use(requireAuth);
const fields = [
  'firstName',
  'middleName',
  'lastName',
  'email',
  'phoneNumber',
  'address'
];
router.get(
  '/',
  run(async (req, res) =>
    res.json(
      await clients
        .find(withOrg({}, req, 'clients'))
        .sort({ lastName: 1, firstName: 1 })
    )
  )
);
router.get(
  '/byzip',
  run(async (req, res) =>
    res.json(
      await clients.aggregate([
        {
          $match: withOrg(
            { 'address.zip': { $exists: true, $ne: '' } },
            req,
            'clients'
          )
        },
        { $group: { _id: '$address.zip', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    )
  )
);
router.get(
  '/search',
  run(async (req, res) => {
    const q = {};
    if (req.query.searchBy === 'name') {
      if (req.query.firstName)
        q.firstName = { $regex: literal(req.query.firstName), $options: 'i' };
      if (req.query.lastName)
        q.lastName = { $regex: literal(req.query.lastName), $options: 'i' };
    } else if (req.query.searchBy === 'number')
      q['phoneNumber.primary'] = {
        $regex: literal(req.query.phoneNumber),
        $options: 'i'
      };
    else throw fail(400, 'Choose a valid search type');
    res.json(await clients.find(withOrg(q, req, 'clients')));
  })
);
router.get(
  '/id/:id',
  run(async (req, res) => {
    const client = await clients.findOne(
      withOrg({ _id: id(req.params.id) }, req, 'clients')
    );
    if (!client) throw fail(404, 'Client not found');
    res.json(client);
  })
);
router.post(
  '/',
  editor,
  run(async (req, res) => {
    await clients.create({ ...pick(req.body, fields), orgs: [req.user.orgId] });
    res.status(201).json({ message: 'New client created successfully' });
  })
);
router.put(
  '/update/:id',
  editor,
  run(async (req, res) => {
    const data = await clients.findOneAndUpdate(
      withOrg({ _id: id(req.params.id) }, req, 'clients'),
      { $set: pick(req.body, fields) },
      { new: true, runValidators: true }
    );
    if (!data) throw fail(404, 'Client not found');
    res.json({ message: 'Client updated successfully' });
  })
);
router.delete(
  '/:id',
  editor,
  run(async (req, res) => {
    const filter = withOrg({ _id: id(req.params.id) }, req, 'clients');
    if (!(await clients.exists(filter))) throw fail(404, 'Client not found');
    if (await events.exists(withOrg({ attendees: id(req.params.id) }, req)))
      throw fail(409, 'Client is registered for events and cannot be deleted');
    await clients.deleteOne(filter);
    res.json({ message: 'Client deleted successfully' });
  })
);
module.exports = router;
