#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload the lrclib dump from Google Drive to Hugging Face.

Run in a Colab notebook cell (keeps using Colab's bandwidth + your Drive).
Approve the Drive mount popup, then let it run.

Two modes (change MODE below):
  MODE = "gz"       -> upload the .sqlite3.gz as-is (recommended; the file is
                       already gzip-compressed - this is the exact artifact
                       lrclib distributes).
  MODE = "parquet"  -> decompress the SQLite DB and convert every table to
                       .parquet files (best for HF streaming/Arrow).
                       NOTE: the uncompressed DB is likely ~150-300 GB.
                       The script auto-detects free disk: if it fits it works
                       locally (fast); otherwise it reads the DB straight from
                       the Drive mount (works, but slow).
"""

# ---------------------------------------------------------------------------
#  CONFIG
# ---------------------------------------------------------------------------
HF_TOKEN = None  # resolved from the environment after imports
REPO = "Rubixnet/lrclib-db-dumps"                       # dataset repo id
MODE = "gz"                                             # "gz" or "parquet"
DRIVE_FILE = "/content/drive/MyDrive/lrclib/lrclib-db-dump-20260828T090200Z.sqlite3.gz"
SKIP_TABLES = []                                        # e.g. ["lyrics"]
BATCH = 200_000                                         # parquet rows per write
COMPRESSION = "zstd"                                    # parquet compression

# ---------------------------------------------------------------------------
#  Drive mount
# ---------------------------------------------------------------------------
from google.colab import drive
drive.mount("/content/drive")
import os, shutil, sqlite3, subprocess
import pyarrow as pa
import pyarrow.parquet as pq
from huggingface_hub import HfApi

HF_TOKEN = os.environ.get("HF_TOKEN") or input("HF_TOKEN: ").strip()

api = HfApi(token=HF_TOKEN)
api.create_repo(REPO, repo_type="dataset", exist_ok=True)

assert os.path.exists(DRIVE_FILE), f"not found: {DRIVE_FILE}"
TOTAL = os.path.getsize(DRIVE_FILE)
print(f"Source: {DRIVE_FILE}  ({TOTAL:,} bytes / {TOTAL/2**30:.2f} GiB)")

# ---------------------------------------------------------------------------
#  MODE = "gz": upload the compressed dump directly
# ---------------------------------------------------------------------------
if MODE == "gz":
    name = os.path.basename(DRIVE_FILE)
    print("Uploading (this streams ~46 GB; it will take a while) ...")
    api.upload_file(path_or_fileobj=DRIVE_FILE, path_in_repo=name,
                    repo_id=REPO, repo_type="dataset")
    print(f"Uploaded: https://huggingface.co/datasets/{REPO}/blob/main/{name}")

# ---------------------------------------------------------------------------
#  MODE = "parquet": convert each table to parquet and upload
# ---------------------------------------------------------------------------
elif MODE == "parquet":
    # ---- uncompressed size ----
    try:
        out = subprocess.run(["gzip", "-l", DRIVE_FILE], capture_output=True,
                             text=True).stdout.splitlines()[-1].split()
        UNCOMP = int(out[1])
    except Exception:
        UNCOMP = None
    free = shutil.disk_usage("/content").free
    print(f"Uncompressed ~{UNCOMP/2**30 if UNCOMP else '?'} GiB, "
          f"free disk {free/2**30:.0f} GiB")

    LOCAL = None
    if UNCOMP and UNCOMP + 20 * 2 ** 30 < free:
        LOCAL = "/content/lrclib.sqlite3"
        print(f"Extracting to {LOCAL} (fits on disk) ...")
        with open(DRIVE_FILE, "rb") as fin, open(LOCAL, "wb") as fout:
            import gzip as _gz
            shutil.copyfileobj(_gz.GzipFile(fileobj=fin), fout, 8 * 1024 * 1024)
        src = LOCAL
    else:
        src = DRIVE_FILE
        print("Reading DB directly from the Drive mount (slow path) ...")

    db = sqlite3.connect(f"file:{src}?mode=ro", uri=True)
    cur = db.cursor()
    tables = [r[0] for r in cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' "
        "AND name NOT LIKE 'sqlite_%' ORDER BY name")]
    tables = [t for t in tables if t not in SKIP_TABLES]
    print("Tables:", tables)

    def arrow_type(sqlite_type):
        t = (sqlite_type or "TEXT").upper()
        if "INT" in t:
            return pa.int64()
        if "REAL" in t or "FLOAT" in t or "DOUBLE" in t or "NUM" in t or "DEC" in t:
            return pa.float64()
        if "BLOB" in t:
            return pa.binary()
        return pa.string()

    for table in tables:
        cols = [(r[1], arrow_type(r[2])) for r in
                cur.execute(f'PRAGMA table_info("{table}")')]
        schema = pa.schema(cols)
        count = cur.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
        print(f"\n== {table}: {count:,} rows x {len(cols)} cols")

        parquet_local = f"/content/{table}.parquet"
        cur.execute(f'SELECT * FROM "{table}"')
        n = 0
        with pq.ParquetWriter(parquet_local, schema, compression=COMPRESSION) as w:
            while True:
                rows = cur.fetchmany(BATCH)
                if not rows:
                    break
                arrays = []
                for i, (_, typ) in enumerate(cols):
                    vals = [r[i] for r in rows]
                    if typ == pa.string():
                        vals = [None if v is None else str(v) for v in vals]
                    elif typ == pa.int64():
                        vals = [None if v is None else int(v) for v in vals]
                    elif typ == pa.float64():
                        vals = [None if v is None else float(v) for v in vals]
                    arrays.append(pa.array(vals, type=typ))
                w.write_table(pa.Table.from_arrays(arrays, schema=schema))
                n += len(rows)
                print(f"   {table}: {n:,} rows ...", end="\r")
        db.commit()

        print(f"\n   uploading {table}.parquet ...")
        api.upload_file(path_or_fileobj=parquet_local,
                        path_in_repo=f"{table}.parquet",
                        repo_id=REPO, repo_type="dataset")
        os.remove(parquet_local)
        print(f"   {table}.parquet uploaded")

    if LOCAL:
        os.remove(LOCAL)

    readme = (f"---\nlicense: other\npretty_name: lrclib database dump "
              f"(2026-08-28)\n---\n\n"
              f"Source: https://db-dumps.lrclib.net/\n\n"
              f"SQLite database converted to Parquet, one file per table.\n")
    rp = "/content/README.md"
    with open(rp, "w") as f:
        f.write(readme)
    api.upload_file(path_or_fileobj=rp, path_in_repo="README.md",
                    repo_id=REPO, repo_type="dataset")
    print(f"\nDone: https://huggingface.co/datasets/{REPO}")