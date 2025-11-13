const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'tempmail';

async function connectToMongo() {
    if (client) {
        return { client, db };
    }

    try {
        client = new MongoClient(MONGO_URI, {
            maxPoolSize: 30,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0
        });

        await client.connect();
        db = client.db(DB_NAME);

        console.log(`Connected to MongoDB database: ${DB_NAME}`);
        return { client, db };
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not connected. Call connectToMongo() first.');
    }
    return db;
}

function getCollection(collectionName = null) {
    const database = getDb();
    const collection = collectionName || process.env.MONGO_COLLECTION || 'emails';
    return database.collection(collection);
}

module.exports = {
    connectToMongo,
    getDb,
    getCollection
};