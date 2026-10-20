import { state } from './state.js';
import { api } from './api.js';
export const $ = (selector) => document.querySelector(selector);
let speechController;
export function connectVoice(controller) {
  speechController = controller;
}
export const icon = (name) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS(svg.namespaceURI, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
};
export function notice(message, error = false) {
  $('#notice').textContent = message;
  $('#notice').classList.toggle('error', error);
  $('#notice').hidden = !message;
}
export function renderFolders() {
  const list = $('#folders');
  list.replaceChildren();
  $('#folder-count').textContent = state.folders.length;
  $('#folder-empty').hidden = state.folders.length > 0;
  for (const folder of state.folders) {
    const li = document.createElement('li');
    li.append(icon('folder'));
    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = folder.name;
    name.title = folder.path;
    li.append(name);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.title = `Zugriff auf ${folder.name} entfernen`;
    remove.setAttribute('aria-label', remove.title);
    remove.append(icon('close'));
    remove.onclick = async () => {
      try {
        const result = await api(`/api/folders/${folder.id}`, {
          method: 'DELETE',
        });
        state.folders = result.folders;
        renderFolders();
        notice(
          'Ordnerzugriff entfernt. Ein laufender Auftrag wird abgebrochen.',
        );
      } catch (error) {
        notice(error.message, true);
      }
    };
    li.append(remove);
    list.append(li);
  }
  setupState('#setup-folders', state.folders.length > 0, '2');
}
export function setupState(selector, complete, number) {
  const el = $(selector);
  el.classList.toggle('done', complete);
  el.replaceChildren();
  complete ? el.append(icon('check')) : el.append(number);
}
export async function refreshStatus() {
  try {
    const result = await api('/api/status');
    state.auth = result.auth.loggedIn;
    state.folders = result.folders;
    $('#auth-label').textContent = state.auth
      ? 'Verbunden'
      : result.auth.installed
        ? 'Anmelden'
        : 'Nicht installiert';
    $('#auth-dot').classList.toggle('warning', !state.auth);
    $('#login').hidden = state.auth;
    $('#week-number').textContent = `Kalenderwoche ${result.week.number}`;
    $('#week-range').textContent = result.week.label;
    setupState('#setup-auth', state.auth, '1');
    renderFolders();
    notice('');
    if (!result.auth.installed)
      notice(
        'Claude Code wurde nicht gefunden. Installiere Claude Code und starte Hugo erneut.',
        true,
      );
  } catch (error) {
    notice(error.message, true);
  }
}
export function scrollConversation() {
  const area = $('.workspace');
  requestAnimationFrame(() => {
    area.scrollTo({
      top: area.scrollHeight,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
    if (innerWidth < 601) $('#working').scrollIntoView({ block: 'nearest' });
  });
}
export function inline(parent, text, sources) {
  const pattern = /(\*\*([^*]+)\*\*|\[(\d+)\])/g;
  let previous = 0;
  for (const match of text.matchAll(pattern)) {
    parent.append(document.createTextNode(text.slice(previous, match.index)));
    if (match[2]) {
      const strong = document.createElement('strong');
      strong.textContent = match[2];
      parent.append(strong);
    } else {
      const source = sources.find((s) => s.number === Number(match[3]));
      if (source) {
        const link = document.createElement('a');
        link.className = 'citation';
        link.href = source.url || `/source/${source.id}`;
        link.textContent = match[0];
        link.title = `Originaldatei herunterladen: ${source.name}`;
        if (source.url) {
          link.target = '_blank';
          link.rel = 'noopener';
          link.title = `Quelle öffnen: ${source.name}`;
        } else link.setAttribute('download', '');
        parent.append(link);
      } else parent.append(document.createTextNode(match[0]));
    }
    previous = match.index + match[0].length;
  }
  parent.append(document.createTextNode(text.slice(previous)));
}
export function markdown(parent, text, sources) {
  let list = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) {
      list = null;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      if (!list) {
        list = document.createElement('ul');
        parent.append(list);
      }
      const item = document.createElement('li');
      inline(item, line.replace(/^\s*(?:[-*]|\d+\.)\s+/, ''), sources);
      list.append(item);
    } else {
      list = null;
      const heading = /^#{1,4}\s+/.test(line);
      const el = document.createElement(heading ? 'h3' : 'p');
      inline(el, line.replace(/^#{1,4}\s+/, ''), sources);
      parent.append(el);
    }
  }
}
export function message(role, text, sources = []) {
  $('#welcome').hidden = true;
  const article = document.createElement('article');
  article.className = `message ${role}`;
  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent =
    role === 'user'
      ? 'Du'
      : role === 'error'
        ? 'Auftrag nicht abgeschlossen'
        : 'Hugo';
  const content = document.createElement('div');
  content.className = 'message-content';
  role === 'assistant'
    ? markdown(content, text, sources)
    : (content.textContent = text);
  if (role === 'assistant') {
    const read = document.createElement('button');
    read.textContent = 'Vorlesen';
    read.onclick = () => speechController.speak(text);
    label.append(read);
  }
  article.append(label, content);
  $('#messages').append(article);
  return article;
}
export function renderSources(result) {
  $('#source-panel').hidden = result.mode === 'chat';
  $('#coverage').textContent =
    `${result.coverage.read} von ${result.coverage.found} Dokumenten gelesen`;
  $('#sources').replaceChildren();
  for (const source of result.sources) {
    const li = document.createElement('li'),
      a = document.createElement('a'),
      n = document.createElement('span'),
      name = document.createElement('span'),
      folder = document.createElement('small');
    n.className = 'source-number';
    n.textContent = source.number;
    name.textContent = source.name;
    a.href = source.url || `/source/${source.id}`;
    if (source.url) {
      a.target = '_blank';
      a.rel = 'noopener';
    } else a.setAttribute('download', '');
    a.append(n, name);
    folder.textContent = source.url
      ? `Übernommen: ${new Date(source.capturedAt).toLocaleString('de-CH')}`
      : `${source.folder} / ${source.relative}`;
    li.append(a, folder);
    $('#sources').append(li);
  }
  $('#warnings').replaceChildren();
  for (const warning of result.warnings) {
    const li = document.createElement('li');
    li.textContent = warning;
    $('#warnings').append(li);
  }
  $('#limits').hidden = !result.warnings.length;
}
