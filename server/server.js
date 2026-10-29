const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables (checks both root and server directory)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');

const app = express();

// ==========================================
// 1. Core Middlewares
// ==========================================
app.use(cors({
    origin: true, // Reflect request origin to allow localhost and any Vercel domain/preview
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. Database Connection Middleware
// Ensures MongoDB Atlas is connected before executing any route
// ==========================================
app.use(async (req, res, next) => {
    // Skip DB connection for root health check ping
    if (req.path === '/' || req.path === '/api' || req.path === '/api/health') {
        return next();
    }

    try {
        await connectDB();
        next();
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Database Connection Error',
            message: process.env.NODE_ENV === 'production'
                ? 'Unable to connect to database. Please check MongoDB Atlas network access and configuration.'
                : err.message
        });
    }
});

// ==========================================
// 3. Health Check & Diagnostics
// ==========================================
const healthHandler = (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: 'ok',
        service: 'Eventora API',
        environment: process.env.NODE_ENV || 'development',
        database: states[mongoose.connection.readyState] || 'unknown',
        timestamp: new Date().toISOString()
    });
};

app.get('/', healthHandler);
app.get('/api', healthHandler);
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// ==========================================
// 4. API Routes
// Mounted with both /api prefix and without prefix
// to handle both direct access and Vercel path rewrites
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Fallbacks for rewrites where /api may be stripped
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/bookings', bookingRoutes);

// ==========================================
// 5. 404 Handler for Undefined API Routes
// ==========================================
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// ==========================================
// 6. Centralized Error Handler
// ==========================================
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ==========================================
// 7. Standalone Server (Local Development)
// ==========================================
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, async () => {
        console.log(`🚀 Eventora server running at http://localhost:${PORT}`);
        try {
            await connectDB();
        } catch (err) {
            console.warn('⚠️ Server started but MongoDB connection failed. Retrying on next request.');
        }
    });
}

// Export for Vercel Serverless Function (/api/index.js)
module.exports = app;
