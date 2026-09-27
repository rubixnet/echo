#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download the lrclib dump into your Google Drive, running entirely on Colab.

HOW TO USE
----------
1. Open a Colab notebook (colab.research.google.com), free CPU is fine.
2. Paste the entire contents of this file into a cell.
3. Run the cell. A Google sign-in popup appears -> approve it.
4. Keep the browser tab open until it prints "done". It will take ~15-30 min.

WHAT IT DOES
------------
* Streams the file from lrclib.net over Colab's fast connection and uploads it
  DIRECTLY to Google Drive (resumable protocol) - it never touches Colab's
  ephemeral disk, and RAM stays bounded (~64 MB).
* Creates a folder "lrclib/" in My Drive if needed.
* If the file is already there at the correct size, it just exits.
* If the runtime dies mid-way, re-run the cell - it restarts the transfer.
  (For a fully-resumable variant, use the RESUMABLE=True option below.)

Afterwards, the file lives at:
    My Drive/lrclib/lrclib-db-dump-20260828T090200Z.sqlite3.gz
You can then upload it to Hugging Face however you like (HF web UI, hf CLI,
or a `HfApi.upload_file` call - a ready-to-use snippet is at the bottom).
"""

import io
import time
import requests
from google.colab import auth

# ---------------------------------------------------------------------------
#  CONFIG  (edit if you like)
# ---------------------------------------------------------------------------
URL = "https://db-dumps.lrclib.net/lrclib-db-dump-20260828T090200Z.sqlite3.gz"
FILENAME = URL.rstrip("/").split("/")[-1]
DRIVE_FOLDER = "lrclib"          # folder under My Drive
CHUNK_SIZE = 64 * 1024 * 1024    # upload buffer, bytes (RAM)
RESUMABLE = True                 # False = simpler, but restarts on any error

# ---------------------------------------------------------------------------
#  Auth + Drive API
# ---------------------------------------------------------------------------
print("Authenticating with Google ...")
auth.authenticate_user()
from google.auth import default
creds, _ = default()
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

creds.refresh(Request())
service = build("drive", "v3", credentials=creds)


def find_or_create_folder(name):
    q = (f"name='{name}' and mimeType='application/vnd.google-apps.folder' "
         f"and trashed=false")
    res = service.files().list(q=q, fields="files(id,name)", pageSize=10).execute()
    for f in res.get("files", []):
        return f["id"]
    body = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
    return service.files().create(body=body, fields="id").execute()["id"]


def existing_file_size():
    q = (f"name='{FILENAME}' and '{folder_id}' in parents and trashed=false")
    res = service.files().list(q=q, fields="files(id,size)").execute()
    for f in res.get("files", []):
        return f["id"], int(f["size"])
    return None, 0


# ---------------------------------------------------------------------------
#  Stream source: lrclib over HTTP Range (supports seek for retries/resume)
# ---------------------------------------------------------------------------
class LrclibStream(io.RawIOBase):
    """A seekable file-like object backed by ranged HTTP GETs to lrclib.net."""

    def __init__(self, url, size):
        self.url = url
        self.size = size
        self.pos = 0
        self._conn = None

    def readable(self):
        return True

    def seekable(self):
        return True

    def seek(self, offset, whence=0):
        if whence == 1:
            offset = self.pos + offset
        elif whence == 2:
            offset = self.size + offset
        self.pos = max(0, min(offset, self.size))
        self._conn = None
        return self.pos

    def tell(self):
        return self.pos

    def _open(self):
        """Open a streaming connection, retrying lrclib's flaky Range nodes.

        Some lrclib nodes ignore the Range header and reply HTTP 200 (the whole
        file). That is only usable at offset 0, so at offset>0 we retry on fresh
        connections until a node honors the range (206).
        """
        last_status = None
        for attempt in range(6):
            self._conn = requests.get(
                self.url,
                headers={"Range": f"bytes={self.pos}-"},
                stream=True,
                timeout=(30, 120),
            )
            st = self._conn.status_code
            if st == 206:
                return
            if st == 200 and self.pos == 0:
                # server sent the whole file; bytes start at 0, that's fine
                total = self._conn.headers.get("Content-Length")
                if total is not None and int(total) != self.size:
                    raise RuntimeError(
                        f"source Content-Length {total} != expected {self.size}")
                return
            last_status = st
            self._conn.close()
            time.sleep(2 * (attempt + 1))
        raise RuntimeError(
            f"lrclib.net won't serve a byte range at offset {self.pos} "
            f"(last HTTP {last_status}). Re-run the cell to start over."
        )

    def read(self, n=-1):
        if n is None or n < 0:
            n = self.size - self.pos
        if self._conn is None:
            self._open()
        try:
            data = self._conn.raw.read(n)
        except Exception:
            self._conn = None
            self._open()
            data = self._conn.raw.read(n)
        self.pos += len(data)
        return data


# ---------------------------------------------------------------------------
#  Main
# ---------------------------------------------------------------------------
# total size (from the server)
head = requests.head(URL, timeout=30)
TOTAL = int(head.headers.get("Content-Length"))
print(f"Source size: {TOTAL:,} bytes ({TOTAL/2**30:.2f} GiB)")

folder_id = find_or_create_folder(DRIVE_FOLDER)
fid, fsize = existing_file_size()
if fsize == TOTAL:
    print(f"Already on Drive at the correct size. Nothing to do.")
elif fsize > 0:
    print(f"Found a partial/incomplete copy ({fsize:,} bytes); starting fresh.")
    service.files().delete(fileId=fid).execute()
    folder_id = find_or_create_folder(DRIVE_FOLDER)

if fsize != TOTAL:
    print(f"Uploading to Drive folder '{DRIVE_FOLDER}/' ...")
    stream = LrclibStream(URL, TOTAL)
    meta = {"name": FILENAME, "parents": [folder_id]}
    media = MediaIoBaseUpload(
        stream,
        mimetype="application/gzip",
        resumable=RESUMABLE,
        chunksize=CHUNK_SIZE,
    )
    req = service.files().create(body=meta, media_body=media, fields="id,size")

    t0 = time.time()
    last = 0
    resp = None
    if RESUMABLE:
        while resp is None:
            status, resp = req.next_chunk()
            if status and status.resumable_progress != last:
                last = status.resumable_progress
                spd = last / max(time.time() - t0, 0.001) / 2 ** 20
                eta = (TOTAL - last) / max(spd, 0.01) / 60
                print(
                    f"  {last/2**30:6.2f} / {TOTAL/2**30:.2f} GiB "
                    f"({100*last/TOTAL:5.1f}%)  {spd:6.1f} MiB/s  ETA {eta:.0f} min",
                    flush=True,
                )
    else:
        resp = req.execute()

    fid = resp["id"]
    final = service.files().get(fileId=fid, fields="size").execute()
    got = int(final["size"])
    print(f"\nUploaded: {got:,} bytes (expected {TOTAL:,})")
    if got != TOTAL:
        raise RuntimeError(f"Size mismatch: {got} != {TOTAL}")
    print("DONE ✔  File is at: My Drive/" + DRIVE_FOLDER + "/" + FILENAME)

# ---------------------------------------------------------------------------
# OPTIONAL: upload the Drive file to Hugging Face.
# Enable this and re-run after you've set your HF token.
# ---------------------------------------------------------------------------
# if False:
#     HF_TOKEN = "hf_..."                       # your write token
#     REPO = "Rubixnet/lrclib-db-dumps"         # dataset repo name
#
#     from google.colab import drive
#     drive.mount("/content/drive")             # one-click Drive mount
#     local = f"/content/drive/MyDrive/{DRIVE_FOLDER}/{FILENAME}"
#
#     !pip install -q -U huggingface_hub
#     from huggingface_hub import HfApi
#     api = HfApi(token=HF_TOKEN)
#     api.create_repo(REPO, repo_type="dataset", exist_ok=True)
#     api.upload_file(path_or_fileobj=local, path_in_repo=FILENAME,
#                     repo_id=REPO, repo_type="dataset")
#     print("Uploaded to", f"https://huggingface.co/datasets/{REPO}")