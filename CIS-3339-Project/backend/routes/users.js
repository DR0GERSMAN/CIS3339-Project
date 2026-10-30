const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../models/models');
const { asyncRoute, fail } = require('../lib/http');
router.post(
  '/login',
  asyncRoute(async (req, res) => {
    const { username, password } = req.body;
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      username.length > 100 ||
      password.length > 200
    )
      throw fail(400, 'Invalid username or password');
    const user = await users.findOne({ username, org: process.env.ORG_ID });
    if (
      !user ||
      !(await bcrypt.compare(password, user.password)) ||
      !['viewer', 'editor'].includes(user.role)
    )
      throw fail(401, 'Invalid username or password');
    const token = jwt.sign(
      { name: user.username, role: user.role, orgId: String(user.org) },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', subject: String(user._id), expiresIn: '8h' }
    );
    res.json({ token });
  })
);
module.exports = router;
