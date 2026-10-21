import http.server
import socketserver
import json
import asyncio
import os
import sys
import base64
from pathlib import Path
from api.tts_engine import VOICES, synthesize_speech

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PORT = int(os.environ.get("TTS_PORT", 8000))

class TTSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path in ("/api/voices", "/api/tts/voices"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(VOICES, ensure_ascii=False).encode("utf-8"))
            return

        if self.path in ("/", "/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "Dorpon TTS Gateway"}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        if self.path in ("/api/speak", "/api/tts/speak"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body)
                text = data.get("text", "").strip()
                voice = data.get("voice", "bn-BD-NabanitaNeural")
                rate = data.get("rate", "+0%")
                pitch = data.get("pitch", "+0Hz")
                natural_pauses = data.get("natural_pauses", True)
                format_type = data.get("format", "json")

                if not text:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Text cannot be empty"}).encode("utf-8"))
                    return

                audio_bytes, words = asyncio.run(
                    synthesize_speech(
                        text=text,
                        voice=voice,
                        rate=rate,
                        pitch=pitch,
                        natural_pauses=natural_pauses
                    )
                )

                if format_type == "audio":
                    self.send_response(200)
                    self.send_header("Content-Type", "audio/mpeg")
                    self.send_header("Content-Length", str(len(audio_bytes)))
                    self.end_headers()
                    self.wfile.write(audio_bytes)
                else:
                    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
                    resp_payload = {
                        "audio": f"data:audio/mp3;base64,{audio_b64}",
                        "words": words,
                        "word_count": len(words)
                    }
                    resp_bytes = json.dumps(resp_payload, ensure_ascii=False).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(resp_bytes)))
                    self.end_headers()
                    self.wfile.write(resp_bytes)

            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def main():
    with ThreadedTCPServer(("", PORT), TTSHandler) as httpd:
        print(f"Dorpon Multi-Threaded TTS Server running on port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    main()
