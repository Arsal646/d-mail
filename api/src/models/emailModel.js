const { ObjectId } = require('mongodb');
const { getCollection } = require('../db/mongoClient');

class EmailModel {
    static async findByInboxToken(inboxToken, sortBy = { receivedAt: -1 }) {
        try {
            const collection = getCollection();
            const emails = await collection
                .find({ inboxToken })
                .sort(sortBy)
                .toArray();
            
            return emails;
        } catch (error) {
            console.error('Error finding emails by inbox token:', error);
            throw error;
        }
    }
    
    static async findById(id, inboxToken = null) {
        try {
            const collection = getCollection();
            const query = { _id: new ObjectId(id) };
            
            // Optional: verify the email belongs to the inbox token
            if (inboxToken) {
                query.inboxToken = inboxToken;
            }
            
            const email = await collection.findOne(query);
            return email;
        } catch (error) {
            console.error('Error finding email by ID:', error);
            throw error;
        }
    }
    
    static async deleteByInboxToken(inboxToken) {
        try {
            const collection = getCollection();
            const result = await collection.deleteMany({ inboxToken });
            return result;
        } catch (error) {
            console.error('Error deleting emails by inbox token:', error);
            throw error;
        }
    }
    
    static async countByInboxToken(inboxToken) {
        try {
            const collection = getCollection();
            const count = await collection.countDocuments({ inboxToken });
            return count;
        } catch (error) {
            console.error('Error counting emails by inbox token:', error);
            throw error;
        }
    }
    
    static formatEmailSummary(email) {
        return {
            id: email._id.toString(),
            subject: email.subject,
            from: email.from,
            to: email.to,
            receivedAt: email.receivedAt.toISOString(),
            hasHtml: !!email.html
        };
    }
    
    static formatFullEmail(email) {
        return {
            id: email._id.toString(),
            inboxToken: email.inboxToken,
            from: email.from,
            to: email.to,
            subject: email.subject,
            text: email.text,
            html: email.html,
            receivedAt: email.receivedAt.toISOString()
        };
    }
}

module.exports = EmailModel;