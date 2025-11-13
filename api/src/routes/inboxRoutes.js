const express = require('express');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const EmailModel = require('../models/emailModel');

const router = express.Router();

// Generate a random inbox token
function generateInboxToken() {
    return crypto.randomBytes(8).toString('hex'); // 16 character hex string
}

// POST /api/inbox - Create a new inbox (optional - any email address works)
router.post('/inbox', async (req, res) => {
    try {
        const token = generateInboxToken();
        const domain = process.env.API_TEMP_DOMAIN || 'tempmail.local';
        const address = `${token}@${domain}`;

        res.json({
            token,
            address,
            note: "You can also send emails to any address at this domain and check messages using the local part as the token"
        });
    } catch (error) {
        console.error('Error creating inbox:', error);
        res.status(500).json({ error: 'Failed to create inbox' });
    }
});

// GET /api/inbox/:token/messages - Get all messages for an inbox
router.get('/inbox/:token/messages', async (req, res) => {
    try {
        const { token } = req.params;

        const emails = await EmailModel.findByInboxToken(token);
        const emailSummaries = emails.map(email => EmailModel.formatEmailSummary(email));

        res.json({
            inbox: token,
            count: emailSummaries.length,
            messages: emailSummaries
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// GET /api/inbox/:token/messages/:id - Get a specific message
router.get('/inbox/:token/messages/:id', async (req, res) => {
    try {
        const { token, id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid message ID' });
        }

        const email = await EmailModel.findById(id, token);

        if (!email) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const fullEmail = EmailModel.formatFullEmail(email);
        res.json(fullEmail);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

// DELETE /api/inbox/:token/messages - Delete all messages for an inbox (optional)
router.delete('/inbox/:token/messages', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await EmailModel.deleteByInboxToken(token);

        res.json({
            message: 'Messages deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting messages:', error);
        res.status(500).json({ error: 'Failed to delete messages' });
    }
});

// GET /api/inbox/:token/count - Get message count for an inbox
router.get('/inbox/:token/count', async (req, res) => {
    try {
        const { token } = req.params;

        const count = await EmailModel.countByInboxToken(token);

        res.json({
            inbox: token,
            count
        });
    } catch (error) {
        console.error('Error counting messages:', error);
        res.status(500).json({ error: 'Failed to count messages' });
    }
});

module.exports = router;