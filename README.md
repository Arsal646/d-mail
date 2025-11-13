# Temporary Email Service

A complete Docker-based temporary email service built with a custom Node.js SMTP server, REST API, and MongoDB.

## Features

- **Custom SMTP Server**: Lightweight Node.js SMTP server that receives emails
- **REST API**: Express.js API to retrieve and manage emails
- **MongoDB**: Persistent storage for all emails
- **Docker Compose**: Single command deployment
- **No Email Deletion**: All emails are kept permanently (no TTL or cleanup)
- **Accept Any Email**: No restrictions on sender or recipient addresses

## Architecture

The service consists of three Docker containers:

1. **smtp**: Custom Node.js SMTP server that receives emails and stores them in MongoDB
2. **api**: Express.js API server that provides REST endpoints
3. **mongo**: MongoDB database for email storage

## Quick Start

### 1. Setup Environment

Copy the example environment file and configure your domain:

```bash
copy .env.example .env
```

Edit `.env` and set your domain:

```env
TEMP_DOMAIN=yourdomain.com
API_TEMP_DOMAIN=yourdomain.com
```

### 2. Start Services

Run all services with Docker Compose:

```bash
docker-compose up -d
```

This will:
- Start MongoDB on internal port 27017
- Start custom SMTP server on port 25
- Start API server on port 4000

### 3. Test the Service

#### Send a test email:

Send an email to any address at your domain, for example: `test@yourdomain.com`

#### Check for messages:

```bash
curl http://localhost:4000/api/inbox/test/messages
```

#### Get a specific message:

```bash
curl http://localhost:4000/api/inbox/test/messages/MESSAGE_ID
```

#### Create a random inbox (optional):

```bash
curl -X POST http://localhost:4000/api/inbox
```

## API Endpoints

### GET /api/inbox/:username/messages
Returns all messages for the specified username, sorted by newest first.

**Response:**
```json
{
  "inbox": "test",
  "count": 2,
  "messages": [
    {
      "id": "string",
      "subject": "string",
      "from": "string",
      "to": "string",
      "receivedAt": "ISO date string",
      "hasHtml": boolean
    }
  ]
}
```

### GET /api/inbox/:username/messages/:id
Returns the full content of a specific message.

**Response:**
```json
{
  "id": "string",
  "inboxToken": "string",
  "from": "string",
  "to": "string",
  "subject": "string",
  "text": "string",
  "html": "string or null",
  "receivedAt": "ISO date string"
}
```

### DELETE /api/inbox/:username/messages
Deletes all messages for the specified username.

### GET /api/inbox/:username/count
Returns the number of messages in the specified inbox.

### POST /api/inbox
Creates a random inbox token (optional - any username works).

## Configuration

### Environment Variables

- `TEMP_DOMAIN`: Domain for receiving emails (default: tempmail.local)
- `API_TEMP_DOMAIN`: Domain used in API responses (default: tempmail.local)
- `MONGO_URI`: MongoDB connection string (default: mongodb://mongo:27017)
- `MONGO_DB_NAME`: MongoDB database name (default: tempmail)
- `MONGO_COLLECTION`: MongoDB collection name (default: emails)
- `API_PORT`: API server port (default: 4000)

### DNS Configuration

For production use, configure your domain's MX record to point to your server:

```
MX 10 yourdomain.com
```

## Development

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f smtp
docker-compose logs -f api
docker-compose logs -f mongo
```

### Rebuild Services

```bash
# Rebuild all
docker-compose up --build

# Rebuild specific service
docker-compose up --build smtp
```

### Stop Services

```bash
docker-compose down
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

## File Structure

```
project/
├── docker-compose.yml
├── .env.example
├── README.md
├── smtp-server/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── api/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── server.js
        ├── db/
        │   └── mongoClient.js
        ├── models/
        │   └── emailModel.js
        └── routes/
            └── inboxRoutes.js
```

## VPS Deployment (Ubuntu)

### Complete Ubuntu VPS Setup Commands

#### 1. Initial Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git ufw

# Setup firewall
sudo ufw allow ssh
sudo ufw allow 25/tcp
sudo ufw allow 4000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

#### 2. Install Docker
```bash
# Remove old Docker versions
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install Docker dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 3. Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 4. Deploy Email Service
```bash
# Clone your project (replace with your repository)
git clone https://github.com/yourusername/temp-email-service.git
cd temp-email-service

# Or upload files manually and create directory
mkdir temp-email-service
cd temp-email-service
# Upload all your project files here

# Setup environment
cp .env.example .env

# Edit environment file with your domain
nano .env
```

#### 5. Configure Environment (.env file)
```bash
# Edit .env file with your actual domain
TEMP_DOMAIN=yourdomain.com
API_TEMP_DOMAIN=yourdomain.com
MONGO_URI=mongodb://mongo:27017
MONGO_DB_NAME=tempmail
MONGO_COLLECTION=emails
API_PORT=4000
```

#### 6. Start Services
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### 7. Setup MongoDB Indexes (Critical for many emails/day)
```bash
# Wait for MongoDB to be ready
sleep 30

# Create performance indexes
docker-compose exec mongo mongosh tempmail --eval "
db.emails.createIndex({ 'inboxToken': 1, 'receivedAt': -1 });
db.emails.createIndex({ 'receivedAt': -1 });
db.emails.createIndex({ '_id': 1, 'inboxToken': 1 });
print('✅ Indexes created successfully');
"
```

#### 8. Configure DNS (Required)
Set up MX record for your domain:
```
Type: MX
Name: @
Value: yourdomain.com
Priority: 10
TTL: 3600
```

#### 9. Test Deployment
```bash
# Test API health
curl http://your-server-ip:4000/health

# Test inbox creation
curl -X POST http://your-server-ip:4000/api/inbox

# Send test email (from any email client to test@yourdomain.com)
# Then check messages
curl http://your-server-ip:4000/api/inbox/test/messages
```

#### 10. Production Monitoring
```bash
# Monitor email processing
docker-compose logs smtp | grep "emails processed"

# Check resource usage
docker stats

# Monitor disk space
df -h

# Check MongoDB status
docker-compose exec mongo mongosh --eval "db.serverStatus().connections"
```

#### 11. Maintenance Commands
```bash
# View logs
docker-compose logs -f smtp
docker-compose logs -f api
docker-compose logs -f mongo

# Restart services
docker-compose restart

# Update and rebuild
git pull
docker-compose up --build -d

# Backup MongoDB
docker-compose exec mongo mongodump --out /backup

# Stop services
docker-compose down

# Remove everything (including data)
docker-compose down -v
```

#### 12. SSL Setup (Optional but Recommended)
```bash
# Install Certbot
sudo apt install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Setup nginx reverse proxy for API
sudo apt install -y nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/tempmail

# Add this config:
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/tempmail /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Server Requirements for 20K emails/day:
- **CPU**: 4+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 50GB+ SSD
- **Network**: Good bandwidth
- **OS**: Ubuntu 20.04+ LTS

### Troubleshooting:
```bash
# If port 25 is blocked by ISP
# Contact your VPS provider to unblock port 25
# Some providers block it by default

# Check if port 25 is open
telnet your-server-ip 25

# Check firewall
sudo ufw status

# Check Docker logs
docker-compose logs --tail=100 smtp
```

## Production Notes

- Configure proper DNS MX records for your domain
- Use environment variables for sensitive configuration
- Monitor disk usage as emails are stored permanently
- Set up proper logging and monitoring
- Consider adding rate limiting for production use
- Use SSL certificates for API endpoints
- Regular backups of MongoDB data

## How It Works

1. **Email Reception**: The SMTP server listens on port 25 and accepts emails for any address at your domain
2. **Email Storage**: Incoming emails are parsed and stored in MongoDB with the username as the inbox token
3. **API Access**: Use the REST API to retrieve emails by username (e.g., `test@yourdomain.com` → `/api/inbox/test/messages`)
4. **No Restrictions**: Send emails from any address to any username at your domain

## Troubleshooting

### SMTP Server Issues
1. Check SMTP logs: `docker-compose logs smtp`
2. Verify DNS MX records point to your server
3. Ensure port 25 is open and accessible
4. Check domain configuration in `.env` file

### API Connection Issues
1. Check API logs: `docker-compose logs api`
2. Verify MongoDB connection
3. Ensure port 4000 is accessible

### MongoDB Issues
1. Check MongoDB logs: `docker-compose logs mongo`
2. Verify volume permissions
3. Check available disk space