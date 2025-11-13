// MongoDB indexes for high-volume email processing
// Run this after starting your containers: docker-compose exec mongo mongosh tempmail setup-indexes.js

// Create indexes for fast queries
db.emails.createIndex({ "inboxToken": 1, "receivedAt": -1 });
db.emails.createIndex({ "receivedAt": -1 });
db.emails.createIndex({ "_id": 1, "inboxToken": 1 });

// Show created indexes
db.emails.getIndexes();

print("✅ Indexes created successfully for high-volume email processing");
print("📊 These indexes will speed up queries for 20K+ emails/day");