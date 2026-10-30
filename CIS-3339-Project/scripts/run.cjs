const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const root = path.join(__dirname, '..');
const demo = process.argv.includes('--demo'),
  production = process.argv.includes('--production');
const children = [];
let mongo,
  stopping = false;
function command(exe, args, cwd, env, wait = false) {
  const child = spawn(exe, args, { cwd, env, stdio: 'inherit' });
  children.push(child);
  child.on('error', (e) => {
    console.error(e.message);
    shutdown(1);
  });
  if (wait)
    return new Promise((resolve, reject) =>
      child.on('exit', (code) =>
        code === 0
          ? resolve()
          : reject(new Error('Command failed: ' + args.join(' ')))
      )
    );
  child.on('exit', (code) => {
    if (!stopping) shutdown(code || 0);
  });
  return child;
}
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children)
    if (child.exitCode === null) child.kill('SIGTERM');
  if (mongo) await mongo.stop({ doCleanup: false });
  process.exit(code);
}
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
(async () => {
  require('../backend/node_modules/dotenv').config({
    path: path.join(root, 'backend', '.env')
  });
  const env = { ...process.env };
  if (demo) {
    console.log(
      'Starting local MongoDB. First run downloads the free database binary; no cloud account needed.'
    );
    const {
      MongoMemoryServer
    } = require('../backend/node_modules/mongodb-memory-server');
    const dbPath =
      process.env.CIS3339_DEMO_DB_PATH || path.join(root, '.local-db');
    fs.mkdirSync(dbPath, { recursive: true });
    mongo = await MongoMemoryServer.create({
      instance: {
        dbPath,
        args: process.platform === 'win32' ? [] : ['--nounixsocket']
      }
    });
    env.MONGO_URL = mongo.getUri('cis3339');
    await command(
      process.execPath,
      ['scripts/init-db.js'],
      path.join(root, 'backend'),
      env,
      true
    );
  }
  if (production)
    await command(
      process.execPath,
      [
        path.join(root, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'),
        'build'
      ],
      path.join(root, 'frontend'),
      env,
      true
    );
  command(process.execPath, ['app.js'], path.join(root, 'backend'), env);
  command(
    process.execPath,
    [
      path.join(root, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'),
      ...(production ? ['preview'] : []),
      '--host',
      '127.0.0.1',
      '--port',
      '5173',
      '--strictPort'
    ],
    path.join(root, 'frontend'),
    env
  );
  console.log(
    '\nOpen http://localhost:5173\nEditor: admin / admin\nViewer: user / user\nPress Ctrl+C to stop. Demo data stays in .local-db.\n'
  );
})().catch((e) => {
  console.error('Could not start: ' + e.message);
  shutdown(1);
});
