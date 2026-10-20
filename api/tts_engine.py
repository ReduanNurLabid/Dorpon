import re
import io
import asyncio
import edge_tts
from typing import Tuple, List, Dict, Any

VOICES = [
    # Bengali Voices (Bangladeshi & Indian Neural)
    {
        "id": "bn-BD-NabanitaNeural",
        "name": "Nabanita (নবনীত)",
        "gender": "Female",
        "region": "Bangladesh 🇧🇩",
        "language": "Bengali (বাংলা)",
        "tag": "Warm & Melodic",
        "recommended": True
    },
    {
        "id": "bn-BD-PradeepNeural",
        "name": "Pradeep (প্রদীপ)",
        "gender": "Male",
        "region": "Bangladesh 🇧🇩",
        "language": "Bengali (বাংলা)",
        "tag": "Natural & Narrative",
        "recommended": True
    },
    {
        "id": "bn-IN-TanishaaNeural",
        "name": "Tanishaa (তানিশা)",
        "gender": "Female",
        "region": "India 🇮🇳",
        "language": "Bengali (বাংলা)",
        "tag": "Sweet & Clear",
        "recommended": False
    },
    {
        "id": "bn-IN-BashkarNeural",
        "name": "Bashkar (ভাস্কর)",
        "gender": "Male",
        "region": "India 🇮🇳",
        "language": "Bengali (বাংলা)",
        "tag": "Deep & Articulate",
        "recommended": False
    },
    # English Voices (US Neural)
    {
        "id": "en-US-EmmaNeural",
        "name": "Emma",
        "gender": "Female",
        "region": "US 🇺🇸",
        "language": "English",
        "tag": "Gentle & Reflective",
        "recommended": True
    },
    {
        "id": "en-US-AndrewNeural",
        "name": "Andrew",
        "gender": "Male",
        "region": "US 🇺🇸",
        "language": "English",
        "tag": "Warm & Conversational",
        "recommended": True
    },
    {
        "id": "en-US-AvaNeural",
        "name": "Ava",
        "gender": "Female",
        "region": "US 🇺🇸",
        "language": "English",
        "tag": "Melodic & Expressive",
        "recommended": True
    },
    {
        "id": "en-US-BrianNeural",
        "name": "Brian",
        "gender": "Male",
        "region": "US 🇺🇸",
        "language": "English",
        "tag": "Deep & Authoritative",
        "recommended": False
    }
]

def clean_and_inject_pauses(text: str) -> str:
    # 1. Strip any HTML/XML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # 2. Clean markdown links & URLs
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"https?://\S+", "", text)

    # 3. Bengali vs English Pacing
    is_bengali = bool(re.search(r"[\u0980-\u09FF]", text))
    if is_bengali:
        text = text.replace(";", ", ")
        text = re.sub(r"।\s*", "। ... ", text)
        bn_transitions = ["তবে", "কিন্তু", "অবশ্যই", "সুতরাং", "অবশেষে", "কারণ", "যেমন"]
        for tr in bn_transitions:
            text = re.sub(rf"(^|[।!?\n]\s*)({tr})", r"\1\2, ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    # English Natural Human Breath Pacing
    text = text.replace(";", ", ")
    text = re.sub(r"\s*\(([^)]+)\)\s*", r" — \1 — ", text)
    text = re.sub(r"^(\s*)(\d+)\.\s+([^:\n]+):", r"\1Point \2: \3... ", text, flags=re.MULTILINE)
    text = re.sub(r"\b(Point \d+:[^.]+?\.)\s*", r"\1... ", text)

    transitions = [
        "First", "Second", "Third", "Finally", "During", "When", "There are",
        "Apparently", "However", "On the other hand", "In fact", "Actually",
        "For example", "For instance", "Notice that", "Keep in mind"
    ]
    for tr in transitions:
        text = re.sub(rf"(^|[.!?\n]\s*)({tr}),?\s+([A-Za-z])", rf"\1\2, \3", text, flags=re.IGNORECASE)

    text = re.sub(r",?\s*(but|although|whereas|however)\s+", r", \1 ", text, flags=re.IGNORECASE)
    text = re.sub(r",?\s*(because|so that)\s+", r", \1 ", text, flags=re.IGNORECASE)

    words = text.split(" ")
    refined_words = []
    run_length = 0
    for w in words:
        clean_w = re.sub(r"[^A-Za-z]", "", w)
        if len(clean_w) >= 10 and run_length >= 6 and refined_words and not refined_words[-1].endswith((",", ".", "!", "?", "—", "...")):
            refined_words.append(f"... {w}")
            run_length = 0
        else:
            refined_words.append(w)
            if any(w.endswith(p) for p in [".", ",", "!", "?", "..."]):
                run_length = 0
            else:
                run_length += 1

    text = " ".join(refined_words)
    text = re.sub(r"[*`#~|]", " ", text)
    text = re.sub(r",\s*,+", ", ", text)
    text = re.sub(r"\.{4,}", "... ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

async def synthesize_speech(
    text: str,
    voice: str,
    rate: str = "+0%",
    pitch: str = "+0Hz",
    natural_pauses: bool = True
) -> Tuple[bytes, List[Dict[str, Any]]]:
    processed_text = clean_and_inject_pauses(text) if natural_pauses else text.strip()
    communicate = edge_tts.Communicate(processed_text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")

    mp3_buffer = io.BytesIO()
    word_boundaries = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            mp3_buffer.write(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            start_s = chunk["offset"] / 10_000_000.0
            dur_s = chunk["duration"] / 10_000_000.0
            word_boundaries.append({
                "text": chunk["text"],
                "start": round(start_s, 3),
                "end": round(start_s + dur_s, 3)
            })

    return mp3_buffer.getvalue(), word_boundaries
