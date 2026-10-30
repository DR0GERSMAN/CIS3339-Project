const router = require('express').Router();
const { services, events } = require('../models/models');
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
function body(req) {
  const d = pick(req.body, ['name', 'description', 'status']);
  if (d.status && !['Active', 'Inactive'].includes(d.status))
    throw fail(400, 'Status must be Active or Inactive');
  return d;
}
router.get(
  '/',
  run(async (req, res) =>
    res.json(await services.find(withOrg({}, req)).sort({ name: 1 }))
  )
);
router.get(
  '/search',
  run(async (req, res) => {
    const key = req.query.searchBy;
    if (!['name', 'description'].includes(key))
      throw fail(400, 'Choose a valid search type');
    res.json(
      await services.find(
        withOrg(
          { [key]: { $regex: literal(req.query[key]), $options: 'i' } },
          req
        )
      )
    );
  })
);
router.get(
  '/id/:id',
  run(async (req, res) => {
    const d = await services.findOne(withOrg({ _id: id(req.params.id) }, req));
    if (!d) throw fail(404, 'Service not found');
    res.json(d);
  })
);
router.post(
  '/',
  editor,
  run(async (req, res) => {
    await services.create({ ...body(req), org: req.user.orgId });
    res.status(201).json({ message: 'New service created successfully' });
  })
);
router.put(
  '/update/:id',
  editor,
  run(async (req, res) => {
    const d = await services.findOneAndUpdate(
      withOrg({ _id: id(req.params.id) }, req),
      { $set: body(req) },
      { new: true, runValidators: true }
    );
    if (!d) throw fail(404, 'Service not found');
    res.json({ message: 'Service updated successfully' });
  })
);
router.delete(
  '/:id',
  editor,
  run(async (req, res) => {
    const filter = withOrg({ _id: id(req.params.id) }, req);
    if (!(await services.exists(filter))) throw fail(404, 'Service not found');
    if (await events.exists(withOrg({ services: id(req.params.id) }, req)))
      throw fail(409, 'Service is used by events and cannot be deleted');
    await services.deleteOne(filter);
    res.json({ message: 'Service deleted successfully' });
  })
);
module.exports = router;
