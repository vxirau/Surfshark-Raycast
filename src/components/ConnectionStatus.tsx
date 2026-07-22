import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  open,
  Keyboard,
} from "@raycast/api";
import { flagAsset } from "../lib/regions";
import { PIA_APP_PATH } from "../lib/pia";
import { ConnectionState, Region, VpnStatus } from "../types";

interface Props {
  status: VpnStatus;
  region?: Region;
  appPath?: string;
  onToggle: () => void;
}

function stateLabel(state: ConnectionState): {
  title: string;
  color: Color;
  icon: Icon;
} {
  switch (state) {
    case "Connected":
      return {
        title: "Connected & secure",
        color: Color.Green,
        icon: Icon.CheckCircle,
      };
    case "Connecting":
    case "Reconnecting":
    case "DisconnectingToReconnect":
      return {
        title: "Connecting…",
        color: Color.Yellow,
        icon: Icon.Hourglass,
      };
    case "Disconnecting":
      return {
        title: "Disconnecting…",
        color: Color.Yellow,
        icon: Icon.Hourglass,
      };
    case "Interrupted":
      return {
        title: "Connection interrupted",
        color: Color.Orange,
        icon: Icon.ExclamationMark,
      };
    default:
      return { title: "Not connected", color: Color.Red, icon: Icon.Shield };
  }
}

/** A numeric value means a port is actually forwarded; words are status only. */
function forwardedPort(value: string | undefined): string | undefined {
  return value && /^\d+$/.test(value) ? value : undefined;
}

export function ConnectionStatus({ status, region, appPath, onToggle }: Props) {
  const label = stateLabel(status.state);
  const isConnected = status.state === "Connected";
  const regionName = region?.name ?? status.regionId;

  const icon =
    isConnected && region?.countryCode
      ? { source: flagAsset(region.countryCode) }
      : { source: label.icon, tintColor: label.color };

  const title = isConnected ? regionName : label.title;
  const subtitle = isConnected
    ? [
        status.protocol === "wireguard" ? "WireGuard" : status.protocol,
        region?.country,
      ]
        .filter(Boolean)
        .join("  ·  ")
    : `Selected: ${regionName}`;

  // piactl's `pubip` is the ISP-assigned address and does NOT change while the
  // tunnel is up, so surfacing it as the connected IP would show the user's
  // real home address. `vpnip` is the tunnel address — the safe one to show.
  const accessories: List.Item.Accessory[] = [];
  if (isConnected && status.vpnIp) {
    accessories.push({
      icon: Icon.Globe,
      text: status.vpnIp,
      tooltip: "VPN IP",
    });
  } else if (!isConnected && status.publicIp) {
    accessories.push({
      icon: { source: Icon.Eye, tintColor: Color.Orange },
      text: status.publicIp,
      tooltip: "Your unprotected public IP",
    });
  }
  const port = forwardedPort(status.portForward);
  if (port) {
    accessories.push({
      tag: { value: `Port ${port}`, color: Color.Blue },
      tooltip: "Forwarded port",
    });
  }
  if (!isConnected) {
    accessories.push({ tag: { value: label.title, color: label.color } });
  }

  return (
    <List.Item
      icon={icon}
      title={title}
      subtitle={subtitle}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action
            title={isConnected ? "Disconnect" : "Connect"}
            icon={isConnected ? Icon.XMarkCircle : Icon.Bolt}
            onAction={onToggle}
          />
          {isConnected && status.vpnIp && (
            <Action.CopyToClipboard
              title="Copy VPN IP"
              content={status.vpnIp}
              shortcut={{ modifiers: ["cmd"], key: "i" }}
            />
          )}
          {port && (
            <Action.CopyToClipboard
              title="Copy Forwarded Port"
              content={port}
              shortcut={{ modifiers: ["cmd", "shift"], key: "i" }}
            />
          )}
          <Action
            title="Open Pia App"
            icon={Icon.AppWindow}
            shortcut={Keyboard.Shortcut.Common.Open}
            onAction={() => open(appPath ?? PIA_APP_PATH)}
          />
        </ActionPanel>
      }
    />
  );
}
