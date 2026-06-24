// server.ts
// Node.js bridging engine to launch and supervise the Python backend.

import { spawn, ChildProcess } from 'child_process';
import path from 'path';

console.log("=== Node.js Process Supervisor Initializing ===");

const isProd = process.env.NODE_ENV === 'production';
const activeProcesses: ChildProcess[] = [];

if (!isProd) {
  console.log("[Supervisor] Running in DEVELOPMENT mode.");
  console.log("[Supervisor] Booting Python backend on internal port 8000...");
  
  // Start Python backend on port 8000
  const pythonProcess = spawn('python3', [path.join(process.cwd(), 'server.py')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '8000' }
  });
  activeProcesses.push(pythonProcess);

  // Start Vite dev server on port 3000
  console.log("[Supervisor] Booting Vite development server on external port 3000...");
  const viteProcess = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
  activeProcesses.push(viteProcess);

  // Monitor process exits
  pythonProcess.on('close', (code) => {
    console.log(`[Supervisor] Python server exited with code ${code}. Stopping supervisor...`);
    cleanupAndExit(code ?? 0);
  });

  viteProcess.on('close', (code) => {
    console.log(`[Supervisor] Vite dev server exited with code ${code}. Stopping supervisor...`);
    cleanupAndExit(code ?? 0);
  });

} else {
  console.log("[Supervisor] Running in PRODUCTION mode.");
  console.log("[Supervisor] Launching Python backend on external port 3000 to serve compiled files...");
  
  // Start Python backend on port 3000 (direct port)
  const pythonProcess = spawn('python3', [path.join(process.cwd(), 'server.py')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3000' }
  });
  activeProcesses.push(pythonProcess);

  pythonProcess.on('close', (code) => {
    console.log(`[Supervisor] Python server exited with code ${code}`);
    cleanupAndExit(code ?? 0);
  });

  pythonProcess.on('error', (err) => {
    console.error('[Supervisor] Failed to start Python process:', err);
    process.exit(1);
  });
}

function cleanupAndExit(code: number) {
  for (const proc of activeProcesses) {
    if (proc && !proc.killed) {
      try {
        proc.kill('SIGTERM');
      } catch (e) {}
    }
  }
  process.exit(code);
}

// Clean shutdown on signals
const handleSignal = (signal: string) => {
  console.log(`[Supervisor] Received ${signal}. Terminating all supervised processes...`);
  cleanupAndExit(0);
};

process.on('SIGTERM', () => handleSignal('SIGTERM'));
process.on('SIGINT', () => handleSignal('SIGINT'));
