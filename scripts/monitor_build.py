import sys
import time
import json
import subprocess

build_id = "3d1f1856-fbe0-4871-becf-b5cb36e5901d"

print(f"Tracking EAS Build {build_id}...", flush=True)

while True:
    try:
        # Run eas build:view with JSON flag
        res = subprocess.run(
            ["eas", "build:view", build_id, "--json"],
            capture_output=True,
            text=True,
            cwd="/Users/kyzl/updated_remake"
        )
        
        # If the command failed, print stderr and sleep
        if res.returncode != 0:
            print(f"Error checking status: {res.stderr.strip()}", flush=True)
            time.sleep(30)
            continue
            
        # Parse output JSON
        data = json.loads(res.stdout.strip())
        status = data.get("status", "UNKNOWN")
        
        print(f"Current Status: {status}", flush=True)
        
        if status == "FINISHED":
            print("SUCCESS: EAS Build 9 has finished successfully!", flush=True)
            sys.exit(0)
        elif status in ["ERRORED", "FAILED", "CANCELLED"]:
            print(f"FAILURE: EAS Build 9 failed with status: {status}", flush=True)
            sys.exit(1)
            
    except Exception as e:
        print(f"Monitoring exception: {e}", flush=True)
        
    time.sleep(30)
