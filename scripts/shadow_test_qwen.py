import os
import json
import base64
import time
import urllib.request
import urllib.error

# 1. Parse .env file for credentials
def get_env_credentials():
    env_path = "/Users/kyzl/updated_remake/.env"
    if not os.path.exists(env_path):
        raise FileNotFoundError(f".env file not found at {env_path}")
    
    creds = {}
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if "=" in line:
                key, val = line.split("=", 1)
                creds[key.strip()] = val.strip().strip('"').strip("'")
    return creds

# 2. Convert user-silhouette image to base64
def get_test_image_base64():
    img_path = "/Users/kyzl/updated_remake/assets/images/user-silhouette.jpg"
    if not os.path.exists(img_path):
        # Fallback to an empty 1x1 JPEG pixel base64 if image is missing
        return "/9/g/"
    with open(img_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

# 3. Log in to Supabase to retrieve JWT
def get_supabase_jwt(supabase_url, anon_key, email, password):
    url = f"{supabase_url}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req) as res:
            resp_body = res.read().decode("utf-8")
            resp_json = json.loads(resp_body)
            return resp_json.get("access_token")
    except Exception as e:
        print(f"❌ SUPABASE LOGIN FAILED: {e}")
        if hasattr(e, 'read'):
            print("Response:", e.read().decode("utf-8"))
        return None

# 4. Invoke the live Supabase Edge Function directly
def call_analyze_makeup_edge_function(supabase_url, jwt_token, model_id, image_base64, prompt):
    url = f"{supabase_url}/functions/v1/analyze-makeup"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}",
    }
    
    payload = {
        "model": model_id,
        "imageBase64": image_base64,
        "prompt": prompt,
        "isJson": True,
        "maxTokens": 1500
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            elapsed = time.time() - start_time
            resp_body = res.read().decode("utf-8")
            resp_json = json.loads(resp_body)
            
            # The Supabase Edge function returns the OpenRouter completion directly
            content = resp_json["choices"][0]["message"]["content"]
            usage = resp_json.get("usage", {})
            return {
                "success": True,
                "elapsed": elapsed,
                "content": content,
                "usage": usage,
                "error": None
            }
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start_time
        err_body = e.read().decode("utf-8") if e else ""
        return {
            "success": False,
            "elapsed": elapsed,
            "content": None,
            "usage": {},
            "error": f"HTTP {e.code}: {e.reason}\nDetails: {err_body}"
        }
    except Exception as e:
        elapsed = time.time() - start_time
        return {
            "success": False,
            "elapsed": elapsed,
            "content": None,
            "usage": {},
            "error": str(e)
        }

def main():
    print("════════════════════════════════════════════════════════════════")
    print("REMAKE SHADOW TEST: UNIFIED FACE SCAN SPEED & ACCURACY EVALUATION")
    print("════════════════════════════════════════════════════════════════")
    
    try:
        creds = get_env_credentials()
        supabase_url = creds.get("EXPO_PUBLIC_SUPABASE_URL")
        anon_key = creds.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")
        email = creds.get("EXPO_PUBLIC_DEV_EMAIL")
        password = creds.get("EXPO_PUBLIC_DEV_PASSWORD")
        
        if not all([supabase_url, anon_key, email, password]):
            print("❌ ERROR: Missing required credentials in .env")
            print(f"Parsed keys: {list(creds.keys())}")
            return
    except Exception as e:
        print(f"❌ ERROR: Failed to read .env: {e}")
        return
        
    print("✓ Loaded Supabase & Onboarding Dev Credentials.")
    print("🔑 Authenticating against Supabase Auth API...")
    
    jwt_token = get_supabase_jwt(supabase_url, anon_key, email, password)
    if not jwt_token:
        print("❌ ERROR: Could not authenticate user. Please check email/password in .env.")
        return
    
    print("✓ Authenticated successfully! Obtained valid JWT user session.")
    
    image_base64 = get_test_image_base64()
    print(f"✓ Encoded test face image (base64 size: {len(image_base64) / 1024:.1f} KB).")
    
    # Construct unified task prompt
    prompt = """
You are an expert makeup artist AI and beauty analyst. You are analyzing a selfie for cosmetic quality, skin structure, and facial geometry.

Return a single JSON object that contains the complete analysis across three distinct domains.

<task_makeup_scoring>
Evaluate the cosmetic quality of the makeup in the selfie. Score each of the six categories (Blending, Symmetry, Colour Harmony, Coverage, Cleanliness, Brow Framing) from 0-100.
If the user is not wearing makeup in a category, set "detected" to false, score it 75, and explain in the reasoning/tip that it is bare skin.
</task_makeup_scoring>

<task_beauty_dna>
Analyze the physical facial structure:
- faceShape: Oval, Round, Heart, Square, Oblong
- colorSeason: Warm Autumn, Cool Summer, Deep Winter, Light Spring, etc.
- skinToneHex: Primary skin tone color hex
- eyeShape: Siren Eye, Doe Eye, Almond Eye, Hooded Eye, Monolid Eye, Dove Eye
- browShape: Soft Arch, High Arch, S-Curve, Flat, Tapered
- browSymmetryPct: 70-100 symmetry rating
- lashProfile: Long & Sparse, Short & Full, Long & Full, Curly
- archetype: Creative name for their style blueprint (e.g. "The Soft Romantic")
- archetypeDescription: 2-sentence description of why they fit this archetype.
</task_beauty_dna>

<task_coaching>
Draft a highly personalized, warm 1-2 sentence coaching compliment from a personal beauty editor. It must match their scores and physical traits perfectly.
</task_coaching>

CRITICAL: You must return ONLY a raw JSON object matching the schema below. No markdown wrapping, no text before or after the JSON.

JSON Schema:
{
  "makeup_analysis": {
    "overall_score": number or null,
    "verdict": "GO" or "FIX",
    "categories": [
      {
        "name": "Blending",
        "detected": boolean,
        "reasoning": "Detailed 2-sentence explanation of what is visible in the photo.",
        "score": number,
        "tip": "Constructive 1-sentence tip.",
        "tipShort": "Short action item."
      },
      {
        "name": "Symmetry",
        "detected": boolean,
        "reasoning": "...",
        "score": 50,
        "tip": "...",
        "tipShort": "..."
      },
      {
        "name": "Colour Harmony",
        "detected": boolean,
        "reasoning": "...",
        "score": 50,
        "tip": "...",
        "tipShort": "..."
      },
      {
        "name": "Coverage",
        "detected": boolean,
        "reasoning": "...",
        "score": 50,
        "tip": "...",
        "tipShort": "..."
      },
      {
        "name": "Cleanliness",
        "detected": boolean,
        "reasoning": "...",
        "score": 50,
        "tip": "...",
        "tipShort": "..."
      },
      {
        "name": "Brow Framing",
        "detected": boolean,
        "reasoning": "...",
        "score": 50,
        "tip": "...",
        "tipShort": "..."
      }
    ]
  },
  "beauty_dna": {
    "faceShape": "string",
    "colorSeason": "string",
    "skinToneHex": "string",
    "eyeShape": "string",
    "browShape": "string",
    "browSymmetryPct": number,
    "lashProfile": "string",
    "archetype": "string",
    "archetypeDescription": "string"
  },
  "coaching": {
    "compliment": "string"
  }
}
""".strip()

    models = [
        {"name": "Qwen 3 VL 8B (Lightweight)", "id": "qwen/qwen3-vl-8b-instruct"},
        {"name": "Qwen 2.5 VL 72B (Heavyweight)", "id": "qwen/qwen2.5-vl-72b-instruct"}
    ]
    
    results = {}
    
    for m in models:
        print(f"\n🚀 Invoking hosted Edge Function with model: {m['name']}...")
        print(f"   Model ID: {m['id']}")
        res = call_analyze_makeup_edge_function(supabase_url, jwt_token, m["id"], image_base64, prompt)
        results[m["id"]] = res
        
        if res["success"]:
            print(f"   ✅ SUCCESS in {res['elapsed']:.2f} seconds!")
            usage = res["usage"]
            print(f"   Tokens: {usage.get('prompt_tokens', 0)} in / {usage.get('completion_tokens', 0)} out")
            try:
                # Validate JSON shape
                parsed = json.loads(res["content"])
                print("   ✓ Parsed JSON successfully.")
                print(f"   Overall Score: {parsed.get('makeup_analysis', {}).get('overall_score')}")
                print(f"   Archetype: {parsed.get('beauty_dna', {}).get('archetype')}")
                print(f"   Compliment: \"{parsed.get('coaching', {}).get('compliment')}\"")
            except Exception as je:
                print("   ❌ JSON Validation Error:", je)
                print("   Raw Content:", res["content"])
        else:
            print(f"   ❌ FAILED in {res['elapsed']:.2f} seconds!")
            print(f"   Error: {res['error']}")
            
    print("\n" + "="*80)
    print("COMPARATIVE METRICS REPORT")
    print("="*80)
    for m in models:
        res = results[m["id"]]
        print(f"\n{m['name']}:")
        if res["success"]:
            print(f"  - Latency: {res['elapsed']:.2f} seconds")
            parsed = json.loads(res["content"])
            print(f"  - JSON Keys Check: {list(parsed.keys())}")
            print(f"  - Coaching Tip length: {len(parsed.get('coaching', {}).get('compliment', ''))} chars")
        else:
            print(f"  - Latency: {res['elapsed']:.2f} seconds")
            print(f"  - Status: Failed ({res['error'].splitlines()[0] if res['error'] else 'unknown'})")
    print("="*80)

if __name__ == "__main__":
    main()
