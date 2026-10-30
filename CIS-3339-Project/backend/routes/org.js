const router = require('express').Router();
const { orgs } = require('../models/models');
const { asyncRoute, fail } = require('../lib/http');
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const org = await orgs.findById(process.env.ORG_ID).select('name');
    if (!org) throw fail(404, 'Organization not found; run npm run db:init');
    res.json(org.name);
  })
);
module.exports = router;
