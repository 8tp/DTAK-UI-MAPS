// MapPluginsScreen.jsx
// React screen derived from Figma frame 128:4016 (TAK Screens) via figma MCP export.
// Tailwind-only styling to mirror the dark mission control palette used in the frame.

import React from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Crosshair,
  Eye,
  EyeOff,
  MessageCircle,
  ShieldAlert,
  Users,
} from "lucide-react";

const mapCollections = [
  {
    id: "ny",
    name: "New York",
    image: "https://placehold.co/400x400/101828/1b2337?text=NYC",
    selected: true,
  },
  {
    id: "chi",
    name: "Chicago",
    image: "https://placehold.co/400x400/101828/1b2337?text=CHI",
    selected: false,
  },
  {
    id: "mgm",
    name: "Montgomery",
    image: "https://placehold.co/400x400/101828/1b2337?text=MGM",
    selected: false,
  },
];

const pluginQuickActions = [
  {
    id: "chat",
    label: "CHAT",
    icon: MessageCircle,
    active: true,
  },
  {
    id: "persco",
    label: "PERSCO",
    icon: Users,
    active: false,
  },
  {
    id: "killbox",
    label: "KILLBOX",
    icon: Crosshair,
    active: false,
  },
];

const pluginStatusTiles = [
  {
    id: "visibility",
    label: "Visibility overlay",
    icon: Eye,
    tone: "neutral",
    description: "Partial",
  },
  {
    id: "threat",
    label: "Threat watch",
    icon: ShieldAlert,
    tone: "alert",
    description: "Live",
  },
  {
    id: "stealth",
    label: "Low light",
    icon: EyeOff,
    tone: "inactive",
    description: "Dim",
  },
];

const toneStyles = {
  neutral: {
    badge: "bg-slate-800 text-slate-200",
    border: "border-slate-700",
  },
  alert: {
    badge: "bg-rose-500/20 text-rose-300",
    border: "border-rose-500/40",
  },
  inactive: {
    badge: "bg-slate-900 text-slate-400",
    border: "border-slate-800",
  },
};

export default function MapPluginsScreen() {
  return (
    <div className="min-h-screen w-full bg-black py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-slate-900 bg-slate-950/80 p-6 shadow-2xl">
        <DeviceMapPreview />
        <BottomSheet />
      </div>
    </div>
  );
}

function DeviceMapPreview() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900">
      <img
        src="https://placehold.co/600x420/122031/1e2a3f?text=Mission+Sector"
        alt="Mission sector overview"
        className="h-64 w-full object-cover"
      />
      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
        <button
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/70 text-slate-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          aria-label="Mission roster"
        >
          <Users className="h-6 w-6" />
        </button>
        <button
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/70 text-slate-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          aria-label="Alerts"
        >
          <Bell className="h-6 w-6" />
          <span className="absolute right-2 top-2 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </button>
      </div>
    </div>
  );
}

function BottomSheet() {
  return (
    <div className="-mt-10 rounded-3xl border border-slate-900 bg-slate-950/95 p-6 shadow-xl">
      <section className="space-y-5">
        <SectionHeader title="My maps" />
        <MapCollectionGrid />
      </section>

      <section className="mt-8 space-y-5">
        <SectionHeader title="Plugins" />
        <PluginQuickActionGrid />
        <PluginStatusRow />
      </section>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h2>
      <ViewMorePill />
    </div>
  );
}

function ViewMorePill() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
    >
      View more
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}

function MapCollectionGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {mapCollections.map((collection) => (
        <article
          key={collection.id}
          className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/80 p-2 shadow-lg"
        >
          <div className="relative w-full overflow-hidden rounded-xl bg-slate-800">
            <img
              src={collection.image}
              alt={`${collection.name} map preview`}
              className="h-24 w-full object-cover"
            />
            {collection.selected ? (
              <span className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-emerald-950">
                <Check className="mr-1 h-3 w-3" />
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-center text-sm font-medium text-slate-100">
            {collection.name}
          </p>
        </article>
      ))}
    </div>
  );
}

function PluginQuickActionGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {pluginQuickActions.map((action) => {
        const Icon = action.icon;
        const baseClasses = action.active
          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
          : "border-slate-800 bg-slate-900 text-slate-300";
        return (
          <button
            key={action.id}
            type="button"
            className={`${baseClasses} flex flex-col items-center gap-2 rounded-2xl border px-4 py-4 text-xs font-semibold uppercase tracking-wider transition hover:border-emerald-400/60 hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40`}
          >
            <Icon className="h-5 w-5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

function PluginStatusRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {pluginStatusTiles.map((tile) => {
        const styles = toneStyles[tile.tone];
        const Icon = tile.icon;
        return (
          <div
            key={tile.id}
            className={`rounded-2xl border ${styles.border} bg-slate-900/80 p-4 shadow-md`}
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${styles.badge}`}>
                <Icon className="h-4 w-4" />
                {tile.description}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-100">{tile.label}</p>
            <p className="mt-1 text-xs text-slate-400">
              Stable state synced from TAK mesh and server feeds.
            </p>
          </div>
        );
      })}
    </div>
  );
}
