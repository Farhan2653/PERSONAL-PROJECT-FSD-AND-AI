import urllib.request, json

payload = json.dumps({
    "transcript": "Yes I would say that um in my previous role I worked on a system design project where we had to build a URL shortener. The key challenges were handling high traffic volume and ensuring low latency. I basically just focused on using a hash map for O one lookups and like a distributed caching layer with Redis. You know we also had to consider edge cases like duplicate URLs and custom alias collisions.",
    "company": "google",
    "duration_seconds": 120,
})

req = urllib.request.Request(
    "http://localhost:8000/api/analyze/full",
    data=payload.encode(),
    headers={"Content-Type": "application/json"},
)
try:
    r = urllib.request.urlopen(req)
    result = json.loads(r.read())
    print("=== AI ANALYSIS RESULTS ===")
    print()
    print("SCORES:")
    for k, v in result.get("scores", {}).items():
        print(f"  {k}: {v}")
    print()
    print("Hiring Probability:", result.get("hiringProbability"), "%")
    print("Recommendation:", result.get("recommendation"))
    print()
    print("VOICE ANALYSIS:")
    va = result.get("voiceAnalysis", {})
    for k, v in va.items():
        if k != "has_errors":
            print(f"  {k}: {v}")
    print()
    print("FACE ANALYSIS:")
    fa = result.get("faceAnalysis", {})
    print("  Face Detected:", fa.get("face_detected"))
    print("  Eye Contact Score:", round(fa.get("eye_contact_score", 0), 3))
    print("  Confidence Score:", round(fa.get("confidence_score", 0), 3))
except Exception as e:
    print("Error:", str(e)[:500])