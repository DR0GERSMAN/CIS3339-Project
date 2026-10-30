require('dotenv').config();
function validateConfig({ seed = false } = {}) {
  const keys = ['MONGO_URL', 'ORG_ID', 'JWT_SECRET', 'CORS_ORIGIN'];
  if (seed)
    keys.push(
      'SEED_VIEWER_USERNAME',
      'SEED_VIEWER_PASSWORD',
      'SEED_EDITOR_USERNAME',
      'SEED_EDITOR_PASSWORD'
    );
  for (const key of keys)
    if (!process.env[key]) throw new Error(`Missing configuration: ${key}`);
  if (!/^[a-f\d]{24}$/i.test(process.env.ORG_ID))
    throw new Error('ORG_ID must be a 24-character hexadecimal ObjectId');
  if (process.env.JWT_SECRET.length < 32)
    throw new Error('JWT_SECRET must have at least 32 characters');
  if (
    process.env.PORT &&
    (!/^\d+$/.test(process.env.PORT) ||
      +process.env.PORT < 1 ||
      +process.env.PORT > 65535)
  )
    throw new Error('PORT must be 1-65535');
  const origin = new URL(process.env.CORS_ORIGIN);
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.origin !== process.env.CORS_ORIGIN
  )
    throw new Error(
      'CORS_ORIGIN must be a single HTTP origin without a trailing slash'
    );
}
module.exports = { validateConfig };
