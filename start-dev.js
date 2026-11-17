/**
 * JobConnect India - Unified Full-Stack Dev Launcher
 * Starts Database (MongoDB) -> Backend (Express API) -> Frontend (React)
 * in a synchronized flow with automatic health verification.
 */
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

function resolveMongodPath() {
  if (process.env.MONGOD_PATH && fs.existsSync(process.env.MONGOD_PATH)) {
    return process.env.MONGOD_PATH;
  }
  const defaultPaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\5.0\\bin\\mongod.exe',
  ];
  for (const p of defaultPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const DB_PATH = path.join(__dirname, 'server', 'data', 'db');

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

const processes = [];

function cleanExit() {
  console.log('\n[JobConnect] Shutting down all services gracefully...');
  processes.forEach(p => {
    try { p.kill(); } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

async function main() {
  console.log('====================================================');
  console.log(' 🚀 Starting JobConnect Full-Stack Ecosystem');
  console.log('====================================================');

  // 0. Ensure environment configuration & data directories exist
  const envPath = path.join(__dirname, 'server', '.env');
  const envExamplePath = path.join(__dirname, 'server', '.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log(' [Config] Auto-created server/.env from server/.env.example ✅');
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
    console.log(' [Config] Ensured database directory exists at server/data/db ✅');
  }

  // 1. Check or Start MongoDB (Port 27017)
  const mongoRunning = await isPortOpen(27017);
  if (mongoRunning) {
    console.log(' [Database] MongoDB is already active on port 27017 ✅');
  } else {
    const mongodExe = resolveMongodPath();
    if (mongodExe) {
      console.log(` [Database] Launching MongoDB (${mongodExe}) on port 27017...`);
      const mongoProc = spawn(mongodExe, ['--dbpath', DB_PATH, '--port', '27017'], {
        stdio: 'ignore'
      });
      processes.push(mongoProc);
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 600));
        if (await isPortOpen(27017)) break;
      }
      console.log(' [Database] MongoDB ready ✅');
    } else {
      console.log(' [Database Notice] MongoDB executable not detected in standard paths. If using MongoDB as a Windows service or Docker, ensure it is listening on port 27017. Backend will attempt connection.');
    }
  }

  // 2. Check or Start Express Backend API (Port 5000)
  const backendRunning = await isPortOpen(5000);
  if (backendRunning) {
    console.log(' [Backend] Express API is already active on port 5000 ✅');
  } else {
    console.log(' [Backend] Launching Express API on port 5000...');
    const serverProc = spawn('node', ['server/server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    processes.push(serverProc);
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 600));
      if (await isPortOpen(5000)) break;
    }
    console.log(' [Backend] Express API ready ✅');
  }

  // 3. Start React Frontend (Port 3000)
  const frontendRunning = await isPortOpen(3000);
  if (frontendRunning) {
    console.log(' [Frontend] React Dev Server is already active on port 3000 ✅');
  } else {
    console.log(' [Frontend] Launching React Dev Server on port 3000...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const reactProc = spawn(npmCmd, ['start'], {
      stdio: 'inherit',
      cwd: __dirname,
      shell: true, // Required on Windows for .cmd/.bat files (avoids EINVAL)
      env: { ...process.env, BROWSER: 'none' }
    });
    processes.push(reactProc);
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 600));
      if (await isPortOpen(3000)) break;
    }
    console.log(' [Frontend] React Dev Server ready ✅');
  }

  console.log('\n====================================================');
  console.log(' ✅ All JobConnect Services Are Running!');
  console.log(' 🌐 Web App:    http://localhost:3000/job-board-platform');
  console.log(' 🚀 Backend API: http://localhost:5000/api/health');
  console.log(' 💾 MongoDB:    mongodb://127.0.0.1:27017/jobconnect');
  console.log('====================================================\n');
  console.log('Press Ctrl+C to stop all services.');
}

main().catch(err => {
  console.error('[Error]', err);
  cleanExit();
});
