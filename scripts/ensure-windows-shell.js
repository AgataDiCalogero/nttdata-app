#!/usr/bin/env node

const isWsl = Boolean(process.env.WSL_DISTRO_NAME);

if (isWsl) {
  console.error(
    'Lint commands must be executed from a native Windows shell (PowerShell or CMD). Please switch the terminal before retrying.',
  );
  process.exit(1);
}
