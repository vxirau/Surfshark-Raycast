# Private Internet Access for Raycast

<p align="center">
  <img src="assets/extension-icon.png" width="128" alt="Private Internet Access for Raycast" />
</p>

<p align="center">
  Control the <strong>Private Internet Access</strong> VPN from Raycast.
  <br />
  No credentials stored. No GUI window popping up. Just fast, keyboard-driven VPN control.
</p>

## Features

- **Live status** — connection state, region, VPN IP, protocol, and forwarded port.
- **Region browser** — all 160+ PIA regions with country flags, searchable by country, city, or region id.
- **Favorites & recents** — star the regions you actually use; the last five are remembered automatically.
- **Port-forwarding aware** — regions that support port forwarding are tagged, and the active forwarded port is shown and copyable.
- **Geo-located regions flagged** — know when a region's IP is registered in-country but hosted elsewhere.
- **Headless** — connects without launching the PIA window by enabling PIA's background mode on demand.

## Commands

| Command | Action | Mode |
|---------|--------|------|
| **Open Detailed** | Browse regions, check status, connect and disconnect | View |
| **Toggle Connection** | Connect if off, disconnect if on | No-view |
| **Connect Most Recent** | Reconnect to the region you used last | No-view |

The no-view commands are silent — they close Raycast and report through a HUD, so they work well bound to hotkeys. A single **Toggle Connection** hotkey covers both directions, so there's no separate connect/disconnect pair to bind.

## Requirements

- **macOS** with the Private Internet Access app installed and signed in.
- PIA's command-line helper (`piactl`). Enable it in **PIA → Settings → General → Install PIA command-line helper**.

The extension detects each of these and walks you through anything missing.

## How It Works

| Layer | Mechanism |
|-------|-----------|
| **Control** | `piactl` — PIA's official command-line interface. Every call uses `execFile` with positional arguments, never a shell. |
| **Region catalog** | PIA's public server list (`serverlist.piaservers.net`), joined to `piactl` region ids to supply country codes, port-forwarding support, and geo flags. |
| **Credentials** | **Never read or stored.** Sign-in stays entirely inside the PIA app. |

### A note on IP addresses

`piactl get pubip` reports your ISP-assigned address and does **not** change while the tunnel is up. This extension therefore shows `vpnip` (the tunnel address) when connected, and only shows your public IP when disconnected — labelled as unprotected.

## License

MIT
