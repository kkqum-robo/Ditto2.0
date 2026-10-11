import { useEffect, useRef, useState } from 'react';

/* Calm Space: floating "Calm" button + full-screen flow for panic moments, day or night.
   Step 1 asks what helps (sound + words). Step 2 breathes with voice + ambient sound. Step 3 checks in.
   Voice order: your mp3 file -> ElevenLabs live (needs key) -> browser voice. Never blocks the user. */

const ENV = ((import.meta as any).env || {}) as Record<string, string | undefined>;
const KEY = ENV.VITE_ELEVEN_API_KEY;
const VOICE = ENV.VITE_ELEVEN_VOICE_ID || 'ZbxPfVOKktgkLqi5LCBx'; // swap for your own voice id

type Line = { id: string; label: string; text: string; file?: string };
const LINES: Line[] = [
  // Edit `text` of the first line so it matches what your downloaded recording says.
{ id: 'safe', label: 'You matter', text: "Please stop for a moment and listen. You matter. Your life has value, even if you can't feel it right now. I'm here, and there are people who want to help you. Let's reach out to the helpline together.", file: '/affirmation.mp3' },
  { id: 'pass', label: 'This will pass', text: 'This moment will pass. You have gotten through every hard moment so far. One slow breath at a time.' },
  { id: 'alone', label: 'You are not alone', text: 'You are not alone tonight. Someone out there feels this too, and you are allowed to ask for help.' },
  { id: 'ground', label: 'Guide me through grounding', text: 'Look around and name five things you can see. Four things you can touch. Three things you can hear. Two you can smell. One you can taste. You are here, and you are okay.' },
];
const SOUNDS = [
  { id: 'rain', icon: '\u{1F327}\uFE0F', label: 'Rain' },
  { id: 'ocean', icon: '\u{1F30A}', label: 'Ocean' },
  { id: 'hum', icon: '\u{1F3B5}', label: 'Soft hum' },
  { id: 'none', icon: '\u{1F90D}', label: 'Silence' },
];

/* Ambient sound made in the browser, so no music files are needed. Returns a stop function. */
function ambient(kind: string): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (kind === 'none' || !AC) return () => {};
  const ctx = new AC();
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, ctx.currentTime);
  out.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 3);
  out.connect(ctx.destination);
  const srcs: any[] = [];
  if (kind === 'hum') {
    [196, 247, 294].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.35 - i * 0.07;
      o.connect(g); g.connect(out); o.start(); srcs.push(o);
    });
  } else {
    const n = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'rain') d[i] = w * 0.6;
      else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    }
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = kind === 'rain' ? 'bandpass' : 'lowpass';
    f.frequency.value = kind === 'rain' ? 2200 : 500;
    const g = ctx.createGain();
    g.gain.value = 0.7;
    s.connect(f); f.connect(g); g.connect(out); s.start(); srcs.push(s);
    if (kind === 'ocean') {
      const l = ctx.createOscillator(); l.frequency.value = 0.12;
      const la = ctx.createGain(); la.gain.value = 0.5;
      l.connect(la); la.connect(g.gain); l.start(); srcs.push(l);
    }
  }
  return () => {
    out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => { srcs.forEach(s => { try { s.stop(); } catch (e) {} }); try { ctx.close(); } catch (e) {} }, 900);
  };
}

export default function CalmSpace({ onDone, onHelp }: { onDone: () => void; onHelp: () => void }) {
  const hour = new Date().getHours();
  const late = hour >= 21 || hour < 5;
  const [open, setOpen] = useState(false);
  const [night, setNight] = useState(late);
  const [step, setStep] = useState<'ask' | 'breathe' | 'check'>('ask');
  const [sound, setSound] = useState('rain');
  const [lineId, setLineId] = useState('safe');
  const [custom, setCustom] = useState('');
  const [phase, setPhase] = useState('Breathe in');
  const [vs, setVs] = useState<'idle' | 'loading' | 'playing'>('idle');
  const stopAmb = useRef<() => void>(() => {});
  const audio = useRef<HTMLAudioElement | null>(null);
  const cache = useRef<Record<string, string>>({});

  const line: Line = lineId === 'custom' && custom.trim()
    ? { id: 'custom', label: 'Your words', text: custom.trim() }
    : LINES.find(l => l.id === lineId) || LINES[0];

  const stopVoice = () => {
    audio.current?.pause();
    audio.current = null;
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    setVs('idle');
  };

  const speak = async (l: Line) => {
    stopVoice();
    setVs('loading');
    try {
      let src = l.file || cache.current[l.text];
      if (!src && KEY) {
        const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE, {
          method: 'POST',
          headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({ text: l.text, model_id: 'eleven_v4', voice_settings: { stability: 0.7, similarity_boost: 0.75 } }),
        });
        if (!r.ok) throw new Error('tts');
        src = URL.createObjectURL(await r.blob());
        cache.current[l.text] = src;
      }
      if (!src) throw new Error('no audio');
      const a = new Audio(src);
      a.onended = () => setVs('idle');
      audio.current = a;
      await a.play();
      setVs('playing');
    } catch (e) {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(l.text);
        u.rate = 0.85; u.pitch = 0.95;
        u.onend = () => setVs('idle');
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        setVs('playing');
      } else setVs('idle');
    }
  };

  const begin = () => { stopAmb.current(); stopAmb.current = ambient(sound); setStep('breathe'); speak(line); };
  const close = () => { stopAmb.current(); stopAmb.current = () => {}; stopVoice(); setOpen(false); setStep('ask'); };

  useEffect(() => () => { stopAmb.current(); audio.current?.pause(); }, []);
  useEffect(() => {
    if (step !== 'breathe') return;
    let on = true;
    let t: any;
    const cycle = (inhale: boolean) => {
      if (!on) return;
      setPhase(inhale ? 'Breathe in' : 'Breathe out');
      t = setTimeout(() => cycle(!inhale), inhale ? 4000 : 6000);
    };
    cycle(true);
    return () => { on = false; clearTimeout(t); };
  }, [step]);

  return (
    <>
      <style>{CSS}</style>
      <button className="sos" onClick={() => setOpen(true)} aria-label="Open calm space">{'\u{1F319}'} Calm</button>
      {open && (
        <div className={'calm' + (night ? ' night' : '')} role="dialog" aria-modal="true" aria-label="Calm space">
          <div className="panel">
            <div className="ctop">
              <button className="cx" onClick={() => setNight(!night)} aria-label="Toggle night mode">{night ? '\u2600\uFE0F' : '\u{1F319}'}</button>
              <button className="cx" onClick={close} aria-label="Close">Close</button>
            </div>

            {step === 'ask' && (
              <>
                <h2>{late ? "It's late, and you're not alone." : "Let's slow things down together."}</h2>
                <p className="cm">Tell me what usually helps. I will set it up.</p>
                <div className="cl">What calms you?</div>
                <div className="crow">
                  {SOUNDS.map(s => <button key={s.id} className={'cchip' + (sound === s.id ? ' on' : '')} onClick={() => setSound(s.id)}>{s.icon} {s.label}</button>)}
                </div>
                <div className="cl">Words you want to hear</div>
                <div className="ccol">
                  {LINES.map(l => <button key={l.id} className={'cchip' + (lineId === l.id ? ' on' : '')} onClick={() => setLineId(l.id)}>{l.label}</button>)}
                  <button className={'cchip' + (lineId === 'custom' ? ' on' : '')} onClick={() => setLineId('custom')}>My own words</button>
                </div>
                {lineId === 'custom' && <textarea className="cin2" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Write the words that help you" />}
                <button className="cgo" onClick={begin} disabled={lineId === 'custom' && !custom.trim()}>Start calming</button>
                <button className="clink" onClick={() => { close(); onHelp(); }}>I need help right now</button>
              </>
            )}

            {step === 'breathe' && (
              <>
                <div className="orb" aria-hidden="true" />
                <h2 style={{ textAlign: 'center' }}>{phase}</h2>
                <p className="cm" style={{ textAlign: 'center' }}>{line.text}</p>
                <div className="crow" style={{ justifyContent: 'center' }}>
                  <button className="cchip" onClick={() => speak(line)} disabled={vs === 'loading'}>{vs === 'playing' ? 'Playing...' : vs === 'loading' ? 'Loading...' : 'Play voice again'}</button>
                  <button className="cchip" onClick={() => { stopVoice(); setStep('ask'); }}>Change</button>
                </div>
                <button className="cgo" onClick={() => { stopVoice(); setStep('check'); }}>I am ready to check in</button>
              </>
            )}

            {step === 'check' && (
              <>
                <h2>How are you now?</h2>
                <p className="cm">There is no wrong answer.</p>
                <button className="cgo" onClick={() => { onDone(); close(); }}>A little calmer</button>
                <button className="cchip wide" onClick={() => { setStep('breathe'); speak(line); }}>About the same. Go again</button>
                <button className="cchip wide" onClick={() => { close(); onHelp(); }}>Still struggling. Show me help</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const CSS = `
.sos{position:fixed;right:16px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:30;padding:11px 18px;border-radius:999px;border:0;background:var(--acc,#391E10);color:var(--bg,#FAEFE8);font:600 14px Outfit,sans-serif;box-shadow:0 8px 22px rgba(57,30,16,.35);cursor:pointer}
@media (min-width:781px){.sos{bottom:24px;right:24px}}
.calm{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:16px;background:rgba(57,30,16,.6)}
.calm .panel{width:min(460px,100%);max-height:94vh;overflow:auto;border-radius:26px;padding:20px;background:var(--s1,#FFFAF6);color:var(--ink,#391E10);font-family:Outfit,sans-serif}
.calm.night .panel{background:#1B0E07;color:#F6E7DE}
.calm h2{font:700 24px/1.25 Outfit,sans-serif;margin:6px 0}
.cm{font-size:15px;line-height:1.5;opacity:.85;margin-bottom:10px}
.cl{font:600 13px Outfit,sans-serif;opacity:.7;margin:14px 0 6px}
.ctop{display:flex;justify-content:space-between}
.cx{background:none;border:0;color:inherit;font:600 14px Outfit,sans-serif;cursor:pointer;padding:6px 4px;opacity:.8}
.crow{display:flex;flex-wrap:wrap;gap:8px}
.ccol{display:flex;flex-direction:column;gap:8px}
.cchip{padding:10px 14px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;font:500 14px Outfit,sans-serif;cursor:pointer;text-align:left;opacity:.85}
.cchip.on{background:#F2D5C8;color:#391E10;border-color:#F2D5C8;font-weight:600;opacity:1}
.cchip.wide{width:100%;margin-top:8px;text-align:center}
.cchip:disabled{opacity:.4}
.cin2{width:100%;margin-top:8px;min-height:70px;padding:12px;border-radius:14px;border:1px solid currentColor;background:transparent;color:inherit;font:15px Outfit,sans-serif;resize:none}
.cgo{width:100%;margin-top:16px;padding:14px;border-radius:999px;border:0;background:#391E10;color:#FAEFE8;font:600 16px Outfit,sans-serif;cursor:pointer}
.calm.night .cgo{background:#F2D5C8;color:#391E10}
.cgo:disabled{opacity:.4}
.clink{display:block;margin:12px auto 0;background:none;border:0;color:inherit;text-decoration:underline;font:500 14px Outfit,sans-serif;cursor:pointer;opacity:.85}
.orb{width:190px;height:190px;border-radius:50%;margin:22px auto 14px;background:radial-gradient(circle at 35% 30%,#fff,#F2D5C8 55%,#D9A892);box-shadow:0 0 60px rgba(242,213,200,.55);transform:scale(.8)}
@media (prefers-reduced-motion:no-preference){.orb{animation:cbreathe 10s ease-in-out infinite}}
@keyframes cbreathe{0%{transform:scale(.72)}40%{transform:scale(1.12)}100%{transform:scale(.72)}}
`;