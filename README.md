# Digital Asset Protection System

A robust system for sports media rights management. Uses perceptual hashing (pHash) to fingerprint images and videos, allowing detection of unauthorized usage even if files are edited (cropped, resized, or compressed).

## Features
- **Asset Protection**: Upload media to generate a unique digital fingerprint and store it in MongoDB.
- **Similarity Scanning**: Compare new files against the database to detect copyright infringement.
- **Video Support**: Samples multiple keyframes to create a temporal-perceptual hash.
- **Modern Dashboard**: Glassmorphic UI built with React and Framer Motion.

## Prerequisites
- **Python 3.8+**
- **Node.js & npm**
- **MongoDB** (Local or Atlas)
- **FFmpeg** (Required for video processing)

## Setup Instructions

### 1. Backend Setup
1. Open a terminal in the `backend/` directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```

### 2. Frontend Setup
1. Open a terminal in the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Database
Ensure MongoDB is running locally on `mongodb://localhost:27017/`. You can change this in `backend/database.py` if needed.

## Tech Stack
- **Backend**: Flask, MongoDB, imagehash, OpenCV
- **Frontend**: React, Vite, Lucide React, Framer Motion, Axios
