import { state } from './state.js';
import { api, authenticatedFetch } from './api.js';
import { $, notice } from './ui.js';

export function createVoiceController(onCommand) {
  function clearCommand() {
    clearTimeout(state.commandTimer);
    state.waiting = false;
    state.pendingCommand = '';
  }
  function setMicLabel(text) {
    $('#mic-label').textContent =
      text ||
      (state.speaking
        ? state.speechPaused
          ? 'Vorlesen pausiert'
          : state.speechActive
            ? 'Hugo spricht'
            : 'Sprachausgabe startet …'
        : !state.voice
          ? 'Mikrofon aus'
          : state.busy
            ? 'Mikrofon pausiert'
            : state.waiting
              ? 'Ich höre deinen Auftrag …'
              : state.listening
                ? 'Bereit für «Hey Hugo»'
                : 'Mikrofon wird verbunden …');
    $('#mic-dot').classList.toggle(
      'active',
      state.voice && state.listening && !state.busy && !state.speaking,
    );
    $('#mic-dot').classList.toggle(
      'off',
      !state.listening || state.busy || state.speaking,
    );
    $('#mic').setAttribute('aria-pressed', String(state.voice));
    $('#mic').setAttribute(
      'aria-label',
      state.voice
        ? 'Aktivierungswort ausschalten'
        : 'Aktivierungswort einschalten',
    );
    const mode = state.speechActive
      ? 'speaking'
      : state.speechPaused
        ? 'paused'
        : state.speaking
          ? 'queued'
          : state.busy
            ? 'working'
            : state.voice && state.listening
              ? 'listening'
              : 'idle';
    $('#voice-presence').dataset.mode = mode;
    document.body.dataset.hugoMode = mode;
    const label = {
      speaking: 'Ich spreche gerade.',
      paused: 'Vorlesen ist pausiert.',
      queued: 'Sprachausgabe wird vorbereitet …',
      working: 'Hugo denkt nach.',
      listening: state.waiting
        ? 'Hugo hört deinen Auftrag.'
        : 'Hugo hört auf «Hey Hugo».',
      idle: 'Dein Assistent ist bereit.',
    }[mode];
    if ($('#voice-presence-label').textContent !== label)
      $('#voice-presence-label').textContent = label;
  }
  function stopRecognition() {
    clearTimeout(state.restart);
    if (state.recognition) {
      try {
        state.recognition.abort();
      } catch {}
    }
    state.listening = false;
  }
  function disableVoice(reason) {
    state.voice = false;
    clearCommand();
    stopRecognition();
    setMicLabel(reason || 'Mikrofon aus');
  }
  function scheduleRecognition(delay = 700) {
    clearTimeout(state.restart);
    if (!state.voice || state.busy || state.speaking) return;
    state.restart = setTimeout(() => {
      if (!state.voice || state.busy || state.speaking || state.listening)
        return;
      try {
        state.recognition.start();
      } catch {
        if (++state.retries > 4) {
          disableVoice('Mikrofon unterbrochen');
          notice(
            'Spracherkennung unterbrochen. Mikrofon erneut einschalten oder deinen Auftrag eintippen.',
            true,
          );
        } else scheduleRecognition(1500);
      }
    }, delay);
  }
  function captureCommand(text) {
    const command = text.trim().replace(/^[,.:;!?\s]+/, '');
    if (!command) return;
    state.pendingCommand += (state.pendingCommand ? ' ' : '') + command;
    $('#prompt').value = state.pendingCommand;
    clearTimeout(state.commandTimer);
    state.commandTimer = setTimeout(() => {
      const prompt = state.pendingCommand;
      clearCommand();
      setMicLabel();
      onCommand(prompt);
    }, 1400);
  }
  function initialiseVoice() {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      $('#mic').disabled = true;
      $('#mic-label').textContent = 'Spracherkennung hier nicht verfügbar';
      $('#mic').title =
        'Bitte Chrome verwenden. Texteingabe funktioniert weiterhin.';
      return;
    }
    const recognition = new Recognition();
    state.recognition = recognition;
    recognition.lang = 'de-CH';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => {
      state.listening = true;
      state.retries = 0;
      setMicLabel();
    };
    recognition.onend = () => {
      state.listening = false;
      setMicLabel(
        state.voice && !state.speaking && !state.busy
          ? 'Mikrofon wird neu verbunden …'
          : undefined,
      );
      scheduleRecognition();
    };
    recognition.onerror = (event) => {
      if (
        [
          'not-allowed',
          'service-not-allowed',
          'audio-capture',
          'network',
          'language-not-supported',
        ].includes(event.error)
      ) {
        disableVoice('Mikrofon unterbrochen');
        notice(
          event.error === 'not-allowed'
            ? 'Bitte den Mikrofonzugriff für diese Seite in Chrome erlauben und das Mikrofon erneut einschalten.'
            : `Spracherkennung nicht verfügbar (${event.error}). Prüfe Mikrofon und Internet oder verwende Text.`,
          true,
        );
      } else if (event.error !== 'aborted' && event.error !== 'no-speech')
        notice(`Spracherkennung unterbrochen: ${event.error}`, true);
    };
    recognition.onresult = (event) => {
      if (state.busy || state.speaking || !state.voice) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const text = result[0].transcript;
        const wake = /\b(?:hey|hei|hi)\s+hugo\b/i.exec(text);
        if (wake) {
          clearCommand();
          state.waiting = true;
          setMicLabel();
          captureCommand(text.slice(wake.index + wake[0].length));
          if (!state.pendingCommand)
            state.commandTimer = setTimeout(() => {
              clearCommand();
              setMicLabel();
              notice(
                'Keinen Auftrag gehört. Sage «Hey Hugo» und anschliessend deinen Auftrag.',
              );
            }, 14000);
        } else if (state.waiting) captureCommand(text);
      }
    };
    $('#mic').onclick = () => {
      if (state.voice) {
        disableVoice();
        return;
      }
      notice('');
      state.voice = true;
      state.retries = 0;
      setMicLabel();
      scheduleRecognition(0);
    };
  }
  let preferredVoice = '';
  try {
    preferredVoice = localStorage.getItem('hugo.voice') || '';
  } catch {}
  function loadVoices() {
    const engine = window.speechSynthesis,
      select = $('#voice-select');
    if (!engine && !state.nativeVoices.length) {
      select.disabled = true;
      $('#voice-preview').disabled = true;
      $('#voice-help').textContent =
        'Hier ist keine Browser-Sprachausgabe verfügbar. Die lokale Mac-Stimme wird separat geprüft.';
      return;
    }
    select.disabled = false;
    $('#voice-preview').disabled = false;
    const voices = engine?.getVoices() || [];
    select.replaceChildren(
      new Option(
        state.nativeVoices.length
          ? 'Automatisch – natürliche Mac-Stimme'
          : 'Automatisch (Deutsch)',
        '',
      ),
    );
    for (const voice of state.nativeVoices)
      select.append(
        new Option(
          `Hugo – Natürlich (Mac) · ${voice.name}`,
          `native:${voice.id}`,
        ),
      );
    for (const voice of [...voices].sort(
      (a, b) =>
        Number(b.lang.startsWith('de')) - Number(a.lang.startsWith('de')) ||
        a.name.localeCompare(b.name),
    )) {
      const option = new Option(
        `${voice.name} · ${voice.lang}`,
        voice.voiceURI,
      );
      select.append(option);
    }
    if ([...select.options].some((v) => v.value === preferredVoice))
      select.value = preferredVoice;
    $('#voice-help').textContent = state.nativeVoices.length
      ? 'Natürliche deutsche Mac-Stimme: Ausgabe lokal über den Helfer, ohne zusätzlichen Sprachdienst. Mit vollständigen Sätzen und ruhigem Tempo.'
      : voices.length
        ? `${voices.length} Browser-/Systemstimmen verfügbar. Weitere Stimmen lassen sich in den macOS-Bedienungshilfen laden.`
        : 'Die Stimmenliste wird vom Browser geladen. Falls Hugo stumm bleibt, öffne die Seite in Chrome und prüfe die Systemstimmen.';
  }
  async function loadNativeVoices() {
    try {
      const result = await api('/api/voices');
      state.nativeVoices = (result.voices || []).sort(
        (a, b) =>
          Number(b.id.includes('siri.natural')) -
          Number(a.id.includes('siri.natural')),
      );
      loadVoices();
    } catch {
      /* Browser voices remain available if the local engine cannot start. */
    }
  }
  $('#voice-select').onchange = () => {
    preferredVoice = $('#voice-select').value;
    try {
      localStorage.setItem('hugo.voice', preferredVoice);
    } catch {}
  };
  $('#voice-preview').onclick = () =>
    speak(
      'Hallo, ich bin Hugo. Ich unterstütze dich beim Planen, Nachdenken und Schreiben.',
    );
  window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);
  function stopSpeech() {
    state.speechRun++;
    clearTimeout(state.speechTimer);
    state.speaking = false;
    state.speechActive = false;
    state.speechPaused = false;
    state.nativeAbort?.abort();
    state.nativeAbort = null;
    state.nativeAudio?.pause();
    state.nativeAudio = null;
    if (state.nativeUrl) {
      URL.revokeObjectURL(state.nativeUrl);
      state.nativeUrl = null;
    }
    window.speechSynthesis?.cancel();
    $('#stop-speech').hidden = true;
    setMicLabel();
    scheduleRecognition();
  }
  function speechParts(text) {
    const clean = text
      .replace(/\[\d+\]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*`]/g, '')
      .split('\n')
      .map((line) => line.trim().replace(/^[-–]\s+/, ''))
      .filter(Boolean)
      .map((line) => (/[.!?:;…]$/.test(line) ? line : line + '.'))
      .join(' ');
    const sentences =
      typeof Intl.Segmenter === 'function'
        ? [
            ...new Intl.Segmenter('de', { granularity: 'sentence' }).segment(
              clean,
            ),
          ].map((x) => x.segment)
        : [clean];
    const parts = [];
    let current = '';
    for (const sentence of sentences) {
      for (const word of sentence.trim().split(/\s+/)) {
        if (current && current.length + word.length + 1 > 480) {
          parts.push(current);
          current = '';
        }
        current += (current ? ' ' : '') + word;
      }
      // Prefer whole sentences; keep a short sentence with the next one.
      if (current.length >= 240) {
        parts.push(current);
        current = '';
      }
    }
    if (current) parts.push(current);
    return parts;
  }
  function speakNative(text, voice) {
    stopSpeech();
    clearCommand();
    stopRecognition();
    state.speaking = true;
    $('#stop-speech').hidden = false;
    setMicLabel();
    const speechRun = state.speechRun,
      parts = speechParts(text);
    let index = 0;
    const next = async () => {
      if (speechRun !== state.speechRun) return;
      if (index >= parts.length) {
        stopSpeech();
        return;
      }
      state.speechActive = false;
      setMicLabel();
      state.nativeAbort = new AbortController();
      try {
        const response = await authenticatedFetch('/api/speech', {
          method: 'POST',
          body: JSON.stringify({ text: parts[index++], voice }),
          signal: state.nativeAbort.signal,
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Sprachausgabe nicht verfügbar.');
        }
        const bytes = await response.blob();
        if (speechRun !== state.speechRun) return;
        const url = URL.createObjectURL(bytes),
          audio = new Audio(url);
        state.nativeUrl = url;
        state.nativeAudio = audio;
        audio.onplaying = () => {
          if (speechRun !== state.speechRun) return;
          state.speechActive = true;
          state.speechPaused = false;
          setMicLabel();
        };
        audio.onwaiting = () => {
          if (speechRun !== state.speechRun) return;
          state.speechActive = false;
          setMicLabel();
        };
        audio.onended = () => {
          if (speechRun !== state.speechRun) return;
          clearTimeout(state.speechTimer);
          URL.revokeObjectURL(url);
          state.nativeUrl = null;
          state.nativeAudio = null;
          next();
        };
        audio.onerror = () => {
          if (speechRun !== state.speechRun) return;
          stopSpeech();
          notice(
            'Der Browser konnte die lokale Stimme nicht abspielen. Wähle alternativ eine Browserstimme.',
            true,
          );
        };
        state.speechTimer = setTimeout(() => {
          if (speechRun === state.speechRun) {
            stopSpeech();
            notice('Vorlesen unterbrochen. Starte die Hörprobe erneut.');
          }
        }, 90000);
        await audio.play();
      } catch (error) {
        if (speechRun !== state.speechRun || error.name === 'AbortError')
          return;
        stopSpeech();
        notice(
          error.name === 'NotAllowedError'
            ? 'Bitte auf «Stimme anhören» klicken, um die Audiowiedergabe im Browser zu erlauben.'
            : error.message,
          true,
        );
      }
    };
    next();
  }
  function speak(text) {
    const selected = $('#voice-select').value;
    const native = selected.startsWith('native:')
      ? selected.slice(7)
      : !selected
        ? state.nativeVoices[0]?.id
        : null;
    if (native) {
      speakNative(text, native);
      return;
    }
    if (!window.speechSynthesis) {
      notice('Sprachausgabe ist hier nicht verfügbar.', true);
      return;
    }
    stopSpeech();
    clearCommand();
    stopRecognition();
    state.speaking = true;
    $('#stop-speech').hidden = false;
    setMicLabel();
    const speechRun = state.speechRun;
    const parts = speechParts(text);
    const voices = speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.voiceURI === $('#voice-select').value) ||
      voices.find((v) => v.lang === 'de-CH') ||
      voices.find((v) => v.lang.startsWith('de'));
    let index = 0;
    const next = () => {
      if (speechRun !== state.speechRun || !state.speaking) return;
      clearTimeout(state.speechTimer);
      if (index >= parts.length) {
        state.speaking = false;
        state.speechActive = false;
        state.speechPaused = false;
        $('#stop-speech').hidden = true;
        setMicLabel();
        scheduleRecognition();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(parts[index++]);
      utterance.lang = voice?.lang || 'de-DE';
      if (voice) utterance.voice = voice;
      utterance.rate = 0.96;
      utterance.onstart = () => {
        if (speechRun !== state.speechRun) return;
        state.speechPaused = false;
        state.speechActive = true;
        setMicLabel();
      };
      utterance.onend = () => {
        if (speechRun !== state.speechRun) return;
        state.speechActive = false;
        state.speechPaused = false;
        setMicLabel();
        next();
      };
      utterance.onpause = () => {
        if (speechRun !== state.speechRun) return;
        state.speechActive = false;
        state.speechPaused = true;
        setMicLabel();
      };
      utterance.onresume = () => {
        if (speechRun !== state.speechRun) return;
        state.speechPaused = false;
        state.speechActive = true;
        setMicLabel();
      };
      utterance.onerror = (event) => {
        if (speechRun !== state.speechRun) return;
        stopSpeech();
        notice(
          'Vorlesen wurde unterbrochen. Die Antwort bleibt als Text verfügbar.',
          true,
        );
      };
      state.speechTimer = setTimeout(() => {
        stopSpeech();
        notice(
          'Sprachausgabe unterbrochen. Du kannst die Antwort erneut vorlesen lassen.',
        );
      }, 60000);
      speechSynthesis.speak(utterance);
    };
    next();
  }

  return {
    clearCommand,
    setMicLabel,
    stopRecognition,
    scheduleRecognition,
    initialiseVoice,
    loadVoices,
    loadNativeVoices,
    stopSpeech,
    speak,
  };
}
