const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/belimuno_jobs";
    const options = { serverSelectionTimeoutMS: 10000 };
    let conn;

    try {
      conn = await mongoose.connect(mongoUri, options);
    } catch (error) {
      // Some local DNS resolvers reject MongoDB SRV lookups. Retry without
      // changing the URI so hosted environments keep their normal resolver.
      if (!String(error?.message || '').includes('querySrv')) {
        throw error;
      }
      dns.setServers(['1.1.1.1', '8.8.8.8']);
      conn = await mongoose.connect(mongoUri, options);
    }

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    throw err;
  }
};

module.exports = connectDB;
