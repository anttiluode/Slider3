# Slider3 — Interference Microscope

**[Open the browser laboratory](https://anttiluode.github.io/Slider3/)**

![Slider3 experiment is rendered interactively in the browser; no screenshot required](https://img.shields.io/badge/Experiment-4%20energy--matched%20wave%20conditions-79dacb)

A direct follow-up to the original **Slider2 enhanced audio/noise instrument** (user-provided `slider2(8).py`, which used a VB-Audio cable loop, swept sine frequency, noise injection and a three-buffer 3D phase-space scatter). The new repo is an **independent synthetic experiment**, deliberately not a drop-in PyAudio replacement.

### Why it exists

Our prior attempts to apply OpenAI's October 25, 2026 wave paper used its parabolic angular multiplier for image decomposition and cavity incident beams. This experiment instead explores an **engineering approximation inspired by** the paper's coherent lifted-density and planar auxiliary-potential constructions.

Compare four **matched spatial mean-square displacement power (0.5)** conditions:
1. One propagating wave.
2. Two phase-locked crossing waves.
3. **Exactly the same two waves**, with relative phases scrambled from one observation to the next.
4. Six independently phase-scrambled waves.

For each, view a true sample-delayed 3D orbit, the spatial auxiliary-potential heat map, raw coherent-density contrast, cross terms, pattern persistence across observations, and a reproducible solver residual. Change phase sample, random seed and phase randomization. Export JSON.

**[Full mathematics and provenance](METHOD.md)** · [Pure JS engine](core.js) · [Numerical tests](tests.cjs)

### New: exact finite-wave current and directional Appendix D operator

**[Open the paper-grounded experimental comparison](https://anttiluode.github.io/Slider3/paper.html)** · [Mathematical scope and numeric receipt](PAPER_IMPLEMENTATION.md) · [Conserved current code](paper-current.js) · [Direction-dependent planar solver](paper-planar.js).

Unlike the earlier isotropic disk surrogate, this follow-up implements the actual n=2 finite-wave Friedrichs lifted tensor (a full 7×7 Gram current, checking every column's divergence) and the manuscript's direction-dependent planar Fourier disk equation on a fixed Q=0 fiber. The 64 controlled phase-shift trials found **0/64** detectable changes for Fourier magnitudes, but **64/64** for the paper current and planar potential **and also** for ordinary coherent intensity and a three-delay scalar sensor. The math captures coherent relationships, but it has not demonstrated a unique information or cost advantage over a phase-aware baseline. These are tested parts of the proof, **not** a reproduced local-smoothing theorem.

### First numerical result: same power, different structure

At equal **spatial mean-square real wave displacement = 0.5**, the potential peak-to-mean concentration is **1.000** for one wave, **1.161** for two locked waves, **1.161** for the same two waves with scrambled relative phases, and **4.683** for six scrambled waves.

This is a **useful negative control**: an instantaneous potential peak does **not** uniquely identify temporally stable coherence. Six scrambled wave components produce the biggest local peak in this toy model; distinguishing stable phase relationships requires measuring repeatability across observations. The potential's advantage over cheaper coherence and power measures is still unproven.

**Enable Pages once:** This fresh repository has a complete publishing workflow, but GitHub Pages currently returns 404 because the site isn't enabled. Open [Settings → Pages](https://github.com/anttiluode/Slider3/settings/pages), then choose **Build and deployment → Source → GitHub Actions**. You can also run locally using `python -m http.server 8000`.

### Boundary between inspiration and implementation

This code **does not reproduce** the paper's quaternionic/Friedrichs divergence-free current or its direction-dependent variable-coefficient Appendix D operator. It uses approximate real polarization channels followed by an isotropic \((-Δ_W-\alpha Δ_X)^{-1}\) screened disk Green operator. It does *not* prove local smoothing or autonomous memory writing; it tests whether that architectural motif is computationally useful enough to explore.

### Installation

The live GitHub Pages site runs entirely in your browser. To run it offline, download the repo and start a static server with `python -m http.server 8000` then open `http://localhost:8000`.

Run numerical controls with `node tests.cjs` (Node 22). The GitHub workflow verifies physical power equality, phase preservation, deterministic random phases, disk boundary conditions, elliptic-solver residual, and repeat-map change before deploying Pages.

### Related research

[ResonantNeuron](https://github.com/anttiluode/ResonantNeuron) · [AnttisInstanton-related research](https://github.com/anttiluode/EphapticFieldIntelligence) · [Kavitaatio](https://github.com/anttiluode/Kavitaatio) · [ResonanceAsControlledMethod](https://github.com/anttiluode/ResonanceAsControlledMethod) · [OpenAI October 25 wave manuscript](https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/paper.pdf).
