import { state } from "./state.js";
import { api } from "./api.js";
import { $, notice } from "./ui.js";
import { HugoWidgetLayout } from "./widget-layout.js";

export function createWidgets({ send }) {
  const stamp = (value) =>
    new Date(value).toLocaleString("de-CH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  async function loadDashboard(loadForecast = false) {
    const result = await api("/api/integrations");
    $("#planning-connections").replaceChildren();
    for (const source of result.sources) {
      const row = document.createElement("div");
      row.className = "planning-connection";
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `${source.name} ↗`;
      const status = document.createElement("small");
      status.textContent = source.snapshot
        ? `Auszug vom ${stamp(source.snapshot.capturedAt)}${source.snapshot.weekStart ? " · Woche ab " + source.snapshot.weekStart : ""}`
        : "Noch kein Auszug";
      row.append(link, status);
      if (source.snapshot) {
        const scope = document.createElement("small");
        scope.textContent = source.snapshot.scope;
        row.append(scope);
        const remove = document.createElement("button");
        remove.className = "text-button";
        remove.textContent = "Auszug entfernen";
        remove.onclick = async () => {
          try {
            await api("/api/planning/source/" + source.id, {
              method: "DELETE",
            });
            await loadDashboard();
          } catch (error) {
            notice(error.message, true);
          }
        };
        row.append(remove);
      }
      $("#planning-connections").append(row);
    }
    const ready = result.sources.filter((source) => source.snapshot);
    const stale = ready.some(
      (source) =>
        Date.now() - Date.parse(source.snapshot.capturedAt) > 86400000,
    );
    $("#planning-summary").textContent = ready.length
      ? `${ready.length} von 2 Quellen · ${stale ? "bitte aktualisieren" : "Auszüge bereit"}`
      : "Noch keine Planung übernommen";
    $("#planning-week-label").textContent =
      $("#week-number").textContent + " · " + $("#week-range").textContent;
    $("#weather-city").value = result.settings.weatherCity || "";
    if (!$("#planning-week").value) {
      const now = new Date();
      const local = new Date(
        now.toLocaleString("en-US", { timeZone: "Europe/Zurich" }),
      );
      local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
      $("#planning-week").value =
        `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
    }
    renderCalendarFrame(result.settings.calendarUrl);
    await loadCalendar();
    if (
      loadForecast &&
      (result.settings.weatherCity || result.settings.weatherCoords)
    )
      loadWeather();
  }
  $("#fullscreen").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      notice("Vollbild ist in diesem Browser nicht verfügbar.");
    }
  };
  document.addEventListener("fullscreenchange", () => {
    $("#fullscreen").textContent = document.fullscreenElement
      ? "Vollbild beenden"
      : "Vollbild";
  });
  $("#widgets-toggle").onclick = () => {
    const closed = document.body.classList.toggle("widgets-hidden");
    $("#widgets-toggle").setAttribute("aria-expanded", String(!closed));
  };
  $("#summarise-week").onclick = () => {
    $("#chat-mode").value = "planning";
    send(
      "Fasse meine Unterrichtsplanung für die laufende Woche zusammen. Gliedere nach Wochentagen. Unterscheide bestätigte Wochenplanung, sichtbare LearningView-Materialien und offene Angaben.",
    );
  };
  $("#planning-import").onsubmit = async (event) => {
    event.preventDefault();
    try {
      await api("/api/planning/import", {
        method: "POST",
        body: JSON.stringify({
          source: $("#planning-source").value,
          weekStart: $("#planning-week").value,
          text: $("#planning-text").value,
        }),
      });
      $("#planning-text").value = "";
      await loadDashboard();
      notice(
        "Planungsauszug übernommen. Hugo kann ihn jetzt für die Wochenplanung lesen.",
      );
    } catch (error) {
      notice(error.message, true);
    }
  };
  $("#pair-browser").onclick = async () => {
    try {
      const result = await api("/api/integrations/browser-key");
      $("#browser-key").value = result.key;
      $("#pair-label").hidden = false;
      $("#browser-key").select();
    } catch (error) {
      notice(error.message, true);
    }
  };
  let calendarLoadTimer;
  let calendarFrameUrl = "";
  let calendarRequest = 0;
  let showCalendarEmbed = true;
  try {
    showCalendarEmbed =
      localStorage.getItem("hugo.calendarDisplay") !== "import";
  } catch {}
  $("#calendar-embed-toggle").checked = showCalendarEmbed;

  function renderCalendarFrame(url) {
    calendarFrameUrl = url || "";
    const frame = $("#calendar-frame");
    const visible = showCalendarEmbed && !!calendarFrameUrl;
    frame.hidden = !visible;
    $("#calendar-empty").hidden = visible;
    $("#calendar-events").hidden = visible;
    if (visible) $("#calendar-retry").hidden = true;
    $("#calendar-reload").hidden = !visible;
    clearTimeout(calendarLoadTimer);
    if (visible) {
      if (frame.dataset.url !== calendarFrameUrl) {
        frame.dataset.url = calendarFrameUrl;
        frame.src = calendarFrameUrl;
      }
    } else {
      delete frame.dataset.url;
      frame.removeAttribute("src");
    }
  }
  $("#calendar-embed-toggle").onchange = () => {
    showCalendarEmbed = $("#calendar-embed-toggle").checked;
    try {
      localStorage.setItem(
        "hugo.calendarDisplay",
        showCalendarEmbed ? "google" : "import",
      );
    } catch {}
    renderCalendarFrame(calendarFrameUrl);
    loadCalendar();
    resizeWidgets();
  };
  $("#calendar-reload").onclick = () => {
    if (showCalendarEmbed && calendarFrameUrl)
      $("#calendar-frame").src = calendarFrameUrl;
  };
  $("#calendar-form").onsubmit = async (event) => {
    event.preventDefault();
    const id = $("#calendar-id").value.trim();
    if (!id) return;
    const url = new URL("https://calendar.google.com/calendar/embed");
    url.search = new URLSearchParams({
      src: id,
      ctz: "Europe/Zurich",
      mode: "AGENDA",
      showTitle: "0",
      showPrint: "0",
      showCalendars: "0",
      showTz: "0",
    });
    try {
      await api("/api/integrations/settings", {
        method: "POST",
        body: JSON.stringify({ calendarUrl: url.href }),
      });
      showCalendarEmbed = true;
      $("#calendar-embed-toggle").checked = true;
      try {
        localStorage.setItem("hugo.calendarDisplay", "google");
      } catch {}
      renderCalendarFrame(url.href);
      await loadCalendar();
      resizeWidgets();
      notice("Google Kalender wird jetzt direkt im Widget angezeigt.");
    } catch (error) {
      notice(error.message, true);
    }
  };
  $("#calendar-remove").onclick = async () => {
    try {
      await api("/api/integrations/settings", {
        method: "POST",
        body: JSON.stringify({ calendarUrl: "" }),
      });
      renderCalendarFrame("");
      await loadCalendar();
    } catch (error) {
      notice(error.message, true);
    }
  };

  async function loadCalendar() {
    const request = ++calendarRequest;
    if (showCalendarEmbed && calendarFrameUrl) {
      $("#calendar-empty").hidden = true;
      $("#calendar-events").hidden = true;
      $("#calendar-retry").hidden = true;
      $("#calendar-status").textContent =
        "Google Kalender verbunden · kein Dateiimport nötig.";
      return;
    }
    const status = $("#calendar-empty");
    const list = $("#calendar-events");
    status.hidden = false;
    list.hidden = false;
    status.textContent = "Termine werden geladen …";
    list.setAttribute("aria-busy", "true");
    $("#calendar-retry").hidden = true;
    list.replaceChildren();
    try {
      const result = await api("/api/calendar");
      if (request !== calendarRequest) return;
      const configured = result.configured ?? !!result.importedAt;
      if (!configured) {
        status.textContent =
          "Google Kalender im Zahnrad einmalig verbinden oder alternativ eine Kalenderdatei importieren.";
        $("#calendar-status").textContent =
          "Google Kalender einmalig über die Kalender-ID verbinden; ein Dateiimport ist optional.";
        return;
      }
      $("#calendar-status").textContent =
        `Dateiimport ${stamp(result.importedAt)} · ${result.events.length} Termine in den nächsten 7 Tagen`;
      status.textContent = result.events.length
        ? ""
        : "Keine Termine in den nächsten 7 Tagen";
      status.hidden = result.events.length > 0;
      const dateFormat = new Intl.DateTimeFormat("de-CH", {
        timeZone: "Europe/Zurich",
        weekday: "short",
        day: "numeric",
        month: "numeric",
      });
      for (const event of result.events) {
        const item = document.createElement("li");
        const title = document.createElement("strong");
        const time = document.createElement("small");
        title.textContent = event.title;
        const date = dateFormat.format(new Date(event.date + "T12:00:00Z"));
        time.textContent = `${date} · ${event.allDay ? "Ganztägig" : event.time}`;
        item.append(time, title);
        list.append(item);
      }
      for (const warning of result.warnings || []) {
        const item = document.createElement("li");
        item.textContent = warning;
        list.append(item);
      }
    } catch {
      if (request !== calendarRequest) return;
      status.hidden = false;
      list.hidden = false;
      status.textContent = "Termine konnten nicht geladen werden.";
      $("#calendar-retry").hidden = false;
    } finally {
      if (request === calendarRequest) {
        list.setAttribute("aria-busy", "false");
        resizeWidgets();
      }
    }
  }
  $("#calendar-retry").onclick = loadCalendar;
  $("#calendar-file").onchange = async () => {
    const file = $("#calendar-file").files[0];
    if (!file) return;
    try {
      if (file.size > 1800000)
        throw new Error("Die Kalenderdatei darf maximal 1,8 MB gross sein.");
      await api("/api/calendar/import", {
        method: "POST",
        body: JSON.stringify({ text: await file.text() }),
      });
      await loadCalendar();
      notice(
        "Kalenderdatei übernommen. Die Terminliste zeigt die nächsten 7 Tage.",
      );
    } catch (error) {
      notice(error.message, true);
    } finally {
      $("#calendar-file").value = "";
    }
  };
  function weatherLabel(code) {
    if (code === 0) return "Klar";
    if (code <= 3) return "Bewölkt";
    if (code <= 48) return "Nebel";
    if (code <= 67) return "Regen";
    if (code <= 77) return "Schnee";
    if (code <= 82) return "Regenschauer";
    if (code <= 86) return "Schneeschauer";
    return "Gewitter";
  }
  async function loadWeather(coords) {
    $("#weather-content").textContent = "Wetter wird geladen …";
    try {
      const result = await api(
        "/api/weather",
        coords ? { method: "POST", body: JSON.stringify(coords) } : {},
      );
      $("#weather-place").textContent = result.place;
      const temp = document.createElement("strong");
      temp.className = "weather-temperature";
      temp.textContent = `${Math.round(result.current.temperature_2m)}°`;
      const conditions = document.createElement("p");
      conditions.textContent = `${weatherLabel(result.current.weather_code)} · gefühlt ${Math.round(result.current.apparent_temperature)}°`;
      const daily = document.createElement("div");
      daily.className = "weather-days";
      for (let i = 0; i < result.daily.time.length; i++) {
        const day = document.createElement("span");
        day.textContent = `${new Date(result.daily.time[i] + "T12:00:00").toLocaleDateString("de-CH", { weekday: "short" })} ${Math.round(result.daily.temperature_2m_min[i])}–${Math.round(result.daily.temperature_2m_max[i])}°`;
        daily.append(day);
      }
      const updated = document.createElement("small");
      updated.textContent = `Wetterstand ${result.current.time.replace("T", " ")} · Modellprognose`;
      const range = document.createElement("small");
      range.textContent = `Heute ${Math.round(result.daily.temperature_2m_min[0])}–${Math.round(result.daily.temperature_2m_max[0])}°`;
      $("#weather-content").replaceChildren(temp, conditions, range);
      $("#weather-setup").hidden = true;
      $("#weather-details").replaceChildren(daily, updated);
    } catch (error) {
      $("#weather-content").textContent = error.message;
      $("#weather-setup").hidden = false;
    }
  }
  $("#weather-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      await api("/api/integrations/settings", {
        method: "POST",
        body: JSON.stringify({ weatherCity: $("#weather-city").value }),
      });
      await loadWeather();
    } catch (error) {
      notice(error.message, true);
    }
  };
  $("#weather-location").onclick = () => {
    if (!navigator.geolocation) {
      notice(
        "Standort ist hier nicht verfügbar. Bitte einen Ort eingeben.",
        true,
      );
      return;
    }
    $("#weather-content").textContent = "Standortfreigabe wird angefragt …";
    navigator.geolocation.getCurrentPosition(
      (position) =>
        loadWeather({
          latitude: Math.round(position.coords.latitude * 100) / 100,
          longitude: Math.round(position.coords.longitude * 100) / 100,
        }),
      () => {
        $("#weather-content").textContent =
          "Standort nicht freigegeben oder nicht verfügbar. Bitte einen Ort eingeben.";
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  };

  $("#planning-source").onchange = () => {
    $("#planning-week").required =
      $("#planning-source").value === "klassenflow";
    $("#planning-week").disabled =
      $("#planning-source").value === "learningview";
  };

  window.addEventListener("focus", () => {
    if (
      state.token &&
      !state.busy &&
      !document.activeElement?.closest(".widget-settings form")
    )
      loadDashboard().catch((error) => notice(error.message, true));
  });

  const drawerMedia = matchMedia("(max-width: 1249px)");
  let sidebarReturnFocus = null;
  let sidebarPreference = false;
  try {
    sidebarPreference = localStorage.getItem("hugo.sidebarHidden") === "true";
  } catch {}

  function setSidebarHidden(hidden, { persist = true, focus = true } = {}) {
    const sidebar = $("#sidebar");
    const drawerOpen = drawerMedia.matches && !hidden;
    if (
      drawerOpen &&
      !document.body.classList.contains("sidebar-drawer-open")
    ) {
      sidebarReturnFocus = document.activeElement;
      for (const popover of document.querySelectorAll("[popover]:popover-open"))
        popover.hidePopover();
    }
    document.body.classList.toggle("sidebar-hidden", hidden);
    document.body.classList.toggle("sidebar-drawer-open", drawerOpen);
    sidebar.hidden = hidden;
    $("#sidebar-backdrop").hidden = !drawerOpen;
    $("main").inert = drawerOpen;
    $("#widgets").inert = drawerOpen;
    if (drawerOpen) {
      sidebar.setAttribute("role", "dialog");
      sidebar.setAttribute("aria-modal", "true");
    } else {
      sidebar.removeAttribute("role");
      sidebar.removeAttribute("aria-modal");
    }
    for (const id of ["#sidebar-toggle", "#sidebar-menu"]) {
      $(id).setAttribute("aria-expanded", String(!hidden));
      $(id).setAttribute("aria-controls", "sidebar");
      $(id).setAttribute(
        "aria-label",
        hidden ? "Seitenleiste anzeigen" : "Seitenleiste schliessen",
      );
    }
    if (persist) {
      sidebarPreference = hidden;
      try {
        localStorage.setItem("hugo.sidebarHidden", String(hidden));
      } catch {}
    }
    if (focus && drawerOpen) $("#sidebar-close").focus();
    else if (focus && hidden) {
      const target =
        sidebarReturnFocus?.isConnected &&
        sidebarReturnFocus.getClientRects().length &&
        !sidebarReturnFocus.closest("#sidebar")
          ? sidebarReturnFocus
          : $("#sidebar-menu");
      target.focus();
      sidebarReturnFocus = null;
    }
    requestAnimationFrame(() => layoutWidgets());
  }
  function toggleSidebar() {
    setSidebarHidden(!$("#sidebar").hidden);
  }
  setSidebarHidden(drawerMedia.matches || sidebarPreference, {
    persist: false,
    focus: false,
  });
  $("#sidebar-toggle").onclick = toggleSidebar;
  $("#sidebar-menu").onclick = toggleSidebar;
  $("#sidebar-close").onclick = () => setSidebarHidden(true);
  $("#sidebar-backdrop").onclick = () => setSidebarHidden(true);
  drawerMedia.addEventListener("change", () => {
    setSidebarHidden(drawerMedia.matches || sidebarPreference, {
      persist: false,
      focus: false,
    });
  });
  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("sidebar-drawer-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setSidebarHidden(true);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...$("#sidebar").querySelectorAll(
        "a[href], button, input, select, textarea, summary",
      ),
    ].filter((el) => !el.disabled && el.getClientRects().length);
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  const timeFormat = new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const dateFormat = new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  let clockTimer;
  function updateClock() {
    const now = new Date(),
      parts = Object.fromEntries(
        timeFormat.formatToParts(now).map((part) => [part.type, part.value]),
      );
    for (const [id, key] of [
      ["clock-hours", "hour"],
      ["clock-minutes", "minute"],
      ["clock-seconds", "second"],
    ]) {
      const node = $("#" + id);
      if (node.textContent !== parts[key]) {
        node.textContent = parts[key];
        if (
          !matchMedia("(prefers-reduced-motion: reduce)").matches &&
          document.body.dataset.motion !== "paused" &&
          !document.hidden
        )
          node.animate(
            document.body.dataset.appearance === "board"
              ? [
                  { transform: "translateY(-10%)" },
                  { transform: "translateY(0)" },
                ]
              : [
                  { opacity: 0.45, transform: "translateY(-10%)" },
                  { opacity: 1, transform: "translateY(0)" },
                ],
            { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          );
      }
    }
    $("#digital-time").dateTime = now.toISOString();
    $("#digital-time").setAttribute(
      "aria-label",
      timeFormat.format(now) + " Uhr, Schweizer Zeit",
    );
    const date = dateFormat.format(now);
    if ($("#digital-date").textContent !== date)
      $("#digital-date").textContent = date;
    clearTimeout(clockTimer);
    if (!document.hidden)
      clockTimer = setTimeout(updateClock, 1000 - now.getMilliseconds());
  }
  document.addEventListener("visibilitychange", () => {
    document.body.dataset.pageHidden = String(document.hidden);
    if (document.hidden) clearTimeout(clockTimer);
    else updateClock();
  });
  updateClock();

  // Widget positions are viewport-relative, so saved layouts survive window resizing.
  const floatingWidgets = [...document.querySelectorAll("[data-widget]")];
  const widgetDefaults = {
    clock: { x: 0, y: 0 },
    planning: { x: 1, y: 0 },
    calendar: { x: 1, y: 1 },
    weather: { x: 0, y: 1 },
  };
  let widgetPositions = {};
  try {
    const stored = JSON.parse(
      localStorage.getItem("hugo.widgetPositions.v2") || "{}",
    );
    for (const name of Object.keys(widgetDefaults)) {
      const point = stored?.[name];
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y))
        widgetPositions[name] = {
          x: Math.max(0, Math.min(1, point.x)),
          y: Math.max(0, Math.min(1, point.y)),
        };
    }
  } catch {}
  let draggedWidget = null,
    widgetFront = 10;
  const widgetCanvas = $("#widgets");
  const freeWidgets = () =>
    matchMedia("(min-width: 1250px)").matches &&
    document.body.dataset.widgetLayout === "floating";
  function widgetBounds(widget) {
    return {
      x: Math.max(0, widgetCanvas.clientWidth - widget.offsetWidth),
      y: Math.max(0, widgetCanvas.clientHeight - widget.offsetHeight),
    };
  }
  let widgetSafeArea = null;
  function widgetRect(widget) {
    return {
      x: Number(widget.dataset.x) || 0,
      y: Number(widget.dataset.y) || 0,
      width: widget.offsetWidth,
      height: widget.offsetHeight,
    };
  }
  function placeWidget(widget, point, occupied = null) {
    const obstacles =
      occupied ||
      [
        widgetSafeArea,
        ...floatingWidgets.filter((other) => other !== widget).map(widgetRect),
      ].filter(Boolean);
    const safe = HugoWidgetLayout.resolve(
      { width: widget.offsetWidth, height: widget.offsetHeight },
      point,
      { width: widgetCanvas.clientWidth, height: widgetCanvas.clientHeight },
      obstacles,
    );
    if (!safe)
      return {
        x: Number(widget.dataset.x) || 0,
        y: Number(widget.dataset.y) || 0,
      };
    widget.style.transform = `translate3d(${safe.x}px, ${safe.y}px, 0)`;
    widget.dataset.x = safe.x;
    widget.dataset.y = safe.y;
    return safe;
  }
  function saveWidget(widget, point) {
    const bounds = widgetBounds(widget);
    widgetPositions[widget.dataset.widget] = {
      x: bounds.x ? point.x / bounds.x : 0,
      y: bounds.y ? point.y / bounds.y : 0,
    };
    try {
      localStorage.setItem(
        "hugo.widgetPositions.v2",
        JSON.stringify(widgetPositions),
      );
    } catch {}
    $("#widget-position-status").textContent =
      widget.querySelector("h2").textContent + ": Position gespeichert.";
  }
  function layoutWidgets() {
    if (draggedWidget) return;
    const desktop = matchMedia("(min-width: 1250px)").matches;
    document.body.dataset.widgetLayout = desktop ? "floating" : "grid";
    widgetCanvas.style.removeProperty("top");
    widgetCanvas.style.removeProperty("bottom");
    if (!desktop) {
      for (const widget of floatingWidgets)
        widget.style.removeProperty("transform");
      return;
    }
    const appRect = $(".app").getBoundingClientRect();
    const headerRect = $(".topbar").getBoundingClientRect();
    const noticeRect = $("#notice").hidden
      ? headerRect
      : $("#notice").getBoundingClientRect();
    const composerRect = $(".composer-area").getBoundingClientRect();
    widgetCanvas.style.top = `${Math.max(headerRect.bottom, noticeRect.bottom) - appRect.top + 24}px`;
    widgetCanvas.style.bottom = `${Math.max(24, appRect.bottom - composerRect.top + 24)}px`;
    const width = widgetCanvas.clientWidth,
      height = widgetCanvas.clientHeight;
    const laneWidth = Math.max(
      ...floatingWidgets.map((widget) => widget.offsetWidth),
    );
    widgetSafeArea = {
      x: laneWidth + 20,
      y: -16,
      width: Math.max(0, width - 2 * (laneWidth + 20)),
      height: height + 32,
    };
    const occupied = [widgetSafeArea];
    const placements = [];
    // Large widgets first prevents fragmentation from saved positions of small notes.
    const ordered = [...floatingWidgets].sort(
      (a, b) => b.offsetHeight - a.offsetHeight,
    );
    for (const widget of ordered) {
      const stored =
        widgetPositions[widget.dataset.widget] ||
        widgetDefaults[widget.dataset.widget];
      const point = HugoWidgetLayout.resolve(
        { width: widget.offsetWidth, height: widget.offsetHeight },
        {
          x: stored.x * Math.max(0, width - widget.offsetWidth),
          y: stored.y * Math.max(0, height - widget.offsetHeight),
        },
        { width, height },
        occupied,
      );
      if (!point || widgetSafeArea.width < 220) {
        document.body.dataset.widgetLayout = "grid";
        widgetCanvas.style.removeProperty("top");
        widgetCanvas.style.removeProperty("bottom");
        for (const item of floatingWidgets)
          item.style.removeProperty("transform");
        return;
      }
      occupied.push({
        ...point,
        width: widget.offsetWidth,
        height: widget.offsetHeight,
      });
      placements.push({ widget, point });
    }
    for (const { widget, point } of placements) {
      widget.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      widget.dataset.x = point.x;
      widget.dataset.y = point.y;
    }
  }
  function endWidgetDrag(cancel = false) {
    if (!draggedWidget) return;
    const drag = draggedWidget;
    draggedWidget = null;
    if (cancel) placeWidget(drag.widget, drag.start);
    else
      saveWidget(drag.widget, {
        x: Number(drag.widget.dataset.x),
        y: Number(drag.widget.dataset.y),
      });
    try {
      drag.handle.releasePointerCapture(drag.pointer);
    } catch {}
    document.body.classList.remove("widget-dragging");
    drag.widget.classList.remove("is-dragging");
  }
  for (const widget of floatingWidgets) {
    const handle = widget.querySelector(".widget-drag");
    handle.addEventListener("pointerdown", (event) => {
      if (!freeWidgets() || event.button !== 0 || draggedWidget) return;
      event.preventDefault();
      handle.focus({ preventScroll: true });
      const start = {
        x: Number(widget.dataset.x) || 0,
        y: Number(widget.dataset.y) || 0,
      };
      draggedWidget = {
        widget,
        handle,
        start,
        pointer: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      handle.setPointerCapture(event.pointerId);
      widget.style.zIndex = String(++widgetFront);
      widget.classList.add("is-dragging");
      document.body.classList.add("widget-dragging");
    });
    handle.addEventListener("pointermove", (event) => {
      const drag = draggedWidget;
      if (!drag || drag.handle !== handle || event.pointerId !== drag.pointer)
        return;
      placeWidget(widget, {
        x: drag.start.x + event.clientX - drag.clientX,
        y: drag.start.y + event.clientY - drag.clientY,
      });
    });
    handle.addEventListener("pointerup", () => {
      if (draggedWidget?.handle === handle) endWidgetDrag();
    });
    handle.addEventListener("pointercancel", () => {
      if (draggedWidget?.handle === handle) endWidgetDrag(true);
    });
    handle.addEventListener("lostpointercapture", () => {
      if (draggedWidget?.handle === handle) endWidgetDrag(true);
    });
    handle.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        endWidgetDrag(true);
        return;
      }
      if (
        !freeWidgets() ||
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      )
        return;
      event.preventDefault();
      const step = event.shiftKey ? 4 : 20;
      const point = placeWidget(widget, {
        x:
          Number(widget.dataset.x) +
          ({ ArrowLeft: -step, ArrowRight: step }[event.key] || 0),
        y:
          Number(widget.dataset.y) +
          ({ ArrowUp: -step, ArrowDown: step }[event.key] || 0),
      });
      saveWidget(widget, point);
    });
    for (const button of widget.querySelectorAll("[data-place]"))
      button.onclick = () => {
        const point = {
          x: button.dataset.place.endsWith("right") ? 1 : 0,
          y: button.dataset.place.startsWith("bottom") ? 1 : 0,
        };
        widgetPositions[widget.dataset.widget] = point;
        layoutWidgets();
        saveWidget(widget, {
          x: Number(widget.dataset.x) || 0,
          y: Number(widget.dataset.y) || 0,
        });
      };
    widget.querySelector("[data-reset-widget]").onclick = () => {
      delete widgetPositions[widget.dataset.widget];
      try {
        localStorage.setItem(
          "hugo.widgetPositions.v2",
          JSON.stringify(widgetPositions),
        );
      } catch {}
      layoutWidgets();
      $("#widget-position-status").textContent = "Position zurückgesetzt.";
    };
  }
  $("#reset-widget-layout").onclick = () => {
    endWidgetDrag(true);
    widgetPositions = {};
    try {
      localStorage.removeItem("hugo.widgetPositions.v2");
    } catch {}
    layoutWidgets();
    $("#widget-position-status").textContent =
      "Alle Widget-Positionen zurückgesetzt.";
  };
  let widgetResizeFrame;
  const resizeWidgets = () => {
    cancelAnimationFrame(widgetResizeFrame);
    widgetResizeFrame = requestAnimationFrame(layoutWidgets);
  };
  for (const widget of floatingWidgets)
    new ResizeObserver(() => {
      if (freeWidgets()) resizeWidgets();
    }).observe(widget);
  new ResizeObserver(resizeWidgets).observe($(".composer-area"));
  new ResizeObserver(resizeWidgets).observe($("#notice"));
  new ResizeObserver(resizeWidgets).observe($(".topbar"));
  window.addEventListener("resize", resizeWidgets);
  layoutWidgets();
  for (const popover of document.querySelectorAll(
    ".widget-settings[popover]",
  )) {
    popover.addEventListener("toggle", (event) => {
      if (event.newState !== "open") return;
      const trigger = document.querySelector(
        `[popovertarget="${popover.id}"]:not([popovertargetaction])`,
      );
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      popover.style.left = `${Math.max(12, Math.min(innerWidth - popover.offsetWidth - 12, rect.right - popover.offsetWidth))}px`;
      popover.style.top = `${Math.max(12, Math.min(innerHeight - popover.offsetHeight - 12, rect.bottom + 10))}px`;
    });
  }
  const presenceObserver = new IntersectionObserver((entries) => {
    for (const entry of entries)
      entry.target.dataset.offscreen = String(!entry.isIntersecting);
  });
  presenceObserver.observe($("#voice-presence"));

  // The embedded Google page is cross-origin; colour adaptation stays on our frame.
  let calendarColour = "hugo";
  try {
    if (localStorage.getItem("hugo.calendarTheme") === "original")
      calendarColour = "original";
  } catch {}
  function applyCalendarColour(value) {
    const theme = value === "original" ? "original" : "hugo";
    document.querySelector('[data-widget="calendar"]').dataset.calendarTheme =
      theme;
    $("#calendar-theme").value = theme;
  }
  applyCalendarColour(calendarColour);
  $("#calendar-theme").onchange = () => {
    applyCalendarColour($("#calendar-theme").value);
    try {
      localStorage.setItem("hugo.calendarTheme", $("#calendar-theme").value);
    } catch {}
  };

  // Appearance is local to this browser; both views share the same functional controls.
  function applyAppearance(value) {
    const theme = value === "board" ? "board" : "future";
    document.body.dataset.appearance = theme;
    $("#appearance").value = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === "board" ? "#193e34" : "#070b17";
    resizeWidgets();
  }
  let savedAppearance = "future";
  try {
    savedAppearance = localStorage.getItem("hugo.appearance") || "future";
  } catch {}
  applyAppearance(savedAppearance);
  $("#appearance").onchange = () => {
    applyAppearance($("#appearance").value);
    try {
      localStorage.setItem("hugo.appearance", $("#appearance").value);
    } catch {}
  };

  return { loadDashboard, layoutWidgets, resizeWidgets };
}
