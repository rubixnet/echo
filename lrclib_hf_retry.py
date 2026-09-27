#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Retry: upload the .gz to a fresh, empty HF dataset repo, with full errors."""

REPO = "Rubixnet/lrclib-db-dump"                       # fresh empty repo
DRIVE_FILE = "/content/drive/MyDrive/lrclib/lrclib-db-dump-20260828T090200Z.sqlite3.gz"
DISABLE_XET = False  # set True if the Xet path misbehaves again

from google.colab import drive
drive.mount("/content/drive")

import os, json, traceback, urllib.request

HF_TOKEN = os.environ.get("HF_TOKEN") or input("HF_TOKEN: ").strip()

if DISABLE_XET:
    os.environ["HF_HUB_DISABLE_XET"] = "1"
from huggingface_hub import HfApi

api = HfApi(token=HF_TOKEN)
api.create_repo(REPO, repo_type="dataset", exist_ok=True)
name = os.path.basename(DRIVE_FILE)

try:
    api.upload_file(path_or_fileobj=DRIVE_FILE, path_in_repo=name,
                    repo_id=REPO, repo_type="dataset")
    print("UPLOAD RETURNED OK")
except Exception:
    print("!!! UPLOAD FAILED - full error below !!!")
    traceback.print_exc()

print("\n=== verification ===")
req = urllib.request.Request(f"https://huggingface.co/api/datasets/{REPO}/tree/main",
                             headers={"Authorization": f"Bearer {HF_TOKEN}"})
with urllib.request.urlopen(req, timeout=60) as r:
    for e in json.loads(r.read()):
        print(f"  {e['path']}  size={e.get('size')}")
print("Repo:", f"https://huggingface.co/datasets/{REPO}")