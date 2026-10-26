#!/usr/bin/env python3
"""Validate generated automation kits without contacting external services."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIT_ROOT = ROOT / "automation-kits"
EXPECTED = {"front-office", "dental-desk", "lead-engine", "hospital-lifecycle", "support-assistant", "reputation-care", "property-enquiries", "daily-operations", "realestate-lead-desk", "voice-front-desk", "local-site-leadgen", "gold-showroom", "ca-practice", "universal-replier"}
REQUIRED = {"README.md", "prompts.md", "schemas.json", "sample-payloads.json", "tests.json"}
EXTENDED = {"realestate-lead-desk", "voice-front-desk", "local-site-leadgen", "gold-showroom", "ca-practice", "universal-replier"}
EXTENDED_REQUIRED = {"quick-start.md", "api-requirements.json", "config-template.json"}
ALLOWED_NODE_TYPES = {"n8n-nodes-base.manualTrigger", "n8n-nodes-base.code"}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def syntax_ok(code: str) -> bool:
    # Code nodes run inside a function in n8n; wrapping permits top-level returns in snippets.
    wrapped = "function n8nCodeNode() {\n" + code + "\n}\n"
    result = subprocess.run(["node", "--check"], input=wrapped, text=True, capture_output=True)
    return result.returncode == 0


def main() -> int:
    errors: list[str] = []
    if not KIT_ROOT.exists():
        print(f"FAIL missing {KIT_ROOT}")
        return 1
    kits = {p.name for p in KIT_ROOT.iterdir() if p.is_dir()}
    if kits != EXPECTED:
        fail(errors, f"kit folders mismatch: expected {sorted(EXPECTED)}, got {sorted(kits)}")
    inventory_path = KIT_ROOT / "KIT_INVENTORY.json"
    if not inventory_path.exists():
        fail(errors, "missing KIT_INVENTORY.json")
    else:
        try:
            inventory = json.loads(inventory_path.read_text())
            if set(inventory) != EXPECTED:
                fail(errors, "inventory keys do not match the fourteen kit folders")
        except Exception as exc:
            fail(errors, f"inventory is invalid JSON: {exc}")

    workflow_count = 0
    for kit in sorted(EXPECTED):
        folder = KIT_ROOT / kit
        present = {p.name for p in folder.iterdir() if p.is_file()}
        if not REQUIRED.issubset(present):
            fail(errors, f"{kit}: missing required files {sorted(REQUIRED - present)}")
        if kit in EXTENDED and not EXTENDED_REQUIRED.issubset(present):
            fail(errors, f"{kit}: missing extended required files {sorted(EXTENDED_REQUIRED - present)}")
        readme = (folder / "README.md").read_text(errors="replace") if (folder / "README.md").exists() else ""
        for phrase in ["inactive n8n starter template", "Configuration required", "persistent idempotency", "not a deployed agent", "https://docs.n8n.io/build/code-in-n8n/using-the-code-node", "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook"]:
            if phrase not in readme:
                fail(errors, f"{kit}: README missing contract phrase/link {phrase}")
        wfdir = folder / "workflows"
        workflows = sorted(wfdir.glob("*.json")) if wfdir.exists() else []
        if not workflows:
            fail(errors, f"{kit}: no workflow JSON files")
        for path in workflows:
            workflow_count += 1
            try:
                wf = json.loads(path.read_text())
            except Exception as exc:
                fail(errors, f"{path}: invalid JSON {exc}")
                continue
            if wf.get("active") is not False:
                fail(errors, f"{path}: workflow must be inactive")
            if wf.get("credentials"):
                fail(errors, f"{path}: credentials present")
            nodes = wf.get("nodes")
            if not isinstance(nodes, list):
                fail(errors, f"{path}: nodes is not a list")
                continue
            names = {n.get("name") for n in nodes}
            if "Manual Trigger" not in names:
                fail(errors, f"{path}: Manual Trigger missing")
            code_nodes = [n for n in nodes if n.get("type") == "n8n-nodes-base.code"]
            if len(code_nodes) < 3:
                fail(errors, f"{path}: expected preparation, validation, and action-draft Code nodes")
            for node in nodes:
                if node.get("type") not in ALLOWED_NODE_TYPES:
                    fail(errors, f"{path}: unsupported/fake node type {node.get('type')}")
                if node.get("type") == "n8n-nodes-base.code":
                    code = node.get("parameters", {}).get("jsCode", "")
                    if "return [" not in code:
                        fail(errors, f"{path}/{node.get('name')}: Code node does not return n8n items")
                    if not syntax_ok(code):
                        fail(errors, f"{path}/{node.get('name')}: JavaScript syntax failed")
            conns = wf.get("connections", {})
            for source, spec in conns.items():
                if source not in names:
                    fail(errors, f"{path}: connection source {source!r} not a node")
                for branch in spec.get("main", []):
                    for edge in branch:
                        if edge.get("node") not in names:
                            fail(errors, f"{path}: connection target {edge.get('node')!r} not a node")
            serialized = path.read_text()
            for forbidden in ["http://", "https://", "api_key", "Authorization", "webhookUrl", "n8n-nodes-base.httpRequest"]:
                if forbidden in serialized:
                    fail(errors, f"{path}: forbidden live connection/secret marker {forbidden}")
        for data_name in ["schemas.json", "sample-payloads.json", "tests.json"]:
            path = folder / data_name
            try:
                json.loads(path.read_text())
            except Exception as exc:
                fail(errors, f"{path}: invalid JSON {exc}")

    if errors:
        print(f"FAIL {len(errors)} validation errors")
        print("\n".join(f"- {x}" for x in errors))
        return 1
    print(f"PASS: {len(EXPECTED)} kits, {workflow_count} inactive importable workflow JSON files; required files, connections, Code-node syntax, safety contracts, and no-live-connection checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
