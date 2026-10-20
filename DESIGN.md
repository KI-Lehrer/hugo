---
name: Hugo
description: Animated personal assistant with futuristic and school chalkboard appearances
colors:
  background: "#070b17"
  surface: "#0e1527"
  ink: "#e8f3ff"
  muted: "#9cacc8"
  divider: "#233049"
  primary: "#6ce8ed"
  working: "#b4a3ff"
  speaking: "#7dffdf"
  error: "#ffb2bb"
  board-background: "#193e34"
  board-surface: "#214a3f"
  board-ink: "#f5f1dd"
  board-muted: "#cfddca"
  board-divider: "#668373"
  board-accent: "#f4d17c"
  board-wood: "#94704b"
  note-yellow: "#f4df89"
  note-yellow-ink: "#3e361b"
  board-clock-ink: "#493d1d"
  note-pink: "#eab9ab"
  note-pink-ink: "#492c28"
  note-blue: "#bad5dc"
  note-blue-ink: "#203e48"
  note-green: "#ccdbac"
  note-green-ink: "#344321"
typography:
  display:
    fontFamily: "Hugo Display, Futura, sans-serif"
    fontSize: "clamp(22px, 2.4vw, 31px)"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: "Avenir Next, -apple-system, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  board-display:
    fontFamily: "Hugo Chalk, Georgia, serif"
    fontSize: "clamp(22px, 2vw, 32px)"
    fontWeight: 400
    lineHeight: 1.5
  board-note-title:
    fontFamily: "Hugo Notes, cursive"
    fontSize: "17px"
    fontWeight: 600
rounded:
  composer: "14px"
  button: "9px"
  board-composer: "9px"
  board-note: "2px 2px 16px 2px"
---

## Overview
Hugo offers two user-requested visual worlds through the native Hugo-Ansicht selector in the topbar: Futuristisch and Wandtafel. Futuristisch remains the default and retains its animated abstract assistant. Wandtafel presents a green school chalkboard, wood frame, coloured Post-it widgets and an expressive board sponge. The previous warm reading-room world remains retired.

The selector sets body[data-appearance] to future or board and persists locally under hugo.appearance. Switching appearance preserves conversation, preferences and saved draggable widget positions.

## Colors
Blue-black surfaces, cyan controls, violet work/queue state, mint speaking state. Quiet text remains high contrast. Ambient blue/violet light and emitted light around the assistant are intentional expressions of the user's requested futurism. They do not imply measured energy, audio amplitude or system telemetry.

Wandtafel uses chalk green surfaces, pale chalk text and a warm yellow action accent inside a wooden frame. Yellow clock, pink teaching-source, blue calendar and green weather notes each use their matching dark ink token. Settings popovers use pale paper and dark text.

## Typography
Local Futura display lettering via Hugo Display; Avenir Next/system sans for operational copy. Body 14px, answers 14px, metadata at least 12px, welcome heading 22–31px. Uppercase and expanded tracking apply to the Hugo identity only. All Hugo-owned UI text has a minimum size of 12px.

Wandtafel headings use Hugo Chalk, locally mapped to Chalkduster with Georgia/serif fallback. Note titles and content use Hugo Notes, locally mapped to ChalkboardSE-Regular/Chalkboard; operational text keeps Avenir Next/system sans. Chalk lettering is limited to identity and headings so conversations and controls remain readable.

## Layout
A viewport-filling desktop grid has a collapsible sidebar, top date/audio controls, centred assistant sculpture, conversation, optional source inspector and anchored composer. Initial setup is collapsed in a native details element. Active desktop conversations use a compact sculpture to preserve reading space.

Below 1250px, widgets follow the chat and composer in normal document flow: two grid columns, then one column at 600px and below. At 1250px and above, floating widgets occupy collision-safe side lanes. Reserve the central conversation and assistant area, the header, the composer and the full visible notice height; notes must not overlap each other or these areas. If the available viewport height cannot accommodate all widgets, use the same normal-flow grid. Notices sit above widgets and reserve vertical space in the placement area.

Both appearances share the responsive widget layout, conversation, composer and settings. Wandtafel reserves space for its wood frame; its notes follow the same 1250px floating/grid threshold, and at 600px and below the frame and topbar controls become more compact. Saved desktop note positions are retained across theme changes.

At 1249px and below, the sidebar becomes a fixed drawer, initially collapsed without overwriting the stored desktop preference. Its width leaves an outside backdrop available to dismiss it. The menu control remains in the topbar. Sidebar bottom labels stay on one line, with the read-only scope on its own row. For coarse pointers, topbar controls wrap to preserve access at narrow widths.

## Elevation & Depth
Tonal layering and single outlines for functional surfaces. Radial light, gently shifting background fields and orbit geometry belong to the abstract assistant; no floating glass cards or fictional metrics.

Wandtafel uses tactile depth: an inset wooden frame, paper-note drop shadows, translucent tape and a folded note corner. A dragged note straightens and gains a larger shadow. The sponge has layered foam and felt with a soft grounding shadow.

## Shapes
Round abstract core and elliptical orbit paths contrast with familiar rounded rectangular controls. Sources and chat retain stable text layout while decorative elements move.

Wandtafel replaces orbit geometry with a rounded rectangular sponge. Notes have mostly square corners with one curled corner and small alternating rotations. Functional controls retain familiar rounded rectangles; the board composer uses the board-composer radius.

## Components
Live Swiss digital clock with weekday/date, animated second changes and subtle colon pulse in Futuristisch. Wandtafel seconds and colon use the dark board-clock-ink token at opacity 1 on the yellow note, with a measured contrast ratio of 8.01:1. Board digit changes animate transform only; seconds and colon never fade or pulse. Additional wireframe cube/prism and orbiting satellites extend the authored assistant geometry, with no fictional telemetry. Sidebar visibility persists locally; its toggle stays accessible in the main header. Clock and decoration stop motion in hidden tabs; reduced-motion and the pause control apply.

Three rotating orbit tracks, breathing core, drift particles and background light, animated composer accent, subtle button shimmer and hover/press feedback. Actual listening, queued/working and speaking states change orbit pace/colour and wave motion. Speaking starts only with real audio playback, stops when playback stops. Decorative idle movement is not a speaking indication.

The browser favicon is a self-contained inline SVG: a turquoise H on a rounded petrol square. A single plus control in the main header starts a new chat; do not add a second reset control elsewhere.

### Sidebar drawer

On small screens, the sidebar uses dialog semantics (role="dialog" and aria-modal="true") while open. Main content and widgets become inert, focus moves to its close button, Tab and Shift+Tab stay within the drawer, and Escape, the close button or the outside backdrop dismiss it. Closing restores focus to the invoking control. Sidebar visibility continues to persist under hugo.sidebarHidden; responsive initial collapse does not overwrite that preference.

### Freely placed widgets and speech sphere

In floating desktop mode, the dashboard is a pointer-transparent canvas with four compact widgets (clock, teaching sources, next calendar entries, weather). Their header handles move them within the collision-safe side lanes. Save normalised positions locally and resolve placements against other widgets and the reserved central content area. Arrow keys and corner buttons provide alternatives to dragging; Shift gives finer steps. These controls and saved preferences remain unchanged. Grid mode removes floating transforms without clearing saved desktop positions.

Only essential readings and primary actions appear on widget faces. Each small gear opens a native HTML popover for settings, details and placement. Widget popover headings follow “Title – Einstellungen”: Uhr, Unterricht, Nächste Termine and Wetter. The weather face action “Standort festlegen” directly opens its settings popover; opening it never requests geolocation. Location access requires the separate explicit action inside settings. The topbar gear holds general settings, voice preferences and setup. Native focus/light-dismiss behaviour and labelled controls remain intact.

In Futuristisch, during actual audio playback the centre sculpture becomes a luminous three-dimensional sphere, with layered surface rings and expanding pulses. It is a playback-state illustration, not measured audio amplitude. The sphere is centred in the main view; completion, stop, wait and error return it to the corresponding non-speaking state. Additional comet traces extend the requested futuristic world. Respect paused/reduced motion; no microphone activation follows a voice preview.


### Calendar and optional Google embed

The widget shows Hugo's own event list from /api/calendar. Its only event source is the local ICS import. The visible range is today in Swiss time through the following six days. Provide explicit loading, unconfigured, empty and error states; the error state offers retry. Explain the local import requirement without promising Google OAuth synchronisation. Preserve the saved Google calendar URL.

An optional Google iframe appears only inside calendar settings after enabling its checkbox; persist that choice under hugo.calendarEmbed. The Futuristisch embed has a dark blue frame, muted cyan outline and colour filter. Originalfarben restores the remote rendering and persists locally; forced-colour mode disables the filter. This filter guidance applies only to the optional remote iframe. Hugo's native event list adapts its text and metadata to the active theme's palette.

### Accessible feedback and controls

The conversation uses role="log" with polite announcements. Notices use role="alert" with atomic announcements. Playback, listening and work status use polite, atomic announcements. Keep state feedback meaningful without announcing decorative movement.

Hugo-owned buttons and links have minimum target dimensions of 24px by 24px. The coarse-pointer CSS rule raises both dimensions to at least 44px. Preserve visible focus and readable labels in both appearances.

### Wandtafel and talking sponge

The native appearance selector remains available in both themes. Wandtafel hides futuristic ambient light, holographic geometry, orb and speech wave, and shows the sponge instead. Notes retain their drag handles, keyboard placement, corner controls and settings popovers. The native calendar list uses the blue note palette. Only the optional Google iframe in settings uses a light note frame and restrained sepia/saturation adaptation; Originalfarben restores that remote rendering.

The sponge gently floats and blinks at rest, tilts when listening and sways while queued or working. Only actual playback drives the speaking bounce, animated mouth and chalk dust; the illustration does not measure speech amplitude or lip-sync phonemes. Paused/reduced motion and hidden-tab motion handling still apply. Reduced motion retains a static open mouth as the speaking cue.

## Do's and Don'ts
Keep controls and document text steady and readable. Pause motion with the visible topbar control; respect reduced-motion OS preferences. All decorative shapes are aria-hidden. Preserve authentication, read-only file scope, native voice selection and plain chat independently of visual states.

Keep both appearances available. Apply chalkboard materials only within the board appearance; preserve futuristic tokens and geometry in future. Do not clear saved widget positions on a theme change or use the sponge animation as evidence of microphone activation.

Tasks 4–14 are complete within the reviewed scope. Tasks 9–14 passed the ship review, 23 tests and checks in both themes at five widths. Real chat and reset, the weather settings popup, and native audio playback were exercised; speaking followed actual audio while microphone state remained false. Native VoiceOver and a real coarse-pointer device remain untested; this is not a whole-product WCAG compliance claim.

The implementation remains plain formatted HTML, CSS and JavaScript, without a framework or added runtime dependency. Browser ES modules separate API access, UI, voice and widgets, with shared state and widget geometry; app.js orchestrates them. Centralised JSON and audio requests use X-Hugo-Token, matching server authentication; static routing serves all modules. Preserve existing storage keys and cookie names when extending these modules. The calendar event list remains sourced only from the local ICS import.
