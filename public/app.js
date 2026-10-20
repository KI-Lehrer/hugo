import { state } from './state.js';
import { api, startSession } from './api.js';
import {
  $,
  notice,
  message,
  renderFolders,
  refreshStatus,
  scrollConversation,
  renderSources,
  connectVoice,
} from './ui.js';
import { createVoiceController } from './voice.js';
import { createWidgets } from './widgets.js';

const voice = createVoiceController(send);
connectVoice(voice);
const {
  clearCommand,
  setMicLabel,
  stopRecognition,
  scheduleRecognition,
  initialiseVoice,
  loadVoices,
  loadNativeVoices,
  stopSpeech,
  speak,
} = voice;
const { loadDashboard } = createWidgets({ send });
function setBusy(value) {
  state.busy = value;
  $('#working').hidden = !value;
  $('#working > span:not(.working-dot)').textContent =
    $('#chat-mode').value === 'documents'
      ? 'Dateien lesen und Claude fragen …'
      : 'Claude antwortet …';
  $('#chat-mode').disabled = value;
  $('#send').disabled = value;
  $('#quick-new-chat').disabled = value;
  $('#prompt').readOnly = value;
  $('#pick-folder').disabled = value;
  setMicLabel();
}
async function send(prompt) {
  if (state.busy || !prompt.trim()) return;
  if (!state.auth) {
    notice(
      'Melde Claude zuerst mit deinem Abo an. Danach «Verbindung prüfen» wählen.',
      true,
    );
    return;
  }
  if (
    $('#chat-mode').value === 'chat' &&
    /unterrichtsplanung|wochenplanung/i.test(prompt)
  )
    $('#chat-mode').value = 'planning';
  notice('');
  stopSpeech();
  clearCommand();
  message('user', prompt);
  $('#prompt').value = '';
  setBusy(true);
  stopRecognition();
  setMicLabel();
  scrollConversation();
  try {
    const result = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        history: state.history,
        mode: $('#chat-mode').value,
      }),
    });
    message('assistant', result.text, result.sources);
    state.history.push(
      { role: 'user', text: prompt },
      { role: 'assistant', text: result.text },
    );
    state.lastAnswer = result.text;
    renderSources(result);
    if ($('#speak').checked) speak(result.text);
  } catch (error) {
    message('error', error.message);
    notice(error.message, true);
  } finally {
    setBusy(false);
    scrollConversation();
    scheduleRecognition();
    $('#prompt').focus({ preventScroll: true });
  }
}
$('#chat-form').onsubmit = (event) => {
  event.preventDefault();
  send($('#prompt').value);
};
$('#prompt').onkeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    send($('#prompt').value);
  }
};
$('#speak').onchange = () => {
  if (!$('#speak').checked) stopSpeech();
};
$('#stop-speech').onclick = stopSpeech;
$('#quick-new-chat').onclick = () => {
  stopSpeech();
  clearCommand();
  state.history = [];
  state.lastAnswer = null;
  $('#messages').replaceChildren();
  $('#source-panel').hidden = true;
  $('#welcome').hidden = false;
  $('#prompt').value = '';
  notice('');
  setMicLabel();
};
$('#refresh').onclick = async () => {
  $('#refresh').disabled = true;
  await refreshStatus();
  $('#refresh').disabled = false;
};
$('#login').onclick = async () => {
  try {
    await api('/api/login', { method: 'POST' });
    $('#login-help').hidden = false;
    notice(
      'Schliesse die Claude-Anmeldung im geöffneten Fenster ab. Klicke danach auf «Verbindung prüfen».',
    );
  } catch (error) {
    notice(error.message, true);
  }
};
$('#pick-folder').onclick = async () => {
  const button = $('#pick-folder');
  button.disabled = true;
  notice('Wähle im Finder-Dialog einen Ordner aus.');
  try {
    const result = await api('/api/folders/pick', { method: 'POST' });
    state.folders = result.folders;
    renderFolders();
    notice(
      result.cancelled
        ? ''
        : 'Ordner verbunden. Hugo darf die enthaltenen Dokumente lesen.',
    );
  } catch (error) {
    notice(
      `${error.message} Alternativ kannst du den Ordnerpfad eingeben.`,
      true,
    );
  } finally {
    button.disabled = false;
  }
};
$('#path-form').onsubmit = async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    const result = await api('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ path: $('#folder-path').value.trim() }),
    });
    state.folders = result.folders;
    renderFolders();
    $('#folder-path').value = '';
    notice('Ordner verbunden.');
  } catch (error) {
    notice(error.message, true);
  } finally {
    button.disabled = false;
  }
};
$('#cancel').onclick = async () => {
  try {
    await api('/api/cancel', { method: 'POST' });
  } catch (error) {
    notice(error.message, true);
  }
};
$('#motion-toggle').onclick = () => {
  const paused = document.body.dataset.motion !== 'paused';
  document.body.dataset.motion = paused ? 'paused' : 'active';
  $('#motion-toggle').setAttribute('aria-pressed', String(paused));
  $('#motion-toggle').textContent = paused
    ? 'Animationen fortsetzen'
    : 'Animationen pausieren';
};
window.addEventListener('beforeunload', () => {
  state.voice = false;
  stopRecognition();
  window.speechSynthesis?.cancel();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshStatus();
    if (state.voice && !state.listening) scheduleRecognition(0);
  }
});

$('#hugo-listen-preview').onclick = () => {
  $('#voice-preview').click();
  $('.workspace').scrollTop = 0;
};

async function initialise() {
  initialiseVoice();
  loadVoices();
  try {
    await startSession();
    void loadNativeVoices();
    await refreshStatus();
    await loadDashboard(true);
  } catch {
    notice(
      'Der lokale Helfer antwortet nicht. Starte Hugo erneut und lade die Seite neu.',
      true,
    );
  }
}
void initialise();
