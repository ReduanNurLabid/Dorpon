import os
import math
import wave
import struct
import asyncio
from typing import List, Optional
import edge_tts
from pipeline.models import DailyCapsule, CapsuleStory

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "output", "audio")
STINGER_FILE = os.path.join(AUDIO_DIR, "transition_chime.wav")

def ensure_audio_dir():
    os.makedirs(AUDIO_DIR, exist_ok=True)

def generate_transition_chime(output_path: str = STINGER_FILE, sample_rate: int = 44100):
    """
    Generates a gentle, premium two-note acoustic chime (A4 - 440Hz -> E5 - 659.25Hz)
    with smooth exponential fadeout for clean story transitions.
    """
    if os.path.exists(output_path):
        return output_path

    ensure_audio_dir()
    duration = 1.2  # 1.2 seconds total
    num_samples = int(duration * sample_rate)
    
    with wave.open(output_path, "w") as wav:
        wav.setnchannels(1)  # Mono
        wav.setsampwidth(2)  # 16-bit
        wav.setframerate(sample_rate)

        for i in range(num_samples):
            t = float(i) / sample_rate
            # First note A4 (0 to 0.4s), second note E5 (0.35s to 1.2s with harmonic chime)
            sample = 0.0
            if t < 0.5:
                env = math.exp(-6.0 * t)
                sample += 0.45 * math.sin(2.0 * math.pi * 440.0 * t) * env
                sample += 0.15 * math.sin(2.0 * math.pi * 880.0 * t) * env
            if t >= 0.35:
                t2 = t - 0.35
                env2 = math.exp(-4.5 * t2)
                sample += 0.50 * math.sin(2.0 * math.pi * 659.25 * t2) * env2
                sample += 0.18 * math.sin(2.0 * math.pi * 1318.5 * t2) * env2

            # Clamp and pack 16-bit PCM
            int_sample = int(max(min(sample, 0.95), -0.95) * 32767.0)
            wav.writeframes(struct.pack("<h", int_sample))

    return output_path

async def generate_story_audio_clip(
    story: CapsuleStory,
    index: int,
    lang: str = "en",
    voice: Optional[str] = None
) -> str:
    """
    Generates an individual audio file for a news item using Microsoft Neural Edge TTS.
    Uses 'en-US-ChristopherNeural' for authoritative English podcast delivery,
    and 'bn-BD-NabanitaNeural' for natural standard Bangladeshi Bengali narration.
    """
    ensure_audio_dir()
    
    if voice is None:
        voice = "bn-BD-NabanitaNeural" if lang == "bn" else "en-US-ChristopherNeural"

    buzz = story.dailyBuzz
    if lang == "bn":
        title = buzz.titleBn if buzz.titleBn else buzz.titleEn
        takeaway = buzz.whyItMattersBn if buzz.whyItMattersBn else buzz.summaryBn
        summary = buzz.summaryBn
    else:
        title = buzz.titleEn if buzz.titleEn else buzz.titleBn
        takeaway = buzz.whyItMattersEn if buzz.whyItMattersEn else buzz.summaryEn
        summary = buzz.summaryEn

    # Build clean broadcast speech script
    speech_text = f"{title}. Key takeaway: {takeaway}. Context: {summary}"

    output_filename = f"story_{index + 1}_{lang}_{story.storyId}.mp3"
    output_path = os.path.join(AUDIO_DIR, output_filename)

    communicate = edge_tts.Communicate(speech_text, voice, rate="+2%")
    await communicate.save(output_path)
    return output_path

async def generate_full_briefing_audio(capsule: DailyCapsule, lang: str = "en") -> List[dict]:
    """
    Generates per-story audio clips and injects transition stingers between stories.
    Returns metadata list containing story ID, audio path, and stinger marker.
    """
    ensure_audio_dir()
    stinger_path = generate_transition_chime()

    playlist = []
    for i, story in enumerate(capsule.stories[:6]):
        print(f"Generating neural TTS for Story #{i+1}: {story.dailyBuzz.titleEn[:40]}...")
        audio_file = await generate_story_audio_clip(story, i, lang=lang)
        
        playlist.append({
            "type": "story",
            "story_id": story.storyId,
            "title": story.dailyBuzz.titleEn,
            "audio_path": audio_file,
            "audio_url": f"/api/audio/{os.path.basename(audio_file)}",
            "index": i,
        })

        # Add transition tone if not the last story
        if i < len(capsule.stories[:6]) - 1:
            playlist.append({
                "type": "transition_stinger",
                "audio_path": stinger_path,
                "audio_url": f"/api/audio/{os.path.basename(stinger_path)}",
                "duration_seconds": 1.2,
            })

    print(f"Audio briefing generated with {len(playlist)} segments including smooth transition stingers.")
    return playlist

if __name__ == "__main__":
    generate_transition_chime()
    print("Transition chime generated at data/output/audio/transition_chime.wav")
