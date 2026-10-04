import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import { runSeed } from './seed.js';

await connectDB();
await runSeed();
await disconnectDB();
process.exit(0);
