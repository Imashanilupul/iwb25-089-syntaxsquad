# Chatbot Service Deployment Guide for Ubuntu Server

## Prerequisites

- Ubuntu Server (20.04 or later)
- Python 3.8+ installed
- Root or sudo access

## Step 1: Install System Dependencies

```bash
# Update package list
sudo apt update

# Install Python 3 and pip
sudo apt install python3 python3-pip python3-venv -y

# Install other useful tools
sudo apt install git curl -y
```

## Step 2: Clone/Upload Project Files

If using Git:
```bash
cd /home/ubuntu  # or your preferred directory
git clone <your-repo-url>
cd Transparent-Governance-Platform-Ballerina/chatbot
```

Or upload the `chatbot` folder directly to your server using SCP:
```bash
# From your local machine
scp -r chatbot/ ubuntu@your-server-ip:/home/ubuntu/
```

## Step 3: Create Virtual Environment

```bash
cd /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

## Step 4: Install Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install requirements (this may take 5-10 minutes)
pip install -r requirements.txt
```

## Step 5: Configure Environment Variables

Create a `.env` file with your API keys:

```bash
nano .env
```

Add the following content (replace with your actual keys):

```env
GEMINI_API_KEY=your_gemini_api_key_here
CHROMA_API_URL=your_chroma_cloud_url_here
CHROMA_API_KEY=your_chroma_api_key_here
CHROMA_COLLECTION=my_documents
```

Save and exit (Ctrl+X, then Y, then Enter)

## Step 6: Test the Service Manually

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Start the service manually to test
uvicorn main:app --host 0.0.0.0 --port 8000

# Or with auto-reload for development
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Test by visiting: `http://your-server-ip:8000` in your browser
You should see: `{"message": "RAG Backend running with Gemini + Chroma Cloud ✅"}`

Press Ctrl+C to stop the service.

## Step 7: Create Systemd Service (Production Setup)

Create a systemd service file to run the chatbot automatically:

```bash
sudo nano /etc/systemd/system/chatbot.service
```

Add the following content (adjust paths as needed):

```ini
[Unit]
Description=Chatbot RAG Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot
Environment="PATH=/home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot/venv/bin"
ExecStart=/home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save and exit.

## Step 8: Enable and Start the Service

```bash
# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable chatbot.service

# Start the service now
sudo systemctl start chatbot.service

# Check service status
sudo systemctl status chatbot.service
```

## Step 9: Manage the Service

```bash
# Start the service
sudo systemctl start chatbot.service

# Stop the service
sudo systemctl stop chatbot.service

# Restart the service
sudo systemctl restart chatbot.service

# View logs
sudo journalctl -u chatbot.service -f

# View last 100 lines of logs
sudo journalctl -u chatbot.service -n 100
```

## Step 10: Configure Firewall (if using UFW)

```bash
# Allow port 8000
sudo ufw allow 8000/tcp

# Check firewall status
sudo ufw status
```

## Alternative: Using Screen or tmux (Quick Method)

If you don't want to set up systemd:

### Using Screen:
```bash
# Install screen
sudo apt install screen -y

# Create a new screen session
screen -S chatbot

# Activate virtual environment
cd /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot
source venv/bin/activate

# Start the service
uvicorn main:app --host 0.0.0.0 --port 8000

# Detach from screen: Press Ctrl+A, then D

# Reattach to screen
screen -r chatbot

# List screens
screen -ls
```

### Using tmux:
```bash
# Install tmux
sudo apt install tmux -y

# Create a new tmux session
tmux new -s chatbot

# Activate virtual environment
cd /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot
source venv/bin/activate

# Start the service
uvicorn main:app --host 0.0.0.0 --port 8000

# Detach from tmux: Press Ctrl+B, then D

# Reattach to tmux
tmux attach -t chatbot

# List sessions
tmux ls
```

## Step 11: Set Up Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/chatbot
```

Add the following content:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your server IP

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

## Step 12: Verify Everything is Working

```bash
# Check if service is running
sudo systemctl status chatbot.service

# Test the endpoint locally
curl http://localhost:8000

# Test from external machine
curl http://your-server-ip:8000

# Check logs for any errors
sudo journalctl -u chatbot.service -n 50
```

## Troubleshooting

### Service won't start:
```bash
# Check logs
sudo journalctl -u chatbot.service -n 100 --no-pager

# Check Python errors
cd /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot
source venv/bin/activate
python3 main.py
```

### Port already in use:
```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID
```

### Permission errors:
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot

# Fix permissions
chmod -R 755 /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot
```

### Missing environment variables:
```bash
# Verify .env file exists and has correct permissions
ls -la /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot/.env
cat /home/ubuntu/Transparent-Governance-Platform-Ballerina/chatbot/.env
```

## Performance Tuning

For production, you can adjust the number of workers:

```bash
# Edit the service file
sudo nano /etc/systemd/system/chatbot.service

# Change --workers based on CPU cores (typically: 2 * num_cores + 1)
ExecStart=/home/ubuntu/.../venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart chatbot.service
```

## Quick Command Reference

```bash
# Start service
sudo systemctl start chatbot.service

# Stop service
sudo systemctl stop chatbot.service

# Restart service
sudo systemctl restart chatbot.service

# View real-time logs
sudo journalctl -u chatbot.service -f

# Check service status
sudo systemctl status chatbot.service

# Test endpoint
curl http://localhost:8000
```

## Security Notes

1. **Never commit `.env` file to Git** - it contains sensitive API keys
2. **Use firewall rules** to restrict access if needed
3. **Consider HTTPS** - use Let's Encrypt with Nginx for SSL/TLS
4. **Restrict CORS origins** in production (edit `main.py`)
5. **Keep dependencies updated**: `pip install --upgrade -r requirements.txt`

## Connecting from Client Application

Update your client's `.env` file:

```env
NEXT_PUBLIC_CHATBOT_API_URL=http://your-server-ip:8000
# Or if using Nginx reverse proxy:
NEXT_PUBLIC_CHATBOT_API_URL=http://your-domain.com
```

---

**Need help?** Check logs with: `sudo journalctl -u chatbot.service -f`
