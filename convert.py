import sys
import subprocess
import imageio_ffmpeg

def compress_to_webm(input_file, output_file):
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    
    # Compress into a highly optimized webm video
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", input_file,
        "-c:v", "libvpx-vp9",
        "-crf", "40",            # High compression
        "-b:v", "0",             # Required for CRF in VP9
        "-preset", "veryfast",
        "-an",                   # No audio
        "-vf", "scale=1280:-1",  # Resize to save space
        output_file
    ]
    subprocess.run(cmd, check=True)

if __name__ == "__main__":
    compress_to_webm("apps/desktop/public/258439.mp4", "apps/desktop/public/bg-compressed.webm")
    print("Successfully compressed 258439.mp4 to lightweight bg-compressed.webm")
