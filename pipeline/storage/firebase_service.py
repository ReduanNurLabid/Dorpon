import os
import glob
from typing import List, Optional, Dict, Any
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from pipeline.models import CapsuleStory, DailyCapsule

_db: Optional[firestore.Client] = None

def get_firestore_client() -> firestore.Client:
    """Initializes and caches the Firestore client using the service account certificate."""
    global _db
    if _db is not None:
        return _db

    import json
    json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if json_str:
        try:
            cert_dict = json.loads(json_str)
            if not firebase_admin._apps:
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
            _db = firestore.client()
            return _db
        except Exception as err:
            print(f"[Firebase] Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {err}")

    # Look for certificate in project root or environment variable
    cert_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if not cert_path or not os.path.exists(cert_path):
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        # Match standard or downloaded key files
        candidates = glob.glob(os.path.join(root_dir, "*firebase-adminsdk*.json"))
        if not candidates:
            candidates = glob.glob(os.path.join(root_dir, "serviceAccountKey.json"))
        if candidates:
            cert_path = candidates[0]

    if not cert_path or not os.path.exists(cert_path):
        raise FileNotFoundError(
            "Firebase service account key JSON not found. Please place serviceAccountKey.json in the project root."
        )

    if not firebase_admin._apps:
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


def push_hourly_buzz_to_firestore(stories: List[Dict[str, Any]]) -> int:
    """
    Pushes hourly 60-second news cards into Firestore 'daily_buzz' collection.
    Uses story_id as document ID for clean deduplication / idempotency.
    """
    db = get_firestore_client()
    batch = db.batch()
    count = 0

    for story in stories:
        story_id = story.get("story_id")
        if not story_id:
            continue

        doc_ref = db.collection("daily_buzz").document(story_id)
        hourly_ref = db.collection("hourly_buzz").document(story_id)
        pub_at = story.get("published_at") or (story.get("daily_buzz", {}) or {}).get("published_at")
        payload = {
            "story_id": story_id,
            "primary_category": story.get("primary_category", "governance_law"),
            "interest_categories": story.get("interest_categories", []),
            "tags": story.get("tags", []),
            "image_url": story.get("image_url"),
            "sources": story.get("sources", []),
            "published_at": pub_at,
            "daily_buzz": story.get("daily_buzz", {}),
            "updated_at": firestore.SERVER_TIMESTAMP,
            "is_active": True
        }
        batch.set(doc_ref, payload, merge=True)
        batch.set(hourly_ref, payload, merge=True)
        count += 1

    batch.commit()
    return count


def stage_bcs_pro_draft_to_firestore(capsule: DailyCapsule) -> str:
    """
    Pushes the morning BCS Pro 7-section Civilsdaily capsule draft to 'bcs_pro_drafts'.
    Document ID is the edition date (YYYY-MM-DD).
    """
    db = get_firestore_client()
    doc_ref = db.collection("bcs_pro_drafts").document(capsule.edition_date)
    
    data = capsule.model_dump()
    data["staged_at"] = firestore.SERVER_TIMESTAMP
    
    doc_ref.set(data, merge=True)
    return capsule.edition_date


def publish_bcs_pro_edition(edition_date: str) -> bool:
    """
    Publishes an approved BCS Pro edition to 'bcs_pro_published' and updates 'latest'.
    """
    db = get_firestore_client()
    draft_ref = db.collection("bcs_pro_drafts").document(edition_date)
    draft_snap = draft_ref.get()

    if not draft_snap.exists:
        return False

    edition_data = draft_snap.to_dict()
    edition_data["status"] = "PUBLISHED"
    edition_data["published_at"] = firestore.SERVER_TIMESTAMP

    # Write to dated archive
    db.collection("bcs_pro_published").document(edition_date).set(edition_data)
    # Write to 'latest' pointer for fast 1-query client access
    db.collection("bcs_pro_published").document("latest").set(edition_data)

    # Update draft status
    draft_ref.update({
        "status": "PUBLISHED",
        "published_at": firestore.SERVER_TIMESTAMP
    })

    return True
