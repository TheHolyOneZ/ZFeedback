<div align="center">

# ZFeedback

**The Z catalogue, and a way to report bugs.**

A fast, local-first desktop app for Windows and Linux that puts 50 privacy-focused
tools in one place — and lets you file a bug report, feature request or app request
without an account, an email address, or a browser tab.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-24C8DB.svg)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-000000.svg?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux-lightgrey.svg)](#install)

[Website](https://zsync.eu) · [Download](#install) · [Report a bug](#reporting-a-bug) · [Licence](LICENSE)

</div>

---

## What it is

Most bug trackers assume the project has a public GitHub repository. Around 30 of
the 50 tools in the Z catalogue don't have one — so until now there was simply no
way for anyone to report a problem with them.

ZFeedback is that missing piece. It's two things in one window:

- **A storefront.** Browse all 50 tools by category, search them, read what each
  one does, and open the download in your real browser.
- **A feedback client.** File bugs, feature requests and app requests, follow their
  status, and answer follow-up questions when a developer needs more detail.

It is not a web app in a window. It is a native Rust binary with a webview
interface, it starts fast, it works offline from a local cache, and it collects
nothing about you.

## Features

- **50 tools, 7 categories** — Tools, Security, Gaming, Discord, System, AI, SSH/SFTP
- **Works offline** — the catalogue is cached on disk and browsable with no network
- **No account to browse** — sign-in is only needed to file or track a ticket
- **Discord sign-in with 2FA** — a six-digit code sent by bot DM, no password anywhere
- **See exactly what you send** — version, OS, architecture and locale are shown in
  plain text on the submit form, editable before you send them
- **Duplicate detection** — near-matching tickets are offered for upvote as you type,
  so you don't file the forty-first copy of a known request
- **Reply tracking** — a tray count and an in-app badge when a developer is waiting
  on you
- **Attachments** — screenshots and logs, up to 4 MB each
- **Keyboard-first** — `Ctrl/Cmd+K` or `/` to search, arrow keys throughout
- **Respects `prefers-reduced-motion`** — decorative animation is removed, not slowed

## Privacy

No telemetry. No analytics. No crash reporting. No account required to browse.

The only data that ever leaves your machine is a ticket you deliberately submit,
and the app shows you its full contents — app version, OS, architecture, locale —
before you send it.

**Your API token never enters the JavaScript layer.** Every network call is made
from Rust; the token is stored in the OS keychain (Credential Manager on Windows,
Secret Service on Linux) and the webview can only ask Rust to make requests on its
behalf. A scripting flaw in the interface cannot leak your session.

## Install

**Windows and Linux.** There is no macOS build.

Download from **[zsync.eu](https://zsync.eu/#zfeedback)** — this repository holds
the source, not the binaries.

| Platform | Package |
|---|---|
| Windows 10/11 | `.exe` (NSIS, installs per-user — no admin needed) or `.msi` |
| Debian / Ubuntu | `.deb` |
| Fedora / RHEL | `.rpm` |
| Any Linux | `.AppImage` |

Checksums for every build are at
[`/releases/zfeedback/SHA256SUMS`](https://zsync.eu/releases/zfeedback/SHA256SUMS).

On Linux you'll also want `xdg-utils` installed so the app can open links in your
browser — it's a recommended dependency of the `.deb` and `.rpm`, but AppImage
users may need it separately.

## Reporting a bug

Use the app — that's what it's for. Open ZFeedback, pick the tool, and choose
**Report a bug**. You'll get a reply from a human.

For bugs in ZFeedback itself you can also
[open an issue](https://github.com/TheHolyOneZ/ZFeedback/issues). Include the
contents of **About → This machine**; it has everything needed to reproduce.

## Built with

| | |
|---|---|
| **Shell** | [Tauri v2](https://tauri.app) |
| **Core** | [Rust](https://www.rust-lang.org) — HTTP, keychain, disk cache, auth |
| **Interface** | [React 19](https://react.dev) · TypeScript · [Motion](https://motion.dev) |
| **Type** | [Inter](https://rsms.me/inter/) · [JetBrains Mono](https://www.jetbrains.com/lp/mono/) |
| **Build** | Vite · pnpm |

## Building from source

```bash
pnpm install
pnpm tauri dev      # run it
pnpm tauri build    # produce installers for the current platform
```

Requires Rust (stable) and the
[Tauri v2 prerequisites](https://tauri.app/start/prerequisites/) for your platform.

## Licence

ZFeedback is free software under the **GNU General Public License v3.0 or later**.
You may use, study, share and modify it; a distributed modified version must stay
free software. See [LICENSE](LICENSE).

The **ZFeedback name and the Z mark are trademarks** and are not covered by that
licence. Fork it freely, but please rename your fork.

The server this app talks to is a separate, closed-source component. Third-party
components and the bundled fonts are listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

Copyright © 2026 **TheHolyOneZ**

---

<div align="center">

<sub>
Keywords: desktop bug tracker · feedback client · issue tracker · feature request
tool · Tauri app · Rust desktop app · React desktop app · privacy-first software ·
no telemetry · offline-first · Windows · Linux · AppImage · open source
</sub>

</div>
