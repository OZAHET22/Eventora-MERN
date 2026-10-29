const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function verifyAll() {
    console.log('====================================================');
    console.log('🔍 EVENTORA FULLSTACK ENVIRONMENT VERIFICATION');
    console.log('====================================================\n');

    // 1. Verify MongoDB Atlas
    console.log('1. Testing MongoDB Atlas connection...');
    const maskedUri = process.env.MONGO_URI
        ? process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@')
        : 'NOT SET';
    console.log(`   URI: ${maskedUri}`);

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 8000
        });
        console.log('   ✅ MongoDB Atlas: Connected successfully!');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   📁 Existing collections: [${collections.map(c => c.name).join(', ') || 'empty database'}]`);
    } catch (err) {
        console.error('   ❌ MongoDB Atlas Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }

    // 2. Verify Nodemailer / Gmail SMTP
    console.log('\n2. Testing Nodemailer / Gmail SMTP credentials...');
    console.log(`   User: ${process.env.EMAIL_USER}`);
    console.log(`   Password: ${process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD ? '**** (16-char App Password)' : 'NOT SET'}`);
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
            }
        });
        await transporter.verify();
        console.log('   ✅ Nodemailer: Gmail SMTP authentication verified successfully!');
    } catch (err) {
        console.error('   ❌ Nodemailer Error:', err.message);
    }

    // 3. JWT Secret
    console.log('\n3. JWT Secret...');
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ NOT SET'}`);

    console.log('\n====================================================');
    console.log('Verification check finished.');
    console.log('====================================================');
}

verifyAll();
