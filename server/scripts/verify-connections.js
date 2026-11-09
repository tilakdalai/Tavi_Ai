import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getFirebaseAdmin, isFirebaseReady } from '../src/config/firebase.js';
import { getAIConfig } from '../src/config/ai.js';

dotenv.config();

console.log('====================================================');
console.log('   TAVI AI — Subsystem Connectivity Verification    ');
console.log('              Creator: Tilak Dalai                  ');
console.log('====================================================\n');

async function verifyAll() {
  const results = {
    env: { status: 'PENDING', details: '' },
    mongo: { status: 'PENDING', details: '' },
    firebase: { status: 'PENDING', details: '' },
    beam: { status: 'PENDING', details: '' },
  };

  // 1. Check Environment Variables
  console.log('1. Checking Environment Variables...');
  const requiredVars = [
    'MONGODB_URI',
    'OLLAMA_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  const missing = requiredVars.filter((key) => !process.env[key] || process.env[key].includes('your_') || process.env[key].includes('<'));
  if (missing.length === 0) {
    results.env.status = 'PASSED';
    results.env.details = 'All production environment variables configured.';
    console.log('   [PASS] All production keys are populated.');
  } else {
    results.env.status = 'INCOMPLETE';
    results.env.details = `Pending configuration for: ${missing.join(', ')}`;
    console.log(`   [INFO] Pending configuration for: ${missing.join(', ')}`);
  }

  // 2. Check MongoDB Connectivity
  console.log('\n2. Testing MongoDB Connection...');
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<username>')) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 4000,
        dbName: process.env.MONGODB_DB_NAME || 'tavi_ai',
      });
      results.mongo.status = 'PASSED';
      results.mongo.details = `Connected to Atlas cluster: ${mongoose.connection.host}`;
      console.log(`   [PASS] Successfully connected to MongoDB Atlas (${mongoose.connection.host})`);
      await mongoose.disconnect();
    } catch (err) {
      results.mongo.status = 'FAILED';
      results.mongo.details = err.message;
      console.log(`   [FAIL] MongoDB connection failed: ${err.message}`);
    }
  } else {
    results.mongo.status = 'SKIPPED';
    results.mongo.details = 'MONGODB_URI is not yet provided or contains placeholders.';
    console.log('   [SKIPPED] Provide MONGODB_URI in server/.env to test live database connection.');
  }

  // 3. Check Firebase Admin SDK
  console.log('\n3. Testing Firebase Admin Configuration...');
  getFirebaseAdmin();
  if (isFirebaseReady()) {
    results.firebase.status = 'PASSED';
    results.firebase.details = `Firebase Admin initialized with project: ${process.env.FIREBASE_PROJECT_ID}`;
    console.log(`   [PASS] Firebase Admin initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);
  } else {
    results.firebase.status = 'SKIPPED';
    results.firebase.details = 'Service account credentials pending in server/.env.';
    console.log('   [SKIPPED] Firebase Admin credentials not yet provided in server/.env.');
  }

  // 4. Check Beam Cloud (Ollama Cloud)
  console.log('\n4. Testing Beam Cloud (Ollama Cloud) Connectivity...');
  const { client, model, hasApiKey, host } = getAIConfig();
  console.log(`   Host: ${host}`);
  console.log(`   Configured Model: ${model}`);
  
  if (hasApiKey) {
    try {
      console.log('   Connecting to Ollama Cloud endpoint with API key...');
      // Test basic chat or model inspection
      const testResponse = await client.chat({
        model,
        messages: [{ role: 'user', content: 'Respond with the single word: "READY"' }],
        stream: false,
      });
      const output = testResponse?.message?.content?.trim();
      results.beam.status = 'PASSED';
      results.beam.details = `Response from ${model}: "${output}"`;
      console.log(`   [PASS] Beam Cloud responded successfully: ${output}`);
    } catch (err) {
      results.beam.status = 'FAILED';
      results.beam.details = err.message;
      console.log(`   [FAIL] Beam Cloud connection error: ${err.message}`);
    }
  } else {
    results.beam.status = 'SKIPPED';
    results.beam.details = 'OLLAMA_API_KEY is not configured yet.';
    console.log('   [SKIPPED] OLLAMA_API_KEY is not set. Add your key to server/.env to test live inference.');
  }

  console.log('\n====================================================');
  console.log('               Verification Summary                 ');
  console.log('====================================================');
  console.table(results);
}

verifyAll();

