# OBS

The Fluxta plugin that drives OBS Studio. It turns what happens in OBS (a Scene
switch, the Stream going live, a Source shown, an Input muted, a Filter toggled)
into Fluxta Events and Value Sources, and exposes Actions that act back on OBS
over obs-websocket.

Fluxta's own words — Action, Event, Event Source, Event Field, Run Variable,
Value Source, Options Source, Plugin Editor, Action Editor, Plugin settings —
mean what Fluxta's
[Terminology](https://fluxta.app/docs/plugins/getting-started/terminology)
says and are not redefined here. OBS's nouns below are used as OBS itself uses
them, narrowed to what this plugin does with them.

## Language

### Connections

**Connection**:
One OBS Studio instance the plugin drives over obs-websocket: a name, a host, a
port and an optional password, under an id the plugin chooses. Configured in
the Plugin Editor, persisted in Plugin settings, and reported to Fluxta with
`setConnections`, so it shows in Fluxta's connection indicator (see
[Connections](https://fluxta.app/docs/plugins/guides/connections)). Every
Action, Value Source and Event names the Connection it belongs to; a setting
that names none means the sole configured one.
_Avoid_: server, instance, socket, session (an `ObsSession` is the code that
keeps one Connection's link alive).

**Connection Status**:
A Connection's live link state: `connecting`, `connected`, or `error` with a
message. Sitting in `connecting` while OBS is closed is expected, not a fault:
the plugin retries forever with a capped, doubling backoff. Reported by the
`connection-status-changed` Event and in the Plugin Editor.
_Avoid_: online/offline, health.

### Scenes and sources

**Scene**:
A named composition in OBS, made of Scene Items. The **Current Scene** is the
program Scene — the one on air; Set Current Scene switches it and
`scene-changed` reports it. This plugin does not use Studio Mode's preview
Scene.
_Avoid_: layout, view, page.

**Source**:
OBS's name for anything that renders or plays: every Input is a Source, and so
are Scenes and Groups. The plugin addresses a Source by its name. A Source is
shown or hidden only through a Scene Item, and carries its own Filters.
_Avoid_: layer, element, item.

**Input**:
A Source that produces content of its own — a camera, a browser page, a
microphone, a media file — and exists on the Connection whether or not any
Scene places it. Mute, volume and the per-kind settings (a Browser Source's URL,
a Text Source's text, a Color Source's color, a Media Input's file) act on an
Input. An Input's OBS kind id (`browser_source`, `ffmpeg_source` …) is what
narrows a picker to the Inputs an Action can act on.
_Avoid_: device, audio source (an Input need not have audio).

**Scene Item**:
One placement of a Source inside a Scene or a Group. Visibility belongs to the
Scene Item, not the Source: the same Source can be visible in one Scene and
hidden in another. OBS identifies a Scene Item by a numeric id that means
something only inside its container; the plugin never surfaces it — settings
and Events name the Scene and the Source, and the id is resolved at the moment
of the call.
_Avoid_: layer, Source (when the placement is meant).

**Group**:
A Source that bundles Scene Items inside a Scene. It has no visibility state of
its own here: Set Group's Sources Visibility acts on every Scene Item in it,
and its toggle reads the first one to decide. A walk over a Scene's items
descends Group by Group, because OBS lists only a container's direct children.
_Avoid_: folder, nested scene.

**Filter**:
An effect attached to a Source and identified by its name on that Source;
enabled or disabled. A **Source Filter** sits on an Input, a **Scene Filter**
on a Scene. OBS reports both through one event; the plugin tells them apart and
fires `source-filter-enabled-changed` or `scene-filter-enabled-changed`.
_Avoid_: effect, plugin.

**Media Input**:
An Input that plays or shows a file — a Media Source (`ffmpeg_source`) or an
Image Source (`image_source`). Set Media State drives its playback; Set
Media/Image Source File swaps the file it points at. Other file-backed kinds
are refused rather than guessed at.
_Avoid_: video, clip.

### Outputs

**Stream**:
OBS's live output to a streaming service — started, stopped, and reported by
`stream-state-changed`.
_Avoid_: broadcast, live.

**Recording**:
OBS's output to a local file — started, stopped, paused and resumed, and
reported by `record-state-changed`. A paused Recording is still a Recording.
_Avoid_: record (as a noun), capture.

### Settings

**Mode**:
How a show/hide or enable/disable Action decides its target state: `show` /
`hide` (or `enable` / `disable`) set it outright; `toggle` reads the current
state when the Action runs and flips it. Media Actions have their own transport
modes (`play`, `pause`, `stop`, `restart`, `next`, `previous`).
_Avoid_: action type, operation.
