#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert the lrclib SQLite dump into .parquet files and upload to HF.

Run in a Colab notebook cell. Resumable: converts one table at a time and
uploads each .parquet immediately, so if the session dies you just re-run and
it skips what's already on HF.

Reading is done straight from the Drive mount (the decompressed DB is too big
for Colab's disk), so this is slow - expect roughly an hour per 30-60 GB.
Set TABLES to a short list (e.g. ["songs", "lyrics"]) if you only need a few.
"""

# ---------------------------------------------------------------------------
HF_TOKEN = None  # resolved from the environment after imports
REPO = "Rubixnet/lrclib-parquet"                       # where .parquet goes
DRIVE_FILE = "/content/drive/MyDrive/lrclib/lrclib-db-dump-20260828T090200Z.sqlite3.gz"
TABLES = None        # None = all tables; e.g. ["songs", "lyrics"] for a subset
BATCH = 100_000      # rows per write batch (lower if you see OOM)
COMPRESSION = "zstd" # parquet compression

# ---------------------------------------------------------------------------
from google.colab import drive
drive.mount("/content/drive")

import os, io, sqlite3, gzip, shutil, json, urllib.request
import pyarrow as pa
import pyarrow.parquet as pq
from huggingface_hub import HfApi

HF_TOKEN = os.environ.get("HF_TOKEN") or input("HF_TOKEN: ").strip()

api = HfApi(token=HF_TOKEN)
api.create_repo(REPO, repo_type="dataset", exist_ok=True)

def hf_files():
    req = urllib.request.Request(f"https://huggingface.co/api/datasets/{REPO}/tree/main",
                                 headers={"Authorization": f"Bearer {HF_TOKEN}"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return {e["path"] for e in json.loads(r.read())}
    except Exception:
        return set()

def arrow_type(t):
    t = (t or "TEXT").upper()
    if "INT" in t:    return pa.int64()
    if "REAL" in t or "FLOAT" in t or "DOUBLE" in t or "NUM" in t or "DEC" in t:
        return pa.float64()
    if "BLOB" in t:   return pa.binary()
    return pa.string()

# --- decompress to Drive-adjacent temp only if it fits, else read from mount
src = DRIVE_FILE
free = shutil.disk_usage("/content").free
print(f"free disk {free/2**30:.0f} GiB")

print("Opening SQLite (from Drive mount) ...")
db = sqlite3.connect(f"file:{src}?mode=ro", uri=True)
db.text_factory = bytes            # BLOB-safe; we decode TEXT below
cur = db.cursor()

tables = [r[0].decode() for r in cur.execute(
    "SELECT name FROM sqlite_master WHERE type='table' "
    "AND name NOT LIKE 'sqlite_%' ORDER BY name")]
if TABLES:
    tables = [t for t in tables if t in TABLES]
print("Tables to convert:", tables)

already = hf_files()
for table in tables:
    fname = f"{table}.parquet"
    if fname in already:
        print(f"== {table}: already on HF, skipping")
        continue
    cols = [(r[1].decode(), arrow_type(r[2].decode() if isinstance(r[2], bytes) else r[2]))
            for r in cur.execute(f'PRAGMA table_info("{table}")')]
    schema = pa.schema(cols)
    count = db.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
    print(f"== {table}: {count:,} rows x {len(cols)} cols")

    local = f"/content/{fname}"
    cur.execute(f'SELECT * FROM "{table}"')
    n = 0
    with pq.ParquetWriter(local, schema, compression=COMPRESSION) as w:
        while True:
            rows = cur.fetchmany(BATCH)
            if not rows:
                break
            arrays = []
            for i, (_, typ) in enumerate(cols):
                vals = [r[i] for r in rows]
                if typ == pa.string():
                    vals = [None if v is None else v.decode("utf-8", "replace") for v in vals]
                elif typ == pa.int64():
                    vals = [None if v is None else int(v) for v in vals]
                elif typ == pa.float64():
                    vals = [None if v is None else float(v) for v in vals]
                arrays.append(pa.array(vals, type=typ))
            w.write_table(pa.Table.from_arrays(arrays, schema=schema))
            n += len(rows)
            print(f"   {n:,} rows ...", end="\r", flush=True)
    print(f"\n   uploading {fname} ...")
    api.upload_file(path_or_fileobj=local, path_in_repo=fname,
                    repo_id=REPO, repo_type="dataset")
    os.remove(local)
    print(f"   {fname} uploaded")

print("\nDone. Queryable at https://huggingface.co/datasets/" + REPO)