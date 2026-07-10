#!/usr/bin/env python3
"""
TypeScript Project Diagnostic Script
Analyzes TypeScript projects for configuration, performance, and common issues.
"""

import subprocess
import json
from pathlib import Path


def run_cmd(cmd: str) -> str:
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout + result.stderr
    except Exception as e:
        return str(e)


def check_versions():
    print("\nVersions:")
    print("-" * 40)
    ts_version = run_cmd("npx tsc --version 2>/dev/null").strip()
    node_version = run_cmd("node -v 2>/dev/null").strip()
    print(f"  TypeScript: {ts_version or 'Not found'}")
    print(f"  Node.js: {node_version or 'Not found'}")


def check_tsconfig():
    print("\nTSConfig Analysis:")
    print("-" * 40)
    tsconfig_path = Path("tsconfig.json")
    if not tsconfig_path.exists():
        print("tsconfig.json not found")
        return

    try:
        with open(tsconfig_path) as f:
            config = json.load(f)
        compiler_opts = config.get("compilerOptions", {})
        print("Strict mode enabled" if compiler_opts.get("strict") else "Strict mode NOT enabled")
    except json.JSONDecodeError:
        print("Invalid JSON in tsconfig.json")


def check_tooling():
    print("\nTooling Detection:")
    print("-" * 40)
    pkg_path = Path("package.json")
    if not pkg_path.exists():
        print("package.json not found")
        return

    try:
        with open(pkg_path) as f:
            pkg = json.load(f)
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        tools = ["vite-plus", "@voidzero-dev", "oxlint", "oxfmt", "eslint", "prettier", "vitest", "jest", "turborepo", "turbo", "nx", "lerna"]        
        for tool in tools:
            for dep in all_deps:
                if tool in dep.lower():
                    print(f"  {tool}")
                    break
    except json.JSONDecodeError:
        print("Invalid JSON in package.json")


def check_monorepo():
    print("\nMonorepo Check:")
    print("-" * 40)
    indicators = ["pnpm-workspace.yaml", "lerna.json", "nx.json", "turbo.json"]
    found = False
    for file in indicators:
        if Path(file).exists():
            print(f"  {file}")
            found = True
    if not found:
        print("  No monorepo configuration detected")


def check_type_errors():
    print("\nType Check:")
    print("-" * 40)
    result = run_cmd("npx tsc --noEmit 2>&1 | head -20")
    if "error TS" in result:
        print(result[:500])
    else:
        print("  No type errors")


def main():
    print("=" * 50)
    print("TypeScript Project Diagnostic Report")
    print("=" * 50)
    check_versions()
    check_tsconfig()
    check_tooling()
    check_monorepo()
    check_type_errors()
    print("\nDone")


if __name__ == "__main__":
    main()
