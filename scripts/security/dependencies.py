#!/usr/bin/env python3
"""Inventorie les scripts HTML CDN sans executer le code applicatif."""

import argparse
import collections
import html.parser
import json
import pathlib
import re
import sys
import urllib.parse

EXACT = re.compile(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\Z")
SPEC = re.compile(
    r"(?P<name>@[^/@]+/[^/@]+|[^/@]+)@(?P<version>[^/]+)(?:/|$)"
)


class Scripts(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            value = dict(attrs).get("src", "")
            if value.startswith(("https://", "http://", "//")):
                self.urls.append(value)


def dependency(url):
    parsed = urllib.parse.urlsplit(
        "https:" + url if url.startswith("//") else url
    )

    if parsed.scheme != "https":
        raise ValueError("Script externe sans HTTPS")

    path = urllib.parse.unquote(parsed.path).lstrip("/")

    if parsed.hostname == "cdn.jsdelivr.net" and path.startswith("npm/"):
        path = path[4:]
    elif parsed.hostname not in ["unpkg.com", "esm.sh"]:
        raise ValueError("Hote de script non couvert")

    match = SPEC.match(path)

    if not match:
        raise ValueError("Paquet ou version absent de l URL")

    name, version = match.group("name", "version")

    if not re.fullmatch(r"(?:@[a-z0-9._-]+/)?[a-z0-9._-]+", name):
        raise ValueError("Nom npm invalide")

    if not re.fullmatch(r"[A-Za-z0-9.*^~+_-]+", version):
        raise ValueError("Version npm non prise en charge")

    return name, version


def inventory(root):
    found = collections.defaultdict(set)
    locations = collections.defaultdict(list)
    unsupported = []
    jsr = []

    for file in sorted(root.rglob("*")):
        relative = file.relative_to(root)

        if any(
            part in [".git", "node_modules", ".security-audit"]
            for part in relative.parts
        ) or not file.is_file():
            continue

        if file.suffix == ".html":
            parser = Scripts()
            parser.feed(file.read_text(errors="replace"))

            for url in parser.urls:
                try:
                    name, version = dependency(url)
                except ValueError as error:
                    unsupported.append({
                        "file": str(relative),
                        "reason": str(error),
                    })
                    continue

                found[name].add(version)
                locations[name].append(str(relative))

        elif file.suffix in [".ts", ".js", ".mjs"]:
            text = file.read_text(errors="replace")

            jsr.extend(
                {"file": str(relative), "import": value}
                for value in re.findall(
                    r"""["'](jsr:[^"']+)["']""",
                    text,
                )
            )

    dependencies = {}
    floating = []

    # Ces noms sont reserves avant de generer les alias.
    reserved_names = set(found)
    alias_number = 0

    for name, versions in sorted(found.items()):
        for version in sorted(versions):
            if len(versions) == 1:
                dependencies[name] = version
            else:
                # npm autorise plusieurs versions d'un meme paquet
                # en les installant sous des noms d'alias distincts.
                while True:
                    alias = f"rebond-audit-dependency-{alias_number}"
                    alias_number += 1

                    if alias not in reserved_names:
                        reserved_names.add(alias)
                        break

                dependencies[alias] = f"npm:{name}@{version}"

            if not EXACT.fullmatch(version):
                floating.append({
                    "package": name,
                    "version": version,
                })

    return {
        "dependencies": dependencies,
        "floating": floating,
        "unsupported": unsupported,
        "jsr_not_audited_by_npm": jsr,
        "locations": {
            name: sorted(set(files))
            for name, files in sorted(locations.items())
        },
    }


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--root",
        type=pathlib.Path,
        default=pathlib.Path("."),
    )
    parser.add_argument(
        "--output",
        type=pathlib.Path,
        default=pathlib.Path(".security-audit"),
    )
    parser.add_argument("--strict", action="store_true")

    args = parser.parse_args()
    report = inventory(args.root.resolve())

    args.output.mkdir(parents=True, exist_ok=True)

    (args.output / "inventory.json").write_text(
        json.dumps(report, indent=2) + "\n"
    )

    manifest = {
        "name": "rebondplay-cdn-security-audit",
        "version": "1.0.0",
        "private": True,
        "dependencies": report["dependencies"],
    }

    (args.output / "package.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )

    for name, version in report["dependencies"].items():
        if version.startswith("npm:"):
            print(version[4:] + " (alias : " + name + ")")
        else:
            print(name + "@" + version)

    for item in report["floating"]:
        print(
            "VERSION FLOTTANTE : "
            + item["package"]
            + "@"
            + item["version"]
        )

    for item in report["unsupported"]:
        print("NON COUVERT : " + json.dumps(item))

    if report["jsr_not_audited_by_npm"]:
        print(
            "NON COUVERT PAR NPM : "
            + str(len(report["jsr_not_audited_by_npm"]))
            + " imports JSR ; revue separee necessaire."
        )

    if not report["dependencies"]:
        print("Aucune dependance CDN reconnue : controle incomplet.")
        return 2

    if report["unsupported"]:
        return 2

    if args.strict and (
        report["floating"] or report["jsr_not_audited_by_npm"]
    ):
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())