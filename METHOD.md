# Slider3 research note — an interference microscope, not a quantum computer

**Date:** October 27, 2026  
**Origin:** user-provided older \`slider2(8).py\` screenshot and source, running an actual VB-Audio virtual audio-cable loop with frequency sweep/noise injection and a Matplotlib 3D scatter display of the three most recent audio buffers. Slider3 does **not** require PyAudio, VB-Cable, or a GPU. Its current source is a separate, reproducible two-dimensional **synthetic** wave experiment in a browser.

[Live instrument](https://anttiluode.github.io/Slider3/) · [Source](core.js) · [Numerical guardrails](tests.cjs) · [OpenAI October 25 paper](https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/paper.pdf)

## Physical question

Suppose the **spatial mean-square of a real displacement field is identical** across four signals, but the phase relations and the number of propagation directions differ:

1. Single propagating 2D plane wave.
2. Two phase-locked orthogonal plane waves (different directions, same frequency).
3. **Precisely those same two waves** with relative phases scrambled independently between observations; isolates phase stability while keeping source frequencies, directions, amplitude and mean power matched.
4. Six independently phase-scrambled plane waves with distinct integer 2D wavevectors.

The original prompt emphasized one, two coherent, and many incoherent waves. Condition 3 is a necessary added control: otherwise comparing (2) to (4) confounds coherent-vs-random phase with the **number and direction of modes**.

All sources are 2D periodic Fourier modes on a 32×32 torus:
\[
f(X,t)=\sum_j {1\over\sqrt{m}}\cos(k_j\cdot X-|k_j|t+\phi_j).
\]
Wave vectors are integer and pairwise non-equal/opposite, so their spatial mean-square **equals exactly \(1/2\)** (up to float rounding) for all allowed phase choices, independent of m. This is a matched displacement-power measure **not** a claim of fully equal kinetic-plus-gradient wave energy across different wavevector distributions. The same two-wave pair is matched in both respects.

Phase-scrambling uses seeded deterministic pseudorandom phases; it does not emulate a quantum process. A scrambled **snapshot** is still capable of ordinary constructive/destructive interference. Scrambling means **patterns vary between observations**, which requires comparing more than one frame.

## Coherent directional lift (engineering analogy, not the paper's construction)

For every point X and an interior node W of a 9×9 auxiliary Dirichlet disk, each directional mode receives a Gaussian-like positive angular weight

\[
g_j(W)=\sqrt{|k_j|}\exp[-(\rho |k_j|/2)|W-\widehat k_j|^2],\qquad \rho=1.5.
\]

Two *approximate* scalar polarization channels \(b_0,b_1\) are computed from the relative direction W and wave direction. The pointwise coherent density is

\[
\mu(X,W)=\big|\sum_j a_j b_{0j}(W)g_j(W)e^{i\theta_j(X)}\big|^2+
          \big|\sum_j a_j b_{1j}(W)g_j(W)e^{i\theta_j(X)}\big|^2.
\]

The phase-blind diagonal comparator is the sum of individual squared contributions **without** the j≠l cross terms. The source-to-source difference \(\mu-\mu_{\mathrm{diagonal}}\) is the coherent interference term. In a one-mode test it vanishes exactly by construction.

**This is not the paper's conserved current.** The paper derives a quaternionic Gram tensor through a specifically constructed Friedrichs flow and holomorphic pushforward. Our simple \(b_0,b_1\) channels borrow its general representational strategy but are not verified to be divergence-free or to satisfy its lifted-current identities. No conserved-current or local-smoothing theorem follows from \(\mu\).

## Screened auxiliary-disk potential

We solve the explicit **surrogate** positive inverse problem

\[
(-\Delta_W-\alpha\Delta_X)v=\mu,\qquad v|_{\partial D}=0,\quad \alpha=0.075,
\]

with periodic X and zero Dirichlet W boundary. The disk-grid Laplacian and periodic spatial Laplacian use Jacobi iterations (100) and one finite-difference stencil on both domains. Because the discretized operator is an M-matrix and \(\mu\ge0\), a nonnegative solution v exists and the solver is checked numerically **without clipping negative values**.

This is an **isotropic** screened Poisson approximation to an auxiliary nonlocal interaction. Appendix D's actual planar operator has a direction-dependent term \(4(e\cdot\nabla_X)^2\) and variable geometric coefficients. \(-\alpha\Delta_X\) is **not identical** to that term. The paper's potential solves for \(u\le0\); we use \(v=-u\ge0\). The original determinant/energy argument and critical \(L^4\) estimate are **not reproduced or proven**.

Our derived visualized feature is
\[
F(X)=\frac12\int_D v(X,W)\mu(X,W)\,dW.
\]
This is quartic under common amplitude scaling. We compare dimensionless spatial **peak/mean** rather than raw total energy. It may simply smooth the density and make nicer pictures.

## Initial reproducible numerical receipt

Node tests at seed 34, frame 0, full scrambling, and 100 disk Jacobi iterations:

| Condition | Mean-square wave power | Auxiliary potential peak/mean | Relative PDE residual |
|---|---:|---:|---:|
| Single mode | 0.500000000 | 1.000 | 0.000155 |
| Two phase-locked orthogonal modes | 0.500000000 | 1.161 | 0.000219 |
| Same two modes, random phases | 0.500000000 | 1.161 | 0.000219 |
| Six scrambled modes | 0.500000000 | 4.683 | 0.000196 |

The same-two-mode locked and scrambled cases differ by a spatial translation of their interference fringes on the torus, so a peak/mean concentration metric is unchanged despite scrambled phases. The locked pattern persists across observations (spatial correlation 1.000); six independently phase-scrambled components change their pattern (observed initial paired-map correlation approximately 0.146). The matched two-scrambled case also changes its location while retaining the same concentration, verified numerically.

**Important failure of the naive interpretation:** the six scrambled waves produce a *larger* instantaneous potential contrast than the two phase-locked waves. A deep focus potential is therefore **not evidence of enduring coherence or a useful learning signal**. The experiment demonstrates meaningful energy-matched differences in instantaneous geometry and reveals why temporal tests and simpler phase/power controls are essential.

---

## What you can actually measure

- The old Slider2-style 3D orbit: correctly built at **sample-level delays** \(x(t-14),x(t-7),x(t)\) from a single virtual observation point. The original Python script selected the three most recent **4096-sample buffers**, not literal adjacent-sample delay coordinates. Slider3 uses a true scalar delay embedding for its synthetic trace.
- Equal mean-square power of the actual simulated real 2D field.
- Raw coherent lifted-density contrast and screened-potential contrast. Their discrepancy shows what the extra Poisson computation changes, **not** necessarily what helps a downstream task.
- Cross-term strength relative to phase-blind directional diagonal power. This can measure instantaneous interference but is **not itself a temporal coherence indicator**.
- Two-frame zero-mean spatial correlation of focus-potential maps. The locked two-mode pattern should persist; scrambled relative phases shift its interference fringes.
- Solver relative residual \(\|Av-\mu\|_2/\|\mu\|_2\), checked in continuous integration.

**Observation caveat:** the W-disk density and focus map are computed from all known synthetic Fourier mode amplitudes and phases. They require full-field/source access; the single sensor feeding the delay orbit cannot magically reconstruct the full W-disk field. The instrument does **not** solve cavity memory readout from a single unknown echo.

## Falsifiable next step

The first true performance experiment should **not** be about whether the potential has a larger peak. It should ask whether the extra potential processing reliably predicts **which time sequences maintain stable relationships**, using only the same finite noisy measurements, compared with:
- scalar signal power and delayed-sample trajectory features,
- raw phase-coherence and ordinary short-time FFT baselines,
- the coherent lift \(\mu\) **without** the auxiliary disk solve,
- simple spatial smoothing of the coherent density with the same computational cost.

Freeze signal generators, source-vs-test splits, sensor budgets, number of modes, inference policy, noise conditions, and success metric *before* tuning the new operator. No write rule or biological neural claim should be added until an actual predictive utility improvement has been measured. Following that, a slow plasticity gate in AnttisInstanton or Kavitaatio becomes a legitimate comparison.

### Run locally

Any static web server:
\`\`\`bash
python -m http.server 8000
\`\`\`
Then browse to http://localhost:8000/. The Web Worker requires a local HTTP server rather than directly opening the file as \`file://\`.

For numerical checks:
\`\`\`bash
node tests.cjs
\`\`\`

No dependencies, cloud APIs, GPU, local audio device permissions, or server inference are needed.
