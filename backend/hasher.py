import cv2
import imagehash
from PIL import Image
import os
import numpy as np

def generate_image_hash(image_path):
    """Generates a pHash for an image."""
    try:
        img = Image.open(image_path)
        hash_val = imagehash.phash(img)
        return str(hash_val)
    except Exception as e:
        print(f"Error generating image hash: {e}")
        return None

def generate_video_hash(video_path, frame_count=5):
    """
    Generates hashes for a video by sampling multiple frames.
    Returns a list of hashes (as strings).
    """
    hashes = []
    try:
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if total_frames <= 0:
            return None

        # Sample frames at regular intervals
        intervals = np.linspace(0, total_frames - 1, frame_count, dtype=int)
        
        for frame_idx in intervals:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(frame_rgb)
                hash_val = imagehash.phash(img)
                hashes.append(str(hash_val))
        
        cap.release()
        return hashes
    except Exception as e:
        print(f"Error generating video hash: {e}")
        return None

def calculate_similarity_percentage(hash1, hash2):
    """
    Calculates the similarity percentage between two pHashes.
    Based on Hamming distance (64 bits).
    """
    try:
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        distance = h1 - h2
        # pHash is 8x8 = 64 bits
        similarity = (1 - (distance / 64.0)) * 100
        return round(similarity, 2)
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0.0

def compare_hashes(hash1, hash2, threshold_pct=80.0):
    """
    Compares two hashes and returns a flag if similarity is above threshold.
    """
    similarity = calculate_similarity_percentage(hash1, hash2)
    is_match = similarity >= threshold_pct
    return is_match, similarity

def compare_video_hashes(hashes1, hashes2, threshold_pct=80.0):
    """
    Compares two lists of video hashes.
    Returns the average similarity and a flag if above threshold.
    """
    if not hashes1 or not hashes2:
        return False, 0.0
    
    total_similarity = 0
    # Compare corresponding frames or best-fit matches
    # For simplicity, we compare frame-by-frame
    count = min(len(hashes1), len(hashes2))
    
    for i in range(count):
        total_similarity += calculate_similarity_percentage(hashes1[i], hashes2[i])
    
    avg_similarity = total_similarity / count
    is_match = avg_similarity >= threshold_pct
    
    return is_match, round(avg_similarity, 2)
