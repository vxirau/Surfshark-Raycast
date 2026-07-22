import { closeMainWindow, LocalStorage, open, showHUD } from "@raycast/api";
import {
  connect,
  detectSetup,
  disconnect,
  enableBackgroundMode,
  isActive,
  readConnectionState,
  readStatus,
  setRegion,
  waitForReconnect,
  waitForState,
} from "./pia";
import { AUTO_REGION_ENTRY, RECENTS_KEY } from "./regions";
import { Region } from "../types";

function label(region: Region): string {
  return region.id === AUTO_REGION_ENTRY.id ? "Automatic" : region.name;
}

/**
 * The PIA daemon goes inactive when the desktop app isn't running, and refuses
 * to connect until either the app is launched or background mode is on. Turning
 * background mode on is the quiet fix — it lets Raycast connect without ever
 * opening (and focusing) the PIA window.
 */
async function connectWithDaemonFallback(cliPath: string): Promise<void> {
  try {
    await connect(cliPath);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/background mode|start the PIA client/i.test(message)) throw e;
    await enableBackgroundMode(cliPath);
    await connect(cliPath);
  }
}

export async function rememberRecent(region: Region): Promise<void> {
  if (region.id === AUTO_REGION_ENTRY.id) return;
  const raw = await LocalStorage.getItem<string>(RECENTS_KEY);
  let list: Region[] = [];
  try {
    list = raw ? (JSON.parse(raw) as Region[]) : [];
  } catch {
    list = [];
  }
  const next = [region, ...list.filter((r) => r.id !== region.id)].slice(0, 5);
  await LocalStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}

export async function loadRecents(): Promise<Region[]> {
  const raw = await LocalStorage.getItem<string>(RECENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Region[];
  } catch {
    return [];
  }
}

/**
 * Select a region and connect. `piactl connect` also re-applies settings on an
 * already-active tunnel, so switching regions needs no explicit disconnect.
 */
export async function connectToRegion(region: Region): Promise<void> {
  await closeMainWindow({ clearRootSearch: true });

  const setup = await detectSetup();
  if (setup.stage !== "ready" || !setup.cliPath) {
    if (setup.appPath) void open(setup.appPath);
    await showHUD("PIA isn't ready — opening the app");
    return;
  }

  try {
    await rememberRecent(region);
    const wasConnected =
      (await readConnectionState(setup.cliPath)) === "Connected";
    await setRegion(setup.cliPath, region.id);
    await showHUD(`Connecting to ${label(region)}…`);
    await connectWithDaemonFallback(setup.cliPath);

    // Switching regions restarts an existing tunnel, so the pre-switch
    // "Connected" reading must not be accepted as success.
    const state = wasConnected
      ? await waitForReconnect(setup.cliPath)
      : await waitForState(setup.cliPath, (s) => s === "Connected");
    if (state !== "Connected") {
      await showHUD(`Could not connect (${state})`);
      return;
    }

    // Report the tunnel address, not `pubip` — that one still shows the user's
    // real ISP address while connected.
    const status = await readStatus(setup.cliPath);
    await showHUD(
      status.vpnIp
        ? `Connected — ${label(region)} · ${status.vpnIp}`
        : `Connected — ${label(region)}`,
    );
  } catch (e) {
    await showHUD(
      `Connect failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export async function toggleVpn(): Promise<void> {
  await closeMainWindow({ clearRootSearch: true });

  const setup = await detectSetup();
  if (setup.stage !== "ready" || !setup.cliPath) {
    if (setup.appPath) void open(setup.appPath);
    await showHUD("PIA isn't ready — opening the app");
    return;
  }

  try {
    const state = await readConnectionState(setup.cliPath);
    if (isActive(state)) {
      await disconnect(setup.cliPath);
      const next = await waitForState(
        setup.cliPath,
        (s) => s === "Disconnected",
        { attempts: 20 },
      );
      await showHUD(
        next === "Disconnected"
          ? "PIA disconnected"
          : `Could not disconnect (${next})`,
      );
      return;
    }

    await showHUD("Connecting…");
    await connectWithDaemonFallback(setup.cliPath);
    const next = await waitForState(setup.cliPath, (s) => s === "Connected");
    if (next !== "Connected") {
      await showHUD(`Could not connect (${next})`);
      return;
    }
    const status = await readStatus(setup.cliPath);
    await showHUD(
      status.vpnIp ? `Connected — ${status.vpnIp}` : "PIA connected",
    );
  } catch (e) {
    await showHUD(`Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
