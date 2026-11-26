const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  if (!env.isTest) console.log(`[db] connected to ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = { connectDB };
