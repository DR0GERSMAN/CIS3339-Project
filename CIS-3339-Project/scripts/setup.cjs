const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const root = path.join(__dirname, '..');
if (Number(process.versions.node.split('.')[0]) < 20) {
  console.error('Install Node.js 22 LTS or newer.');
  process.exit(1);
}
for (const folder of ['backend', 'frontend']) {
  console.log('Installing ' + folder + ' dependencies...');
  const command = fs.existsSync(path.join(root, folder, 'package-lock.json'))
    ? 'ci'
    : 'install';
  const r = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    [command, '--no-audit', '--no-fund'],
    {
      cwd: path.join(root, folder),
      stdio: 'inherit',
      shell: process.platform === 'win32'
    }
  );
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status || 1);
}
// Keep runtime credentials local; generate a unique signing secret on each machine.
for (const folder of ['backend', 'frontend']) {
  const target = path.join(root, folder, '.env');
  if (!fs.existsSync(target)) {
    const template = fs.readFileSync(path.join(root, folder, '.env.example'), 'utf8');
    fs.writeFileSync(target, template.replace('REPLACE_WITH_LOCAL_SECRET', randomBytes(32).toString('hex')), { mode: 0o600 });
  }
}
console.log('Setup complete. Run npm run demo:production.');
