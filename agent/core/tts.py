import subprocess
import threading
import os
import time

def play_tts_audio(text: str):
    """Generates and plays TTS audio in a background thread."""
    def run_tts():
        try:
            # Suppress pygame hello message
            os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = 'hide'
            
            # Generate the audio file using edge-tts
            output_file = "response_audio.mp3"
            # Using a high-quality neural voice
            subprocess.run([
                "python", "-m", "edge_tts",
                "--voice", "en-US-SteffanNeural",
                "--text", text,
                "--write-media", output_file
            ], check=True, capture_output=True)

            # Play the audio using pygame
            import pygame
            pygame.mixer.init()
            pygame.mixer.music.load(output_file)
            pygame.mixer.music.play()
            
            # Wait for playback to finish before cleaning up
            while pygame.mixer.music.get_busy():
                pygame.time.Clock().tick(10)
                
            pygame.mixer.quit()
            
            # Clean up the file
            if os.path.exists(output_file):
                try:
                    os.remove(output_file)
                except Exception:
                    pass
        except Exception as e:
            print(f"TTS Error: {e}")

    thread = threading.Thread(target=run_tts)
    thread.daemon = True
    thread.start()
