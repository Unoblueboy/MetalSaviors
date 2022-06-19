import sys
import json

if len(sys.argv) != 4:
    raise Exception(f"Two arguments expected but {len(sys.argv)} given: {sys.argv}")

branch_type = sys.argv[1]
html = sys.argv[2]
tag = sys.argv[3]
system_manifest = {}

with open('system.json', 'r') as file:
    system_manifest = json.load(file)

if branch_type == "feature":
    download_html = html.replace("releases/tag/", "releases/download/")
    system_manifest["download"] = f"{download_html}/release.zip"

system_manifest["version"] = tag[1:]

with open("updated_system.json", "w") as outfile:
    outfile.write(json.dumps(system_manifest, indent = 4))