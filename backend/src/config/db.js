import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { backendRoot, uploadDir } from './paths.js';

let memoryServer;

export async function connectDB() {
  fs.mkdirSync(uploadDir, { recursive: true });
  mongoose.set('strictQuery', true);

  const uri = process.env.MONGODB_URI?.trim();
  if (uri) {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    return { memory: false };
  }

  console.log('MONGODB_URI is empty — starting an in-memory MongoDB for local demo.');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.join(backendRoot, '.data', 'mongo');
  fs.rmSync(dbPath, { recursive: true, force: true });
  fs.mkdirSync(dbPath, { recursive: true });
  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbPath,
      args: ['--wiredTigerCacheSizeGB', '0.25'],
    },
  });
  await mongoose.connect(memoryServer.getUri());
  console.log('In-memory MongoDB is ready. Data lasts only while this process is running.');
  return { memory: true };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
