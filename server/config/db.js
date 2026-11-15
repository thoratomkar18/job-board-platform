const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobconnect';

  const tryConnect = async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return true;
    } catch (error) {
      isConnected = false;
      console.warn(`[MongoDB Warning] Could not connect (${error.message}). Retrying in 5s...`);
      return false;
    }
  };

  // First attempt
  const connected = await tryConnect();
  if (!connected) {
    console.log('[MongoDB Fallback] Operating in resilient memory mode. Will retry connection every 5s...');
    // Keep retrying in background
    const retryInterval = setInterval(async () => {
      if (isConnected) { clearInterval(retryInterval); return; }
      const ok = await tryConnect();
      if (ok) {
        console.log('[MongoDB] Reconnected! Switching from memory mode to database mode.');
        clearInterval(retryInterval);
        // Re-run seed after reconnect
        try { const { autoSeedDatabase } = require('./seed'); await autoSeedDatabase(); } catch(e) {}
      }
    }, 5000);
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  database: isConnected ? mongoose.connection.name : 'In-Memory Cache (MongoDB Schema Aligned)',
});

module.exports = { connectDB, getDBStatus };
