from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from hasher import generate_image_hash, generate_video_hash
from database import save_asset, get_all_assets, find_matching_assets, save_detection, get_stats, delete_asset, delete_detection
from datetime import datetime

import random

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4', 'avi', 'mov'}

def get_simulated_source():
    platforms = ["Instagram", "YouTube", "Twitter", "Website", "Facebook", "Reddit"]
    platform = random.choice(platforms)
    
    # Generate a fake random ID for the URL
    rand_id = ''.join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=8))
    
    urls = {
        "Instagram": f"https://instagram.com/p/{rand_id}",
        "YouTube": f"https://youtube.com/watch?v={rand_id}",
        "Twitter": f"https://twitter.com/status/{rand_id}",
        "Website": f"https://example-news-site.com/media/{rand_id}",
        "Facebook": f"https://facebook.com/posts/{rand_id}",
        "Reddit": f"https://reddit.com/r/sports/comments/{rand_id}"
    }
    
    return platform, urls.get(platform, "https://unknown.com")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_asset():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Determine type and generate hash
        file_ext = filename.rsplit('.', 1)[1].lower()
        is_video = file_ext in {'mp4', 'avi', 'mov'}
        
        hashes = []
        if is_video:
            hashes = generate_video_hash(file_path)
            asset_type = "video"
        else:
            h = generate_image_hash(file_path)
            hashes = [h] if h else []
            asset_type = "image"
            
        if not hashes:
            return jsonify({"error": "Failed to generate fingerprint"}), 500
            
        asset_data = {
            "filename": filename,
            "type": asset_type,
            "hashes": hashes,
            "file_path": file_path
        }
        
        asset_id = save_asset(asset_data)
        return jsonify({"message": "Asset uploaded and protected", "id": asset_id}), 201
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/compare', methods=['POST'])
def compare_asset():
    """
    SIMULATION: Real-world Content Monitoring
    This endpoint simulates an automated web crawler discovering content.
    The uploaded file is treated as 'Externally Found Media' which we then
    compare against our 'Protected Assets' database to detect infringements.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], "temp_" + filename)
        file.save(temp_path)
        
        file_ext = filename.rsplit('.', 1)[1].lower()
        is_video = file_ext in {'mp4', 'avi', 'mov'}
        
        hashes = []
        if is_video:
            hashes = generate_video_hash(temp_path)
        else:
            h = generate_image_hash(temp_path)
            hashes = [h] if h else []
            
        os.remove(temp_path) # Cleanup temp file
        
        if not hashes:
            return jsonify({"error": "Failed to process query file"}), 500
            
        matches = find_matching_assets(hashes, is_video=is_video)
        
        # Enrich matches with simulated platform and risk data
        for match in matches:
            platform, url = get_simulated_source()
            similarity = match["similarity"]
            
            # Risk level logic
            risk = "High" if similarity > 85 else "Medium" if similarity > 60 else "Low"
            
            # Update match object with requested fields
            match.update({
                "platform": platform,
                "url": url,
                "risk": risk,
                "matched_file": match["filename"],
                "timestamp": datetime.now().strftime("%d %b %Y, %I:%M %p")
            })
            
            # Record detection in database
            save_detection({
                "original_file": filename,
                "matched_file": match["matched_file"],
                "similarity": similarity,
                "platform": platform,
                "url": url,
                "risk": risk
            })
            
        return jsonify({
            "matches_found": len(matches) > 0,
            "matches": matches
        })

@app.route('/api/stats', methods=['GET'])
def system_stats():
    stats = get_stats()
    # Convert ObjectIDs to strings for JSON
    for alert in stats["recent_alerts"]:
        alert["_id"] = str(alert["_id"])
    return jsonify(stats)

@app.route('/api/assets', methods=['GET'])
def list_assets():
    assets = get_all_assets()
    return jsonify(assets)

@app.route('/api/assets/<filename>', methods=['DELETE'])
def remove_asset(filename):
    # Sanitize filename
    filename = secure_filename(filename)
    
    # Check if file exists in uploads
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if delete_asset(filename):
        # Remove physical file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"message": f"Asset {filename} removed successfully"}), 200
    
    return jsonify({"error": "Asset not found"}), 404

@app.route('/api/detections/<id>', methods=['DELETE'])
def remove_detection(id):
    if delete_detection(id):
        return jsonify({"message": "Detection record removed"}), 200
    return jsonify({"error": "Detection not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
