import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// Emulator caches stay in the workspace; no real Firebase account is needed.
const workspace = process.cwd();
const configDir = path.join(workspace, '.firebase', 'config');
const emulatorDir = path.join(workspace, '.firebase', 'emulators');
await mkdir(configDir, { recursive: true });
await mkdir(emulatorDir, { recursive: true });
const command = process.argv[2] === 'rules' ? 'node --test tests/rules/*.test.mjs' : 'playwright test';
const child = spawn(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:exec', '--project', 'demo-justitia', '--only', 'auth,firestore,storage', command], {
  stdio: 'inherit', windowsHide: true,
  env: { ...process.env, DEBUG: '', XDG_CONFIG_HOME: configDir, FIREBASE_EMULATORS_PATH: emulatorDir, CI: 'true', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true' }
});
child.on('exit', code => { process.exitCode = code || 0; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
