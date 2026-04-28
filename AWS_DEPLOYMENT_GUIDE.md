# AWS EC2 Deployment Guide: AssetGuard Backend

This guide explains how to deploy your Flask backend to your **AWS EC2 Instance** (`16.16.142.196`) using Docker.

## Prerequisites

- **PEM Key**: `C:\Users\mrswa\Downloads\assetguard.pem`
- **Instance IP**: `16.16.142.196`
- **Security Group**: Ensure Port **5000** is open in your AWS EC2 Security Group settings.

---

## Step 1: Transfer Code to EC2

Run this command from your local machine (PowerShell or Terminal) in the `backend` directory:

```powershell
# In your local backend directory:
scp -i "C:\Users\mrswa\Downloads\assetguard.pem" -r ./* ubuntu@16.16.142.196:/home/ubuntu/app
```
*(Note: If the username is not `ubuntu`, it might be `ec2-user`. Try `ubuntu` first for standard Ubuntu AMIs.)*

## Step 2: Connect to EC2 and Setup

SSH into your instance:

```powershell
ssh -i "C:\Users\mrswa\Downloads\assetguard.pem" ubuntu@16.16.142.196
```

Once logged in, run the following commands to install Docker and run the app:

```bash
# 1. Update and install Docker
sudo apt-get update
sudo apt-get install -y docker.io

# 2. Add your user to the docker group
sudo usermod -aG docker $USER
# (Log out and log back in for this to take effect, or just use 'sudo' for docker commands)

# 3. Build the Docker image
cd ~/app
sudo docker build -t assetguard-backend .

# 4. Run the container
# Replace your MongoDB URI here
sudo docker run -d -p 5000:5000 \
  -e MONGO_URI="your_mongodb_uri_here" \
  -e PORT=5000 \
  --name assetguard-api \
  assetguard-backend
```

## Step 3: Verify the Deployment

Check if the container is running:
```bash
sudo docker ps
```

You can now access your API at: `http://16.16.142.196:5000/api/stats`

---

### Pro Tip: Using Docker Compose (Optional)

If you want to manage environment variables more easily, you can create a `docker-compose.yml` file on the EC2 instance.

### Updating the App

Whenever you make changes locally:
1. Re-run the `scp` command to update the files.
2. SSH in, rebuild the image: `sudo docker build -t assetguard-backend .`
3. Restart the container:
   ```bash
   sudo docker stop assetguard-api
   sudo docker rm assetguard-api
   sudo docker run -d -p 5000:5000 ... (same as step 4 above)
   ```
