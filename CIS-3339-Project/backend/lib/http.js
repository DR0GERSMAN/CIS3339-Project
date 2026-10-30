const mongoose = require('mongoose');
const fail = (status, message) => Object.assign(new Error(message), { status });
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
function id(value) {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value))
    throw fail(400, 'Invalid record ID');
  return new mongoose.Types.ObjectId(value);
}
// Keep the template's orgs[] for clients and scalar org for events/services.
// Always overwrite caller filters with the trusted JWT organization.
function withOrg(filter, req, kind = 'events') {
  const orgId = id(req.user.orgId);
  const clean = { ...filter };
  delete clean.org;
  delete clean.orgs;
  delete clean.orgId;
  return { ...clean, [kind === 'clients' ? 'orgs' : 'org']: orgId };
}
function pick(body, keys) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw fail(400, 'Expected a JSON object');
  if (['org', 'orgs', 'orgId', '_id'].some((k) => Object.hasOwn(body, k)))
    throw fail(400, 'Ownership and record IDs cannot be changed');
  return Object.fromEntries(
    keys.filter((k) => Object.hasOwn(body, k)).map((k) => [k, body[k]])
  );
}
const literal = (value) =>
  String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
module.exports = { fail, asyncRoute, id, withOrg, pick, literal };
