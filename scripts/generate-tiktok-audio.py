#!/usr/bin/env python3
"""Lizenzfreie Tonspur fuer die TikTok-Videos (ab W10, siehe
culinse_tiktok_neustart_plan.md, Learnings W9: Metricool lehnt autoAddMusic bei
Video-Posts ab -> die W9-Videos liefen stumm).

Synthetisiert komplett selbst (numpy, keine Samples, keine Fremdrechte):
ein ruhiger Lo-Fi-Beat, 84 BPM, F-Dur-Akkordfolge, Rhodes-artige Akkorde,
weiches Pad, Bass, Kick/Snare/Hats mit Swing, Vinyl-Knistern, Fade-out.

Aufruf:  python3 scripts/generate-tiktok-audio.py <out.wav> [seed] [dauer_s]
Danach:  python3 scripts/generate-tiktok-video.py posts.json src out <out.wav>
"""
import sys
import wave

import numpy as np

SR = 44100


def env_adsr(n, a, d, s, r, sr=SR):
    """Einfache ADSR-Huellkurve (Sekunden), Laenge n Samples."""
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(0, n - a_n - d_n - r_n)
    parts = [
        np.linspace(0, 1, a_n, endpoint=False),
        np.linspace(1, s, d_n, endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, r_n, endpoint=True),
    ]
    e = np.concatenate(parts)
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def fft_filter(x, lo=None, hi=None, slope=2.0):
    """Sanftes Band-/Tief-/Hochpass ueber die FFT (Butterworth-artige Flanken)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (2 * slope))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope))
    return np.fft.irfft(X * g, n)


def note(freq, dur, kind, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if kind == "rhodes":
        # E-Piano: Grundton + leicht verstimmte Obertoene, perkussiver Anschlag
        y = (np.sin(2 * np.pi * freq * t)
             + 0.45 * np.sin(2 * np.pi * freq * 2.003 * t) * np.exp(-t * 3.0)
             + 0.18 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t * 6.0)
             + 0.10 * np.sin(2 * np.pi * freq * 0.5 * t))
        y *= env_adsr(n, 0.006, 0.9, 0.25, 0.6) * np.exp(-t * 0.9)
    elif kind == "pad":
        lfo = 1 + 0.0025 * np.sin(2 * np.pi * 0.35 * t)
        y = (np.sin(2 * np.pi * freq * lfo * t)
             + 0.5 * np.sin(2 * np.pi * freq * 1.002 * t + 0.7)
             + 0.35 * np.sin(2 * np.pi * freq * 0.998 * t + 1.9)
             + 0.12 * np.sin(2 * np.pi * freq * 2.0 * lfo * t))
        y *= env_adsr(n, 0.55, 0.3, 0.8, 0.9)
    elif kind == "bass":
        y = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 4)
        y = np.tanh(1.6 * y)
        y *= env_adsr(n, 0.008, 0.25, 0.55, 0.15)
    else:
        raise ValueError(kind)
    return y * vel


def kick(vel=1.0):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 42 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * 9) + 0.5 * np.exp(-t * 90) * np.random.uniform(-1, 1, n)
    return np.tanh(2.2 * y) * vel


def snare(rng, vel=1.0):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n) * np.exp(-t * 22)
    noise = fft_filter(noise, lo=900, hi=6500, slope=1.5)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 35)
    return (0.9 * noise + 0.6 * body) * vel


def hat(rng, vel=1.0, open_=False):
    n = int((0.30 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    y = rng.uniform(-1, 1, n) * np.exp(-t * (9 if open_ else 55))
    return fft_filter(y, lo=6000, hi=11500, slope=2.0) * vel


def add(buf, y, start_s):
    i = int(start_s * SR)
    if i >= len(buf):
        return
    m = min(len(y), len(buf) - i)
    buf[i:i + m] += y[:m]


NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 10, "H": 11}


def hz(name):
    """'F3' -> Hz (deutsche B = Bb)."""
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (o - 4) - 9) / 12)


def render(duration=15.0, seed=7, bpm=84.0):
    rng = np.random.default_rng(seed)
    np.random.seed(seed)
    n = int(duration * SR)
    beat = 60.0 / bpm
    bar = 4 * beat
    swing = 0.09 * beat

    # Akkordfolge (F-Dur, warm): je ein Takt
    chords = [
        (["F3", "A3", "C4", "E4"], "F2"),   # Fmaj7
        (["A3", "C4", "E4", "G4"], "A2"),   # Am7
        (["D3", "F3", "A3", "C4"], "D2"),   # Dm7
        (["B2", "D3", "F3", "A3"], "B1"),   # Bbmaj7
        (["G3", "B3", "D4", "F4"], "G2"),   # Gm7
        (["C3", "E3", "G3", "B3"], "C2"),   # C7
    ]

    keys = np.zeros(n)
    pad = np.zeros(n)
    bass = np.zeros(n)
    drums = np.zeros(n)

    nbars = int(np.ceil(duration / bar))
    for b in range(nbars):
        t0 = b * bar
        notes, root = chords[b % len(chords)]
        # Pad: ganzer Takt
        for nm in notes:
            add(pad, note(hz(nm), bar + 0.6, "pad", 0.22), t0)
        # Rhodes: Schlag 1 (voll), "und" von 2 (leise), "und" von 3 (mittel)
        for off, vel, d in ((0.0, 0.85, 2.2), (1.5 * beat, 0.35, 1.2), (2.5 * beat, 0.6, 1.8)):
            for k, nm in enumerate(notes):
                add(keys, note(hz(nm), d, "rhodes", vel * (1.0 - 0.08 * k)), t0 + off + swing * (off % beat > 0) + 0.004 * k)
        # Bass: 1 und "und" von 3
        add(bass, note(hz(root), 1.3 * beat, "bass", 0.9), t0)
        add(bass, note(hz(root), 0.9 * beat, "bass", 0.6), t0 + 2.5 * beat + swing)
        # Drums
        add(drums, kick(1.0), t0)
        add(drums, kick(0.75), t0 + 2 * beat)
        if b % 2 == 1:
            add(drums, kick(0.55), t0 + 3.5 * beat + swing)
        add(drums, snare(rng, 0.7), t0 + 1 * beat)
        add(drums, snare(rng, 0.75), t0 + 3 * beat)
        for e in range(8):
            tt = t0 + e * 0.5 * beat + (swing if e % 2 else 0)
            add(drums, hat(rng, 0.32 if e % 2 == 0 else 0.18), tt)
        add(drums, hat(rng, 0.16, open_=True), t0 + 3.5 * beat + swing)

    # Lo-Fi-Klang: Tiefpass, leichte Saettigung, Vinyl-Knistern
    keys = fft_filter(keys, hi=5200, slope=1.5)
    pad = fft_filter(pad, lo=90, hi=2600, slope=1.5)
    bass = fft_filter(bass, hi=900, slope=1.5)
    drums = fft_filter(drums, hi=8500, slope=1.6)

    crackle = np.zeros(n)
    idx = rng.integers(0, n, size=int(duration * 55))
    crackle[idx] = rng.uniform(-1, 1, len(idx)) * (rng.uniform(0, 1, len(idx)) ** 3)
    crackle = fft_filter(crackle, lo=1200, hi=9000, slope=1.5) * 0.35
    floor = fft_filter(rng.uniform(-1, 1, n), lo=200, hi=4000) * 0.004

    wide = 0.28 * keys + 0.36 * pad
    mix = wide + 0.55 * bass + 0.95 * drums + crackle + floor
    mix = mix / np.max(np.abs(mix)) * 0.85
    mix = np.tanh(1.3 * mix) / np.tanh(1.3)   # nur die Spitzen weich anfahren

    # Stereo: Pad/Keys leicht verbreitert (Haas), Bass/Drums mittig
    d = int(0.011 * SR)
    wide = wide / max(np.max(np.abs(wide)), 1e-9) * 0.5
    left = mix + 0.16 * np.roll(wide, d)
    right = mix - 0.16 * np.roll(wide, d) + 0.16 * np.roll(wide, 2 * d)

    # Fade-in / Fade-out
    fi, fo = int(0.25 * SR), int(1.6 * SR)
    ramp = np.ones(n)
    ramp[:fi] = np.linspace(0, 1, fi)
    ramp[-fo:] = np.linspace(1, 0, fo) ** 1.5
    st = np.stack([left, right], axis=1) * ramp[:, None]

    peak = np.max(np.abs(st))
    st = st / peak * 10 ** (-1.5 / 20)
    rms = np.sqrt(np.mean(st ** 2))
    print(f"peak -1.5 dBFS, rms {20 * np.log10(rms):.1f} dBFS, {duration:.1f}s, {bpm:g} bpm, seed {seed}")
    return st


def write_wav(path, st):
    pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("✓", path)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "tiktok-lofi.wav"
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    dur = float(sys.argv[3]) if len(sys.argv) > 3 else 15.0
    write_wav(out, render(dur, seed))
