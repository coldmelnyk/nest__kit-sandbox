import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import type { TestProject } from 'vitest/node';

const require = createRequire(import.meta.url);

// Global setup runs outside the test workers, so `test.env` must be passed on by hand.
const setup = (project: TestProject): void => {
  const prismaCli = require.resolve('prisma/build/index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, ...project.config.env },
  });
};

export default setup;
