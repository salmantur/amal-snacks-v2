import { execSync } from 'child_process';
import { rmSync } from 'fs';

try {
  console.log('Removing node_modules...');
  rmSync('/vercel/share/v0-project/node_modules', { recursive: true, force: true });
  console.log('Removed node_modules successfully');
} catch (e) {
  console.log('No node_modules to remove or error:', e.message);
}

try {
  console.log('Running npm install --legacy-peer-deps...');
  execSync('cd /vercel/share/v0-project && npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('npm install completed successfully');
} catch (e) {
  console.log('npm install error:', e.message);
}
