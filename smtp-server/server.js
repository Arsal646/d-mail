const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { MongoClient, ObjectId } = require('mongodb');

let mongoClient = null;
let db = null;

// Performance monitoring
let emailCount = 0;
let errorCount = 0;
setInterval(() => {
    console.log(`📊 Last hour: ${emailCount} emails processed, ${errorCount} errors`);
    emailCount = 0;
    errorCount = 0;
}, 3600000); // Every hour

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017';
const dbName = process.env.MONGO_DB_NAME || 'tempmail';
const collectionName = process.env.MONGO_COLLECTION || 'emails';
const tempDomain = process.env.TEMP_DOMAIN || 'tempmail.local';

async function connectToMongo() {
    try {
        mongoClient = new MongoClient(mongoUri, {
            maxPoolSize: 50,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0
        });

        await mongoClient.connect();
        db = mongoClient.db(dbName);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

// Create SMTP server
const server = new SMTPServer({
    // Allow all authentication
    authOptional: true,

    // Accept all recipients for our domain
    onRcptTo(address, session, callback) {
        const email = address.address;
        const domain = email.split('@')[1];

        if (domain !== tempDomain) {
            return callback(new Error('Domain not accepted'));
        }

        console.log(`Accepting email for: ${email}`);
        callback();
    },

    // Handle incoming emails
    onData(stream, session, callback) {
        let emailData = '';

        stream.on('data', (chunk) => {
            emailData += chunk;
        });

        stream.on('end', async () => {
            try {
                // Parse the email
                const parsed = await simpleParser(emailData);

                // Get recipient info
                const recipient = session.envelope.rcptTo[0];
                const recipientEmail = recipient.address;
                const inboxToken = recipientEmail.split('@')[0];

                // Create email document
                const emailDoc = {
                    _id: new ObjectId(),
                    inboxToken: inboxToken,
                    from: parsed.from ? parsed.from.text : '',
                    to: recipientEmail,
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || null,
                    receivedAt: new Date()
                };

                // Insert into MongoDB with optimized write concern
                const collection = db.collection(collectionName);
                await collection.insertOne(emailDoc, {
                    writeConcern: { w: 1, j: false }
                });

                emailCount++;
                console.log(`Email stored for inbox: ${inboxToken} from: ${parsed.from ? parsed.from.text : 'unknown'}`);
                callback();

            } catch (error) {
                errorCount++;
                console.error('Error processing email:', error);
                callback(error);
            }
        });
    }
});

// Start server
async function startServer() {
    await connectToMongo();

    server.listen(25, '0.0.0.0', () => {
        console.log('SMTP server listening on port 25');
        console.log(`Accepting emails for domain: ${tempDomain}`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down SMTP server...');
    server.close(() => {
        if (mongoClient) {
            mongoClient.close();
        }
        process.exit(0);
    });
});

startServer().catch(console.error);