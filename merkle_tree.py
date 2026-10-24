#!/usr/bin/env python3
"""
Merkle Tree Filesystem Scanner & Change Tracker
===============================================
A high-performance cryptographic Merkle Tree engine for projects.
- Computes SHA-256 hashes for files and hierarchical Merkle hashes for directories.
- Caches file metadata (mtime + size) to avoid re-reading unchanged files.
- Uses Merkle branch pruning: if a directory hash matches, all its descendants
  are guaranteed identical and skipped during diffing.
- Pinpoints the exact branch and files that changed when any child node changes.
"""

import os
import sys
import json
import time
import hashlib
import fnmatch
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Set


DEFAULT_CACHE_DIR = ".merkle_cache"
DEFAULT_SNAPSHOT_FILE = os.path.join(DEFAULT_CACHE_DIR, "snapshot.json")
DEFAULT_IGNORES = [
    ".git",
    ".git/*",
    ".merkle_cache",
    ".merkle_cache/*",
    "node_modules",
    "node_modules/*",
    ".next",
    ".next/*",
    "cache",
    "cache/*",
    "out",
    "out/*",
    ".DS_Store",
    "*.pyc",
    "__pycache__",
    "__pycache__/*",
]


class Color:
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

    @classmethod
    def disable(cls):
        cls.CYAN = ""
        cls.GREEN = ""
        cls.YELLOW = ""
        cls.RED = ""
        cls.BOLD = ""
        cls.DIM = ""
        cls.RESET = ""


def format_hash(h: str, full: bool = False) -> str:
    if not h:
        return "empty"
    return h if full else h[:12]


def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def hash_file_content(filepath: str, chunk_size: int = 65536) -> str:
    """Compute SHA-256 hash of a file's content in chunks."""
    h = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            while chunk := f.read(chunk_size):
                h.update(chunk)
        return h.hexdigest()
    except (IOError, OSError) as e:
        # If unreadable (e.g. broken symlink or permission error)
        return hash_bytes(f"unreadable:{str(e)}".encode("utf-8"))


def compute_directory_merkle_hash(children: Dict[str, Dict[str, Any]]) -> str:
    """
    Compute Merkle hash for a directory from its children.
    Each child has a type ('file' or 'dir'), name, and hash.
    Children are sorted alphabetically to ensure determinism.
    Format: '<type>:<name>:<hash>\n'
    """
    if not children:
        return hash_bytes(b"empty_directory")

    items = []
    for name in sorted(children.keys()):
        child = children[name]
        ctype = "f" if child["type"] == "file" else "d"
        chash = child["hash"]
        items.append(f"{ctype}:{name}:{chash}")

    payload = "\n".join(items).encode("utf-8")
    return hash_bytes(payload)


def parse_gitignore(root_dir: str) -> List[str]:
    """Parse patterns from .gitignore file if present."""
    patterns = list(DEFAULT_IGNORES)
    gitignore_path = os.path.join(root_dir, ".gitignore")
    if os.path.exists(gitignore_path):
        try:
            with open(gitignore_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    # Clean trailing slashes for standard fnmatch compatibility
                    clean = line.rstrip("/")
                    patterns.append(line)
                    patterns.append(clean)
                    patterns.append(clean + "/*")
        except Exception:
            pass

    merkleignore_path = os.path.join(root_dir, ".merkleignore")
    if os.path.exists(merkleignore_path):
        try:
            with open(merkleignore_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    clean = line.rstrip("/")
                    patterns.append(line)
                    patterns.append(clean)
                    patterns.append(clean + "/*")
        except Exception:
            pass

    return list(dict.fromkeys(patterns))


def normalize_rel_path(path: str) -> str:
    path = path.replace("\\", "/")
    while path.startswith("./"):
        path = path[2:]
    return path.rstrip("/")


def is_ignored(rel_path: str, is_dir: bool, ignore_patterns: List[str]) -> bool:
    """Check if relative path matches any ignore pattern."""
    norm_path = normalize_rel_path(rel_path)
    if not norm_path or norm_path == ".":
        return False

    name = os.path.basename(norm_path)
    parts = norm_path.split("/")

    # Always explicitly ignore cache dir and git
    if ".merkle_cache" in parts or ".git" in parts:
        return True

    for pat in ignore_patterns:
        pat = pat.replace("\\", "/")
        # Clean leading ./
        if pat.startswith("./"):
            pat = pat[2:]

        # Direct name match (e.g., "*.png", "node_modules", ".merkle_cache")
        if fnmatch.fnmatch(name, pat.rstrip("/")):
            return True

        # Any path component matches (e.g. "node_modules", ".next")
        if any(fnmatch.fnmatch(part, pat.rstrip("/*")) for part in parts):
            return True

        # Full relative path match
        if fnmatch.fnmatch(norm_path, pat):
            return True
        if fnmatch.fnmatch(norm_path, pat.rstrip("/")):
            return True
        if is_dir and fnmatch.fnmatch(norm_path + "/", pat):
            return True

    return False


class ProjectMerkleTree:
    """
    Scans a project directory, builds a cryptographic Merkle tree,
    caches file stats for near-instant re-scans, and detects changes hierarchically.
    """

    def __init__(
        self,
        root_dir: str = ".",
        cache_file: str = DEFAULT_SNAPSHOT_FILE,
        custom_ignores: Optional[List[str]] = None,
        force_rehash: bool = False,
    ):
        self.root_dir = os.path.abspath(root_dir)
        self.cache_file = os.path.abspath(os.path.join(self.root_dir, cache_file))
        self.force_rehash = force_rehash
        self.ignore_patterns = parse_gitignore(self.root_dir)
        if custom_ignores:
            self.ignore_patterns.extend(custom_ignores)

    def load_cached_tree(self) -> Optional[Dict[str, Any]]:
        """Load snapshot tree from cache file if it exists."""
        if not os.path.exists(self.cache_file):
            return None
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _extract_file_cache(self, node: Dict[str, Any], cache: Dict[str, Tuple[int, int, str]]):
        """Recursively populate file lookup: path -> (mtime_ns, size, hash)."""
        if node["type"] == "file":
            mtime = node.get("mtime_ns", 0)
            size = node.get("size", 0)
            chash = node.get("hash", "")
            if chash:
                cache[node["path"]] = (mtime, size, chash)
        elif node["type"] == "dir":
            for child in node.get("children", {}).values():
                self._extract_file_cache(child, cache)

    def scan(self, existing_snapshot: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Build full Merkle tree for root_dir.
        If existing_snapshot is provided or cache exists, reuses file hashes
        when mtime_ns and size match without re-reading file content.
        """
        start_time = time.perf_counter()

        # Build quick cache lookup table
        file_cache: Dict[str, Tuple[int, int, str]] = {}
        if not self.force_rehash:
            cached_data = existing_snapshot or self.load_cached_tree()
            if cached_data and "tree" in cached_data:
                self._extract_file_cache(cached_data["tree"], file_cache)

        stats = {
            "total_files": 0,
            "total_dirs": 0,
            "total_bytes": 0,
            "rehashed_files": 0,
            "cached_files": 0,
        }

        def build_node(dir_path: str, rel_dir: str) -> Dict[str, Any]:
            children: Dict[str, Dict[str, Any]] = {}
            stats["total_dirs"] += 1

            try:
                entries = sorted(os.scandir(dir_path), key=lambda e: e.name)
            except (OSError, PermissionError):
                return {
                    "type": "dir",
                    "path": rel_dir,
                    "name": os.path.basename(rel_dir) or ".",
                    "hash": hash_bytes(b"inaccessible"),
                    "children": {},
                }

            for entry in entries:
                rel_path = os.path.relpath(entry.path, self.root_dir).replace("\\", "/")

                # Check if ignored
                if is_ignored(rel_path, entry.is_dir(follow_symlinks=False), self.ignore_patterns):
                    continue

                if entry.is_dir(follow_symlinks=False):
                    child_node = build_node(entry.path, rel_path)
                    children[entry.name] = child_node
                elif entry.is_file(follow_symlinks=False):
                    stats["total_files"] += 1
                    try:
                        st = entry.stat()
                        size = st.st_size
                        mtime_ns = st.st_mtime_ns
                        stats["total_bytes"] += size

                        # Fast cache hit check
                        chash = None
                        if not self.force_rehash and rel_path in file_cache:
                            cached_mtime, cached_size, cached_hash = file_cache[rel_path]
                            if cached_mtime == mtime_ns and cached_size == size:
                                chash = cached_hash
                                stats["cached_files"] += 1

                        if chash is None:
                            chash = hash_file_content(entry.path)
                            stats["rehashed_files"] += 1

                        children[entry.name] = {
                            "type": "file",
                            "path": rel_path,
                            "name": entry.name,
                            "size": size,
                            "mtime_ns": mtime_ns,
                            "hash": chash,
                        }
                    except (OSError, PermissionError) as e:
                        children[entry.name] = {
                            "type": "file",
                            "path": rel_path,
                            "name": entry.name,
                            "size": 0,
                            "mtime_ns": 0,
                            "hash": hash_bytes(f"error:{str(e)}".encode("utf-8")),
                        }

            dir_hash = compute_directory_merkle_hash(children)
            return {
                "type": "dir",
                "path": rel_dir,
                "name": os.path.basename(rel_dir) or ".",
                "hash": dir_hash,
                "children": children,
            }

        root_tree = build_node(self.root_dir, ".")
        duration = time.perf_counter() - start_time

        result = {
            "version": 1,
            "timestamp": time.time(),
            "root_dir": self.root_dir,
            "root_hash": root_tree["hash"],
            "stats": {
                **stats,
                "duration_seconds": round(duration, 4),
            },
            "tree": root_tree,
        }
        return result

    def save_snapshot(self, snapshot: Dict[str, Any]) -> str:
        """Save snapshot data to disk."""
        os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
        with open(self.cache_file, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2)
        return self.cache_file

    def diff(
        self,
        current_tree: Dict[str, Any],
        previous_tree: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Compare current Merkle tree against previous snapshot.
        Leverages Merkle tree pruning: if child directory hash matches,
        skips inspecting that entire subtree completely!
        """
        modified_files: List[Dict[str, Any]] = []
        added_files: List[Dict[str, Any]] = []
        deleted_files: List[Dict[str, Any]] = []
        changed_branches: List[Dict[str, Any]] = []

        def collect_all_files(node: Dict[str, Any], change_type: str, dest_list: List[Dict[str, Any]]):
            if node["type"] == "file":
                dest_list.append({
                    "path": node["path"],
                    "type": change_type,
                    "hash": node["hash"],
                    "size": node.get("size", 0),
                })
            elif node["type"] == "dir":
                for child in node.get("children", {}).values():
                    collect_all_files(child, change_type, dest_list)

        def walk_diff(curr: Dict[str, Any], prev: Dict[str, Any], branch_path: List[str]):
            # If Merkle hashes match, entire branch is identical - PRUNE!
            if curr["hash"] == prev["hash"]:
                return

            curr_children = curr.get("children", {})
            prev_children = prev.get("children", {})

            all_names = sorted(set(curr_children.keys()) | set(prev_children.keys()))

            for name in all_names:
                c_child = curr_children.get(name)
                p_child = prev_children.get(name)

                if c_child is not None and p_child is None:
                    # Added
                    if c_child["type"] == "file":
                        added_files.append({
                            "path": c_child["path"],
                            "type": "added",
                            "hash": c_child["hash"],
                            "size": c_child.get("size", 0),
                        })
                    else:
                        collect_all_files(c_child, "added", added_files)
                elif c_child is None and p_child is not None:
                    # Deleted
                    if p_child["type"] == "file":
                        deleted_files.append({
                            "path": p_child["path"],
                            "type": "deleted",
                            "hash": p_child["hash"],
                            "size": p_child.get("size", 0),
                        })
                    else:
                        collect_all_files(p_child, "deleted", deleted_files)
                else:
                    # In both: check hash
                    if c_child["hash"] != p_child["hash"]:
                        if c_child["type"] == "file":
                            modified_files.append({
                                "path": c_child["path"],
                                "type": "modified",
                                "old_hash": p_child["hash"],
                                "new_hash": c_child["hash"],
                                "size": c_child.get("size", 0),
                            })
                        else:
                            # Subdirectory hash changed, record branch and recurse!
                            changed_branches.append({
                                "path": c_child["path"],
                                "old_hash": p_child["hash"],
                                "new_hash": c_child["hash"],
                            })
                            walk_diff(c_child, p_child, branch_path + [name])

        is_identical = current_tree["hash"] == previous_tree["hash"]
        if not is_identical:
            walk_diff(current_tree, previous_tree, ["."])

        return {
            "identical": is_identical,
            "root_old_hash": previous_tree["hash"],
            "root_new_hash": current_tree["hash"],
            "modified": modified_files,
            "added": added_files,
            "deleted": deleted_files,
            "changed_branches": changed_branches,
            "total_changes": len(modified_files) + len(added_files) + len(deleted_files),
        }

    def trace_path(self, target_path: str, tree: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """
        Trace the Merkle path from root down to target_path,
        showing each parent's address/hash and how child hash flows into parent.
        """
        norm_target = os.path.relpath(os.path.join(self.root_dir, target_path), self.root_dir).replace("\\", "/")
        if norm_target == ".":
            return [{"path": ".", "type": "dir", "hash": tree["hash"], "name": "."}]

        parts = norm_target.split("/")
        path_nodes = [{"path": ".", "type": "dir", "hash": tree["hash"], "name": "."}]

        curr = tree
        for part in parts:
            children = curr.get("children", {})
            if part not in children:
                return None
            curr = children[part]
            path_nodes.append({
                "path": curr["path"],
                "type": curr["type"],
                "hash": curr["hash"],
                "name": part,
            })

        return path_nodes


# =====================================================================
# CLI Visual Presentation Functions
# =====================================================================

def print_banner():
    print(f"{Color.CYAN}{Color.BOLD}╔══════════════════════════════════════════════════════════════════╗{Color.RESET}")
    print(f"{Color.CYAN}{Color.BOLD}║             PROJECT MERKLE TREE CHANGE TRACKER                   ║{Color.RESET}")
    print(f"{Color.CYAN}{Color.BOLD}╚══════════════════════════════════════════════════════════════════╝{Color.RESET}")


def print_tree_view(
    node: Dict[str, Any],
    prefix: str = "",
    is_last: bool = True,
    max_depth: int = 3,
    current_depth: int = 0,
    full_hash: bool = False,
):
    """Render an ASCII tree of the Merkle hierarchy."""
    if current_depth > max_depth:
        return

    connector = "└── " if is_last else "├── "
    hash_str = format_hash(node["hash"], full_hash)

    if node["path"] == ".":
        print(f"{Color.BOLD}● Root Project Directory{Color.RESET} {Color.CYAN}[merkle: {hash_str}]{Color.RESET}")
    else:
        if node["type"] == "dir":
            print(f"{prefix}{connector}{Color.BOLD}{Color.CYAN}📁 {node['name']}/{Color.RESET} {Color.DIM}[merkle: {hash_str}]{Color.RESET}")
        else:
            print(f"{prefix}{connector}📄 {node['name']} {Color.DIM}[sha256: {hash_str}]{Color.RESET}")

    if node["type"] == "dir":
        children = list(node.get("children", {}).values())
        new_prefix = prefix + ("    " if is_last else "│   ")
        for i, child in enumerate(children):
            print_tree_view(
                child,
                prefix=new_prefix if node["path"] != "." else "",
                is_last=(i == len(children) - 1),
                max_depth=max_depth,
                current_depth=current_depth + 1,
                full_hash=full_hash,
            )


def print_diff_report(diff_result: Dict[str, Any], full_hash: bool = False):
    """Format and print a rich Merkle diff."""
    if diff_result["identical"]:
        print(f"\n{Color.GREEN}{Color.BOLD}✔ PROJECT IS 100% UNCHANGED{Color.RESET}")
        print(f"  Root Merkle Hash: {Color.CYAN}{format_hash(diff_result['root_new_hash'], full_hash)}{Color.RESET}")
        print(f"  {Color.DIM}All subtrees verified identical via root cryptographic proof.{Color.RESET}\n")
        return

    print(f"\n{Color.YELLOW}{Color.BOLD}⚡ CHANGES DETECTED IN PROJECT!{Color.RESET}")
    old_h = format_hash(diff_result['root_old_hash'], full_hash)
    new_h = format_hash(diff_result['root_new_hash'], full_hash)
    print(f"  Root Address Changed: {Color.DIM}{old_h}{Color.RESET} ➔ {Color.BOLD}{Color.CYAN}{new_h}{Color.RESET}")
    print(f"  Total Changes: {Color.BOLD}{diff_result['total_changes']}{Color.RESET} file(s)\n")

    if diff_result["changed_branches"]:
        print(f"{Color.BOLD}Affected Merkle Branches (Parent Addresses Modified):{Color.RESET}")
        for b in diff_result["changed_branches"]:
            b_old = format_hash(b['old_hash'], full_hash)
            b_new = format_hash(b['new_hash'], full_hash)
            print(f"  📁 {Color.CYAN}{b['path']}/{Color.RESET} : {Color.DIM}{b_old}{Color.RESET} ➔ {Color.YELLOW}{b_new}{Color.RESET}")
        print()

    print(f"{Color.BOLD}Pinpointed File Changes:{Color.RESET}")
    for m in diff_result["modified"]:
        m_old = format_hash(m['old_hash'], full_hash)
        m_new = format_hash(m['new_hash'], full_hash)
        print(f"  {Color.YELLOW}[MODIFIED]{Color.RESET} 📄 {m['path']} ({Color.DIM}{m_old}{Color.RESET} ➔ {Color.YELLOW}{m_new}{Color.RESET})")

    for a in diff_result["added"]:
        a_h = format_hash(a['hash'], full_hash)
        print(f"  {Color.GREEN}[ADDED]{Color.RESET}    📄 {a['path']} ({Color.GREEN}{a_h}{Color.RESET})")

    for d in diff_result["deleted"]:
        d_h = format_hash(d['hash'], full_hash)
        print(f"  {Color.RED}[DELETED]{Color.RESET}  📄 {d['path']} ({Color.RED}{d_h}{Color.RESET})")

    print()


# =====================================================================
# Main Commands
# =====================================================================

def cmd_scan(pmt: ProjectMerkleTree, args):
    """Full scan and save snapshot."""
    if not args.json:
        print_banner()
        print(f"{Color.BOLD}Scanning project:{Color.RESET} {pmt.root_dir}")
    snapshot = pmt.scan()
    save_path = pmt.save_snapshot(snapshot)

    stats = snapshot["stats"]
    root_hash = format_hash(snapshot["root_hash"], args.full_hash)

    if args.json:
        print(json.dumps({
            "status": "success",
            "root_hash": snapshot["root_hash"],
            "cache_file": save_path,
            "stats": stats,
        }, indent=2))
        return 0

    print(f"\n{Color.GREEN}✔ Merkle Tree snapshot created and saved successfully!{Color.RESET}")
    print(f"  Cache file:      {Color.CYAN}{os.path.relpath(save_path, pmt.root_dir)}{Color.RESET}")
    print(f"  Root Merkle:     {Color.BOLD}{Color.CYAN}{root_hash}{Color.RESET}")
    print(f"  Total Files:     {stats['total_files']} ({stats['cached_files']} cached, {stats['rehashed_files']} hashed)")
    print(f"  Total Dirs:      {stats['total_dirs']}")
    print(f"  Total Data Size: {stats['total_bytes'] / (1024*1024):.2f} MB")
    print(f"  Scan Duration:   {stats['duration_seconds']}s")
    print()
    return 0


def cmd_status(pmt: ProjectMerkleTree, args):
    """Check status against existing snapshot."""
    cached = pmt.load_cached_tree()
    if not cached:
        if args.json:
            print(json.dumps({"error": "No existing snapshot found"}, indent=2))
        else:
            print(f"{Color.YELLOW}No existing Merkle snapshot found.{Color.RESET}")
            print("Run `python3 merkle_tree.py scan` to initialize the project hash.")
        return 1

    current = pmt.scan(existing_snapshot=cached)
    diff_res = pmt.diff(current["tree"], cached["tree"])

    if args.json:
        print(json.dumps({
            "identical": diff_res["identical"],
            "root_old_hash": diff_res["root_old_hash"],
            "root_new_hash": diff_res["root_new_hash"],
            "total_changes": diff_res["total_changes"],
            "modified": diff_res["modified"],
            "added": diff_res["added"],
            "deleted": diff_res["deleted"],
            "changed_branches": diff_res["changed_branches"],
        }, indent=2))
    else:
        print_banner()
        print_diff_report(diff_res, args.full_hash)

    if not diff_res["identical"] and getattr(args, "update", False):
        pmt.save_snapshot(current)
        if not args.json:
            print(f"{Color.GREEN}✔ Snapshot updated to current project state.{Color.RESET}\n")

    return 0 if diff_res["identical"] else 2


def cmd_trace(pmt: ProjectMerkleTree, args):
    """Trace the Merkle path from a file up to the root."""
    target_path = args.path
    cached = pmt.load_cached_tree()
    current = pmt.scan(existing_snapshot=cached)

    path_nodes = pmt.trace_path(target_path, current["tree"])
    if not path_nodes:
        print(f"{Color.RED}Error: Path not found in project Merkle Tree: {target_path}{Color.RESET}")
        return 1

    print_banner()
    print(f"{Color.BOLD}Merkle Proof & Address Propagation Chain for:{Color.RESET} {Color.CYAN}{target_path}{Color.RESET}\n")

    print(f"  When this node changes, its hash changes and propagates up to the root:")
    print(f"  ────────────────────────────────────────────────────────────────────────")

    # Display bottom-up (leaf -> parent -> root)
    reversed_nodes = list(reversed(path_nodes))
    for i, node in enumerate(reversed_nodes):
        h = format_hash(node["hash"], args.full_hash)
        indent = "  " + ("  " * i)
        if node["type"] == "file":
            print(f"{indent}📄 [LEAF FILE]   {Color.BOLD}{node['path']}{Color.RESET} ➔ Hash: {Color.YELLOW}{h}{Color.RESET}")
        elif node["path"] == ".":
            print(f"{indent}👑 [ROOT NODE]   {Color.BOLD}Root Project{Color.RESET} ➔ Merkle Root: {Color.CYAN}{Color.BOLD}{h}{Color.RESET}")
        else:
            print(f"{indent}📁 [PARENT DIR]  {Color.BOLD}{node['path']}/{Color.RESET} ➔ Merkle Hash: {Color.GREEN}{h}{Color.RESET}")

    print(f"\n  {Color.DIM}Parent addresses are derived mathematically from child hashes.{Color.RESET}\n")
    return 0


def cmd_tree(pmt: ProjectMerkleTree, args):
    """Print the Merkle tree visually."""
    cached = pmt.load_cached_tree()
    tree_data = cached if cached else pmt.scan()
    root_node = tree_data["tree"]

    # If subpath requested
    if args.path and args.path != ".":
        norm = os.path.relpath(os.path.join(pmt.root_dir, args.path), pmt.root_dir).replace("\\", "/")
        parts = norm.split("/")
        curr = root_node
        for p in parts:
            if p in curr.get("children", {}):
                curr = curr["children"][p]
            else:
                print(f"{Color.RED}Path not found: {args.path}{Color.RESET}")
                return 1
        root_node = curr

    print_banner()
    print_tree_view(root_node, max_depth=args.depth, full_hash=args.full_hash)
    print()
    return 0


def cmd_watch(pmt: ProjectMerkleTree, args):
    """Continuously watch project and display Merkle address updates live."""
    print_banner()
    print(f"{Color.BOLD}Starting Merkle Live Watcher...{Color.RESET}")
    print(f"Watching: {pmt.root_dir}")
    print(f"Interval: {args.interval}s (Press Ctrl+C to stop)\n")

    current_snapshot = pmt.load_cached_tree()
    if not current_snapshot:
        print("Initializing initial Merkle snapshot...")
        current_snapshot = pmt.scan()
        pmt.save_snapshot(current_snapshot)

    last_root_hash = current_snapshot["root_hash"]
    print(f"Current Root Merkle Hash: {Color.CYAN}{format_hash(last_root_hash, args.full_hash)}{Color.RESET}\n")

    try:
        while True:
            time.sleep(args.interval)
            new_snapshot = pmt.scan(existing_snapshot=current_snapshot)
            diff_res = pmt.diff(new_snapshot["tree"], current_snapshot["tree"])

            if not diff_res["identical"]:
                timestamp_str = time.strftime("%H:%M:%S")
                print(f"\n{Color.YELLOW}[{timestamp_str}] Change Detected! Updating Merkle Tree...{Color.RESET}")
                print_diff_report(diff_res, args.full_hash)
                current_snapshot = new_snapshot
                last_root_hash = new_snapshot["root_hash"]
                if args.auto_save:
                    pmt.save_snapshot(new_snapshot)
                    print(f"{Color.DIM}Snapshot updated.{Color.RESET}")
    except KeyboardInterrupt:
        print(f"\n{Color.CYAN}Watcher stopped.{Color.RESET}")
        return 0


# =====================================================================
# CLI Entrypoint
# =====================================================================

def main():
    import argparse

    # Common flags inherited by subparsers
    common_parser = argparse.ArgumentParser(add_help=False)
    common_parser.add_argument("--root", default=".", help="Project root directory (default: current directory)")
    common_parser.add_argument("--cache", default=DEFAULT_SNAPSHOT_FILE, help="Path to snapshot cache file")
    common_parser.add_argument("--full-hash", action="store_true", help="Display full 64-character SHA-256 hashes")
    common_parser.add_argument("--json", action="store_true", help="Output results in machine-readable JSON format")
    common_parser.add_argument("--force-rehash", action="store_true", help="Force re-reading file content ignoring mtime")
    common_parser.add_argument("--no-color", action="store_true", help="Disable colored output")
    common_parser.add_argument("--ignore", action="append", help="Extra ignore patterns (can specify multiple)")

    parser = argparse.ArgumentParser(
        description="Merkle Tree Filesystem Scanner & Change Tracker",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        parents=[common_parser],
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # scan
    p_scan = subparsers.add_parser("scan", parents=[common_parser], help="Scan project, build Merkle tree, and save snapshot")

    # status / check
    p_status = subparsers.add_parser("status", parents=[common_parser], help="Fast check project against snapshot using Merkle pruning")
    p_status.add_argument("-u", "--update", action="store_true", help="Update snapshot if changes are detected")

    # diff
    p_diff = subparsers.add_parser("diff", parents=[common_parser], help="Show detailed diff of changes since snapshot")
    p_diff.add_argument("-u", "--update", action="store_true", help="Update snapshot if changes are detected")

    # tree
    p_tree = subparsers.add_parser("tree", parents=[common_parser], help="Print visual Merkle tree hierarchy")
    p_tree.add_argument("path", nargs="?", default=".", help="Subdirectory path to display")
    p_tree.add_argument("-d", "--depth", type=int, default=3, help="Max depth to display (default: 3)")

    # trace
    p_trace = subparsers.add_parser("trace", parents=[common_parser], help="Trace Merkle path from file up to root")
    p_trace.add_argument("path", help="Relative path to file or directory")

    # watch
    p_watch = subparsers.add_parser("watch", parents=[common_parser], help="Watch project continuously and report live hash changes")
    p_watch.add_argument("-i", "--interval", type=float, default=1.5, help="Check interval in seconds (default: 1.5)")
    p_watch.add_argument("--auto-save", action="store_true", help="Automatically save snapshot on change")

    args = parser.parse_args()

    if args.no_color or not sys.stdout.isatty():
        Color.disable()

    pmt = ProjectMerkleTree(
        root_dir=args.root,
        cache_file=args.cache,
        custom_ignores=args.ignore,
        force_rehash=args.force_rehash,
    )

    if not args.command or args.command == "status":
        sys.exit(cmd_status(pmt, args))
    elif args.command == "scan":
        sys.exit(cmd_scan(pmt, args))
    elif args.command == "diff":
        sys.exit(cmd_status(pmt, args))
    elif args.command == "tree":
        sys.exit(cmd_tree(pmt, args))
    elif args.command == "trace":
        sys.exit(cmd_trace(pmt, args))
    elif args.command == "watch":
        sys.exit(cmd_watch(pmt, args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
