import subprocess, sys, os, time, psutil

for p in psutil.process_iter(['pid', 'cmdline']):
    try:
        cmdline = p.info.get('cmdline') or []
        if any('uvicorn' in str(c) for c in cmdline):
            p.kill()
            print(f"Killed uvicorn PID {p.info['pid']}")
    except:
        pass

time.sleep(1)
print("Starting fresh backend...")
proc = subprocess.Popen(
    [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'],
    cwd='D:/project/PERSONAL PROJECT FSD AND AI/AI-Interview-Simulator/backend',
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
print(f"Started uvicorn PID {proc.pid}")
time.sleep(2)
print("Testing...")
import urllib.request, json
try:
    r = urllib.request.urlopen('http://localhost:8000/health', timeout=3)
    print("Backend healthy:", r.read().decode())
except Exception as e:
    print("Backend error:", str(e)[:100])