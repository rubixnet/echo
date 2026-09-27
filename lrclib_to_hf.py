#!/usr/bin/env python3
"""
lrclib dump  ->  Google Drive  ->  Hugging Face

Resumable / idempotent. Safe to re-run: it skips whatever is already done.

What it does, per part (default 4 GB):
  1. get the part onto Google Drive (ranged download from lrclib if missing,
     otherwise staged back from Drive),
  2. compute its sha256,
  3. upload it to the HF dataset repo,
  4. clean up the temp file.
Then it writes SHA256SUMS.txt + a README card, and (with --assemble) builds the
single .sqlite3.gz from the parts and uploads that too.

Where to run it:
  * Google Colab (recommended for bandwidth): paste this file into a cell and
    run, or `!python lrclib_to_hf.py`. Keep the browser tab open.
  * Locally: `python3 lrclib_to_hf.py` (needs rclone; on macOS: brew install rclone).

Colab disk usage stays tiny: at most one part (4 GB) is staged at a time.
Google Drive is the durable store.

SECURITY: credentials come from the environment. Never hardcode them here.
"""

import argparse
import base64
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

# --------------------------------------------------------------------------
# CONFIG
# --------------------------------------------------------------------------
CFG = {
    "url": "https://db-dumps.lrclib.net/lrclib-db-dump-20260828T090200Z.sqlite3.gz",
    "filename": "lrclib-db-dump-20260828T090200Z.sqlite3.gz",
    "total": 46_407_329_309,
    "part_size": 4_000_000_000,
    "drive_parts": "gdrive:lrclib/parts",
    "drive_final": "gdrive:lrclib",
    "hash_file": "gdrive:lrclib/parts_sha256.txt",
    "hf_repo": "Rubixnet/lrclib-db-dumps",
    "hf_token": os.environ.get("HF_TOKEN", ""),
    # rclone [gdrive] config (base64) so this also works on Colab where your
    # local rclone config is not present. Remove if you only run locally.
    "gdrive_rclone_conf_b64": os.environ.get("GDRIVE_RCLONE_CONF_B64", ""),
    "tmp": "/content" if os.path.isdir("/content") else tempfile.gettempdir(),
}

HF_API = "https://huggingface.co/api/datasets"


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def run(cmd, timeout=None):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)


def parts():
    """Yield (index, start, end, size) for every part."""
    n = 0
    start = 0
    while start < CFG["total"]:
        end = min(start + CFG["part_size"], CFG["total"]) - 1
        n += 1
        yield n, start, end, end - start + 1
        start = end + 1


def part_name(i):
    return f"part{i:02d}.bin"


# --------------------------------------------------------------------------
# rclone / Drive
# --------------------------------------------------------------------------
def ensure_rclone():
    if run("rclone version").returncode == 0:
        return
    log("installing rclone ...")
    r = run("curl -fsSL https://rclone.org/install.sh | sudo bash")
    if run("rclone version").returncode != 0:
        sys.exit("rclone install failed: " + r.stderr[-300:])


def ensure_rclone_config():
    if "gdrive:" in run("rclone listremotes").stdout:
        return
    conf_b64 = CFG["gdrive_rclone_conf_b64"]
    if not conf_b64:
        sys.exit(
            "no gdrive remote found and GDRIVE_RCLONE_CONF_B64 is unset; "
            "export your rclone config as base64 or log in with `rclone config`"
        )
    conf_dir = os.path.expanduser("~/.config/rclone")
    os.makedirs(conf_dir, exist_ok=True)
    with open(os.path.join(conf_dir, "rclone.conf"), "wb") as f:
        f.write(base64.b64decode(conf_b64))
    log("wrote rclone config for gdrive")


def drive_sizes():
    r = run(f"rclone ls '{CFG['drive_parts']}/'")
    sizes = {}
    for line in r.stdout.splitlines():
        bits = line.strip().split()
        if len(bits) >= 2 and bits[-1].endswith(".bin"):
            sizes[bits[-1]] = int(bits[0])
    return sizes


def stage_from_drive(name, size):
    path = os.path.join(CFG["tmp"], name)
    if os.path.exists(path) and os.path.getsize(path) == size:
        return path
    run(f'rm -f "{path}"')
    r = run(
        f'rclone copyto "{CFG["drive_parts"]}/{name}" "{path}" '
        f"--drive-chunk-size 64M --low-level-retries 30 --timeout 600s --stats 0"
    )
    if r.returncode != 0 or not os.path.exists(path) or os.path.getsize(path) != size:
        run(f'rm -f "{path}"')
        return None
    return path


def push_to_drive(path, name):
    r = run(
        f'rclone moveto "{path}" "{CFG["drive_parts"]}/{name}" '
        f"--drive-chunk-size 64M --low-level-retries 30 --timeout 600s --stats 0"
    )
    return r.returncode == 0


# --------------------------------------------------------------------------
# download
# --------------------------------------------------------------------------
def download_part(i, start, end, size):
    import requests  # preinstalled on Colab

    path = os.path.join(CFG["tmp"], part_name(i))
    for attempt in (1, 2, 3, 4):
        try:
            log(f"  downloading {part_name(i)} [{start}-{end}] attempt {attempt}")
            t0 = time.time()
            got = 0
            with requests.get(
                CFG["url"],
                headers={"Range": f"bytes={start}-{end}"},
                stream=True,
                timeout=(30, 90),
            ) as r:
                if r.status_code != 206:
                    raise RuntimeError(f"range not honored (HTTP {r.status_code})")
                with open(path, "wb") as f:
                    for chunk in r.iter_content(8 * 1024 * 1024):
                        if got + len(chunk) > size:
                            raise RuntimeError("server sent more than requested range")
                        f.write(chunk)
                        got += len(chunk)
                        if time.time() - t0 > 900:
                            raise TimeoutError("part took > 15 min")
            if os.path.getsize(path) == size:
                log(f"  downloaded {part_name(i)} in {time.time()-t0:.0f}s")
                return path
            raise RuntimeError(f"size {os.path.getsize(path)} != {size}")
        except Exception as ex:
            log(f"  attempt {attempt} failed: {ex}")
            run(f'rm -f "{path}"')
            time.sleep(10)
    return None


# --------------------------------------------------------------------------
# hashes
# --------------------------------------------------------------------------
def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(8 * 1024 * 1024)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def load_hashes():
    r = run(f"rclone cat '{CFG['hash_file']}'")
    d = {}
    for line in r.stdout.splitlines():
        if "=" in line:
            k, v = line.strip().split("=", 1)
            try:
                d[int(k)] = v
            except ValueError:
                pass
    return d


def save_hashes(d):
    tmp = os.path.join(CFG["tmp"], "parts_sha256.txt")
    with open(tmp, "w") as f:
        for k in sorted(d):
            f.write(f"{k}={d[k]}\n")
    run(f'rclone copyto "{tmp}" "{CFG["hash_file"]}"')


# --------------------------------------------------------------------------
# Hugging Face
# --------------------------------------------------------------------------
def ensure_hf():
    try:
        import huggingface_hub  # noqa
    except ImportError:
        log("installing huggingface_hub ...")
        run("pip install -q -U 'huggingface_hub[hf_xet]'")


def hf_sizes():
    req = urllib.request.Request(
        f"{HF_API}/{CFG['hf_repo']}/tree/main",
        headers={"Authorization": f"Bearer {CFG['hf_token']}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return {e["path"]: e.get("size") for e in json.loads(r.read())}
    except Exception:
        return {}


def hf_upload_file(local_path, remote_name):
    from huggingface_hub import HfApi

    api = HfApi(token=CFG["hf_token"])
    api.create_repo(CFG["hf_repo"], repo_type="dataset", exist_ok=True)
    api.upload_file(
        path_or_fileobj=local_path,
        path_in_repo=remote_name,
        repo_id=CFG["hf_repo"],
        repo_type="dataset",
    )


def hf_upload_text(text, remote_name):
    path = os.path.join(CFG["tmp"], os.path.basename(remote_name))
    with open(path, "w") as f:
        f.write(text)
    hf_upload_file(path, remote_name)


def hf_upload_missing(path, remote_name, size):
    """Upload path unless HF already has remote_name at the right size."""
    if hf_sizes().get(remote_name) == size:
        log(f"  {remote_name} already on HF")
        return True
    hf_upload_file(path, remote_name)
    return True


# --------------------------------------------------------------------------
# phases
# --------------------------------------------------------------------------
def sync_parts():
    """Ensure every part is on Drive + HF, with hashes recorded."""
    sizes = drive_sizes()
    hashes = load_hashes()
    hf = hf_sizes()
    all_parts = list(parts())

    for (i, start, end, size) in all_parts:
        name = part_name(i)
        need_hf = hf.get(name) != size
        need_drive = sizes.get(name) != size
        need_hash = i not in hashes
        if not (need_hf or need_drive or need_hash):
            log(f"{name}: done (Drive+HF+hash)")
            continue

        log(f"{name}: drive={not need_drive} hf={not need_hf} hash={not need_hash}")
        path = stage_from_drive(name, size) if not need_drive else None
        if path is None:
            path = download_part(i, start, end, size)
        if path is None:
            log(f"{name}: FAILED to obtain, will retry on next run")
            continue

        if need_hash:
            digest = sha256_file(path)
            hashes[i] = digest
            save_hashes(hashes)
            log(f"  sha256 {name} = {digest}")
        if need_hf:
            log(f"  uploading {name} to HF ...")
            hf_upload_file(path, name)
            log(f"  {name} uploaded")
        if need_drive and not push_to_drive(path, name):
            log(f"  warning: could not move {name} to Drive")
        if os.path.exists(path):
            os.remove(path)

    return all(
        (drive_sizes().get(part_name(i)) == size)
        and (hf_sizes().get(part_name(i)) == size)
        and (i in load_hashes())
        for (i, s, e, size) in all_parts
    )


def write_manifest():
    """Write SHA256SUMS.txt and README.md describing the parts."""
    hashes = load_hashes()
    lines = []
    for (i, s, e, size) in parts():
        lines.append(f"{hashes.get(i, 'MISSING')}  {part_name(i)}")
    sums = "\n".join(lines) + "\n"
    hf_upload_text(sums, "SHA256SUMS.txt")

    readme = f"""---
license: other
task_categories:
- text-to-speech
language:
- multilingual
pretty_name: lrclib database dump (2026-08-28)
---

# lrclib database dump — 2026-08-28

Source: https://db-dumps.lrclib.net/ (file: `{CFG['filename']}`)

The dump is distributed here as **{len(list(parts()))} sequential parts** because of its size
({CFG['total']:,} bytes / {CFG['total']/2**30:.2f} GiB gzip-compressed SQLite3 database).

## Reassemble

```bash
cat part*.bin > {CFG['filename']}
```

Then verify:

```bash
sha256sum -c SHA256SUMS.txt   # verify each part
gunzip -k {CFG['filename']}   # -> SQLite3 database
```

Per-part SHA-256 hashes are in `SHA256SUMS.txt`. The hash of the reassembled
file is not published by the source; verify the parts and the `cat` order.
"""
    hf_upload_text(readme, "README.md")
    log("uploaded SHA256SUMS.txt and README.md")


def assemble_single():
    """Build the single .sqlite3.gz from the parts and upload it to Drive + HF."""
    if hf_sizes().get(CFG["filename"]) == CFG["total"]:
        log("single file already on HF")
        return
    stage = os.path.join(CFG["tmp"], CFG["filename"])
    if os.path.exists(stage) and os.path.getsize(stage) != CFG["total"]:
        os.remove(stage)

    with open(stage, "ab") as out:
        done = os.path.getsize(stage)
        for (i, s, e, size) in parts():
            if done >= s + size:
                continue
            name = part_name(i)
            tmp = stage_from_drive(name, size)
            if tmp is None:
                sys.exit(f"cannot stage {name} for assembly")
            skip = max(0, done - s)
            log(f"assembling {name} (skip {skip})")
            with open(tmp, "rb") as f:
                f.seek(skip)
                shutil.copyfileobj(f, out, 8 * 1024 * 1024)
            done = out.tell()
            os.remove(tmp)

    if os.path.getsize(stage) != CFG["total"]:
        sys.exit("assembly size mismatch")
    log(f"assembled {stage} ({CFG['total']} bytes)")
    digest = sha256_file(stage)
    log(f"reassembled sha256 = {digest}")

    log("copying single file to Drive ...")
    run(
        f'rclone copyto "{stage}" "{CFG["drive_final"]}/{CFG["filename"]}" '
        f"--drive-chunk-size 128M --low-level-retries 30 --timeout 600s --stats 0"
    )
    log("uploading single file to HF ...")
    hf_upload_file(stage, CFG["filename"])
    log(f"single file uploaded. sha256={digest}")


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--assemble", action="store_true",
                    help="also build and upload the single .sqlite3.gz")
    args = ap.parse_args()

    log(f"workdir={CFG['tmp']}")
    ensure_rclone()
    ensure_rclone_config()
    ensure_hf()

    log("=== phase 1: parts -> Drive + HF ===")
    ok = sync_parts()
    log(f"parts complete: {ok}")

    log("=== phase 2: manifest ===")
    write_manifest()

    if args.assemble:
        log("=== phase 3: single-file assembly ===")
        assemble_single()

    log("=== summary ===")
    hf = hf_sizes()
    for (i, s, e, size) in parts():
        name = part_name(i)
        log(f"  {name}: drive={drive_sizes().get(name)} hf={hf.get(name)} expected={size}")
    log("done.")


if __name__ == "__main__":
    main()
