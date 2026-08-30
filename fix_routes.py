import os
import re

app_dir = "/Users/kyzl/updated_remake/app"

def fix_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace /(onboarding)/ and /(main)/ with /
    new_content = re.sub(r'/\((onboarding|main)\)/', '/', content)
    # Replace /(onboarding) and /(main) with /
    new_content = re.sub(r'/\((onboarding|main)\)', '/', new_content)
    
    if content != new_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fixed routes in: {file_path}")

def main():
    print("Scanning app routes for parenthetical route group anti-patterns...")
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                fix_file(os.path.join(root, file))
    print("Route cleanup complete!")

if __name__ == "__main__":
    main()
