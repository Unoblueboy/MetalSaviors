import sys
import json

if len(sys.argv) != 2:
    raise Exception(f"Two arguments expected but {len(sys.argv)} given: {sys.argv}")

html = sys.argv[1]
system_manifest = {}

with open('system.json', 'r') as file:
     system_manifest = json.load(file)

download_html = html.replace("releases/", "releases/download/")
system_manifest["download"] = f"{download_html}/release.zip"

with open("updated_system.json", "w") as outfile:
    outfile.write(json.dumps(system_manifest, indent = 4))