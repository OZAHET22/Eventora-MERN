const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / ISP DNS resolving Atlas SRV records (prevents querySrv ECONNREFUSED)
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    // Ignore if environment restricts custom DNS servers
}

/**
 * Global cache for the Mongoose connection in serverless environments.
 * In Vercel Serverless (AWS Lambda), container instances can be frozen and reused.
 * Caching both the connection and the in-flight connection promise prevents
 * race conditions and avoids exhausting MongoDB Atlas connection limits.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        const errorMsg = 
            'CRITICAL: MONGO_URI environment variable is missing. ' +
            'Please add your MongoDB Atlas connection string in your .env file or Vercel Project Settings.';
        console.error(`❌ [Database Error] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // Return active connection if already established
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // Initiate new connection if not already connecting
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,         // Fail fast if disconnected rather than hanging
            maxPoolSize: 10,              // Keep connection pool optimal for serverless instances
            serverSelectionTimeoutMS: 5000,// 5 second timeout to fail fast if Atlas is unreachable
            socketTimeoutMS: 45000,       // Close sockets after 45 seconds of inactivity
        };

        cached.promise = mongoose.connect(mongoUri, opts)
            .then((mongooseInstance) => {
                console.log('✅ [MongoDB Atlas] Connected successfully.');
                return mongooseInstance;
            })
            .catch((err) => {
                console.error('❌ [MongoDB Atlas] Connection failed:', err.message);
                cached.promise = null; // Reset promise so subsequent requests can retry
                throw err;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

module.exports = connectDB;
