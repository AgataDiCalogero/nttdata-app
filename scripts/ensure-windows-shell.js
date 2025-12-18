#!/usr/bin/env node

const isWsl = Boolean(process.env.WSL_DISTRO_NAME);

// In WSL, if you're executing the Windows Node binary (node.exe), Angular tooling
// can crash with UtilBindVsockAnyPort socket errors.
// Allow Linux Node inside WSL, and allow explicit bypass when needed.
const isWindowsNodeBinary = /node\.exe$/i.test(process.execPath);
const allowWsl = process.env.ALLOW_WSL === '1';

if (isWsl && isWindowsNodeBinary && !allowWsl) {
  console.error(
    [
      'Detected WSL + Windows Node binary (node.exe).',
      'This setup often crashes (e.g., UtilBindVsockAnyPort: socket failed).',
      '',
      'Fix options:',
      '  1) Run from native Windows PowerShell/CMD, OR',
      '  2) Use a Linux Node inside WSL, OR',
      '  3) Bypass (at your own risk): set ALLOW_WSL=1',
    ].join('\n'),
  );
  process.exit(1);
}
