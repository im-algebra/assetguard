from pymongo import MongoClient
import os
from datetime import datetime

# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "asset_protection_db"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
assets_collection = db["assets"]
detections_collection = db["detections"]

def save_asset(asset_data):
    """
    Saves asset metadata to MongoDB.
    asset_data example: {
        "filename": "sports_clip.mp4",
        "type": "video",
        "hashes": ["hash1", "hash2"],
        "upload_date": datetime.now(),
        "original_path": "/path/to/file"
    }
    """
    asset_data["created_at"] = datetime.now()
    result = assets_collection.insert_one(asset_data)
    return str(result.inserted_id)

def get_all_assets():
    """Returns all stored assets."""
    assets = list(assets_collection.find({}, {"_id": 0}))
    return assets

def delete_asset(filename):
    """Deletes an asset and its physical file."""
    asset = assets_collection.find_one({"filename": filename})
    if asset:
        # Delete from DB
        assets_collection.delete_one({"filename": filename})
        # Note: Physical file deletion is handled in the app route
        return True
    return False

def find_matching_assets(query_hashes, is_video=False, threshold=10):
    """
    Search database for similar assets.
    """
    from hasher import compare_hashes, compare_video_hashes
    
    matches = []
    stored_assets = list(assets_collection.find())
    
    for asset in stored_assets:
        if is_video and asset["type"] == "video":
            is_match, similarity = compare_video_hashes(query_hashes, asset["hashes"], threshold_pct=80.0)
            if is_match:
                asset["_id"] = str(asset["_id"])
                asset["similarity"] = similarity
                matches.append(asset)
        elif not is_video and asset["type"] == "image":
            q_hash = query_hashes[0] if isinstance(query_hashes, list) else query_hashes
            is_match, similarity = compare_hashes(q_hash, asset["hashes"][0], threshold_pct=80.0)
            if is_match:
                asset["_id"] = str(asset["_id"])
                asset["similarity"] = similarity
                matches.append(asset)
                
    return matches

from bson import ObjectId

def save_detection(detection_data):
    """Saves a single detection record."""
    detection_data["timestamp"] = datetime.now()
    detections_collection.insert_one(detection_data)

def delete_detection(detection_id):
    """Deletes a specific detection record by ID."""
    try:
        detections_collection.delete_one({"_id": ObjectId(detection_id)})
        return True
    except:
        return False

def get_stats():
    """Returns system-wide stats including platform distribution and risk levels."""
    total_assets = assets_collection.count_documents({})
    
    # Platform distribution aggregation
    pipeline = [
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
    ]
    platform_counts = list(detections_collection.aggregate(pipeline))
    platform_dist = {p["_id"]: p["count"] for p in platform_counts if p["_id"]}
    
    return {
        "total_assets": total_assets,
        "total_detections": detections_collection.count_documents({}),
        "high_risk_count": detections_collection.count_documents({"risk": "High"}),
        "platform_distribution": platform_dist,
        "recent_alerts": list(detections_collection.find().sort("timestamp", -1).limit(20))
    }
