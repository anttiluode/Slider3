# Slider3: reproducing the OpenAI wave machinery, not just a lookalike

**What this implements:** two mathematically traceable finite-dimensional components of the October 25, 2026 OpenAI local-smoothing manuscript, plus an explicitly controlled comparison with power spectrum and an ordinary delay-space sensor.

- [Paper-inspired but APPROXIMATE original Slider3](index.html)
- [Paper-grounded current + planar operator lab](paper.html)
- [Exact seven-coordinate Friedrichs current](paper-current.js) and [numerical identity tests](paper-tests.cjs)
- [Planar directional Fourier disk solver](paper-planar.js), [ordinary baseline comparison](paper-evidence.js), [baseline tests](paper-evidence-tests.cjs)
- [OpenAI manuscript (October 25)](https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/paper.pdf)

## The exact current construction

Sources: [current.tex, §2](https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/build/sections/current.tex), eqs. (current-modes), (current-real-flux), (current-source-tensor), Lemma current-flow.

With n=2, d=1, the real symmetric Friedrichs matrices in null coordinates are

\[
C^t=\begin{pmatrix}2&0\\0&0\end{pmatrix},\quad
C^x=\begin{pmatrix}0&1\\1&0\end{pmatrix},\quad
C^{s_0}=\begin{pmatrix}0&0\\0&-1\end{pmatrix}.
\]

For modes \(\kappa>0\), transverse slope \(v\), finite complex coefficients \(c_{\kappa,v}\) and phases \(\phi=\kappa(s_0+vx-v^2t/2)\), the paper's system solution is a weighted sum \(\sqrt\kappa(1,v)c_{\kappa,v}e^{i\phi}\). The holomorphic imaginary displacement is constructed from TWO real auxiliary states \(w_\ell=(w_{\ell0},w_{\ell1})\). The conjugated displaced field is the exact Gaussian finite sum

\[
G_a=\sum_{\kappa,v}\sqrt\kappa(1,v)_a\overline{c_{\kappa,v}}
e^{-i\phi}\,
e^{-\frac{\kappa}{2}\sum_{\ell=1}^2(w_{\ell1}-v w_{\ell0})^2}.
\]

We implement the complete complex first-order fields

\[
D_{\ell a}=\partial_{w_{\ell a}}+
 i\sum_\mu(C^\mu w_\ell)_a\partial_{\mathsf X^\mu},
\quad
\mathcal Z_\ell=\sum_a G_aD_{\ell a},
\]

and the **full 7×7 real Gram tensor**

\[
B=\operatorname{Re}\sum_{\ell=1}^2\mathcal Z_\ell\otimes\overline{\mathcal Z_\ell}.
\]

Coordinate order is \((t,x,s_0,w_{10},w_{11},w_{20},w_{21})\). The original source theorem states \(B\) is positive semidefinite and has zero divergence in **every column**, including derivatives in auxiliary coordinates. The tests independently calculate seven centered finite differences per tensor column, vary the differentiation step, and check positivity and symmetry for different coherent phases. Maximum absolute conservation residual for the stated deterministic checks: **5.28×10⁻⁶** at differentiation step 10⁻³.

This is faithful to the **finite-source current-flow lemma**, not a construction of the full later quaternionic pushforward, smooth regularization or proof of the local-smoothing inequality.

## Appendix D on a fixed planar fiber

Sources: [planar.tex](https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/build/sections/planar.tex) and [energy.tex, fiber-inverse](https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/build/sections/energy.tex).

At a fixed Q=0, positive \(\tau\) and complex auxiliary W disk \(|W|<0.1\), the manuscript's coordinate inverse gives

\[
Y={\sqrt2\tau\over1+W^2/2},\quad
e=( (1-W^2/2)/\sqrt2,\,-W),\quad
\mathcal J={(1+W^2/2)^2\over2\tau}.
\]

The source is the exact finite-mode **time-current density** \(A^0_{TT}=|\mathsf S_0u|^2+|\mathsf S_1u|^2\), using the manuscript's \(b_0,b_1\) and Gaussian mode weights on this coordinate slice. Two periodic physical Fourier modes \(\xi_0=(0,400)\), \(\xi_1=(40,399)\) are analytically expanded into the 0 and ±(-40,1) frequencies of the density (no FFT approximation). We then solve the original **direction-dependent** equation, not the original Slider3 isotropic surrogate:

\[
4|\mathcal J(W)|^2\Delta_W\widehat u
-4|k\cdot e(W)|^2\widehat u=\widehat\mu,
\qquad \widehat u|_{\partial D}=0.
\]

The code solves the equivalent positive inverse for \(v=-u\), on a 21×21 disk-grid with 2200 Jacobi steps. It tests coefficient dependence on W and k, vanishing Dirichlet boundary data, the nonnegative inverse for nonnegative input, and residuals for the zero and directional Fourier modes. Observed maximum relative discrete equation residual: **5.08×10⁻¹⁴**.

The energy displayed is a *local Q=0, fixed-fiber-slice* version of \(\frac12\int(-u)\mu\), using discrete dW. It is NOT the paper's complete energy functional integrated with the full \((P,Z)\) volume Jacobian and regularized Q fibers. The paper also smooths the current spatially with a kernel, cuts off its Q-support, and performs quaternionic cofactor estimates; these later ingredients are not yet implemented. The current and planar examples use **different finite wave modes suited to their coordinate charts**, so this remains two verified components rather than an end-to-end replay of the theorem.

## Answer to the user's information question

We vary only the **relative phases** of two source waves while holding all Fourier coefficient magnitudes identical.

| Measurement | Change detected across 64 seeded phase trials? | Access |
|---|---:|---|
| Fourier **power spectrum** (magnitudes²) | **0/64** | 2 magnitude bins |
| Ordinary three-delay **single-sensor** phase-space vector | **64/64** | 3 scalar readings |
| Ordinary coherent wave **intensity** | **64/64** | Full phase-aware field |
| Paper conserved tensor, physical-time component | **64/64** | Known complex Fourier coefficients and auxiliary state |
| Paper planar disk potential-slice energy | **64/64** | Known complex Fourier coefficients plus directional PDE solve |

The criterion is a noiseless mathematical nonzero difference (relative change > 10⁻⁸), not noisy classifier accuracy. The spectral magnitude is phase-blind by construction; its residual difference near \(8\times10^{-17}\) is numerical roundoff.

**Conclusion:** The current and potential expose relative-phase information that power-spectrum magnitudes discard. **They do not reveal information absent from an ordinary phase-space representation in this experiment.** The ordinary three-delay signal is already sufficient to detect these particular changes. There is no measured superiority for the more expensive constructions, and it would be unfair to claim it when they get full complex source Fourier coefficients whereas the delay baseline gets one point sensor.

The paper's novel value here is its mathematical structure—an explicitly conserved positive tensor and its compatible directional potential—not magical extra information creation. To test whether those structures HELP, the next experiment must use the SAME limited noisy sensor data, calibrated computation cost, prediction target and held-out tasks for ALL competitors.

## Reproduce

Use Node 22:

    node paper-tests.cjs
    node paper-evidence-tests.cjs

Open paper.html on a static HTTP server or on GitHub Pages. The original index.html and its approximate model remain intact.
