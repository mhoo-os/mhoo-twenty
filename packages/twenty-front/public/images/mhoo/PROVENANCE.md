# Mhoo Snout logo provenance

These PNG files are the customer-brand assets served by Mhoo-Twenty when the
Mhoo foundation mode is enabled. Upstream Twenty mode keeps its existing assets.

- Legacy source repository: `https://github.com/mhooooo/mhoo.git`
- Legacy source commit: `d363b92b975dacec91739fb40ee0e9ffdea4e1c1`
- Legacy source path: `deploy/twenty-mac-mini/image/snout-icon.svg`
- Legacy source SHA-256: `8c3350aad7ec46bfd8d09aff633cb39ff7b818199a82f78f7f99fa69f9c7503e`
- Extraction date: 2026-08-28
- Rationale: replace the reviewed Mhoo customer-brand seam without changing
  Twenty technical identity, Workspace authority, or upstream-default behavior.

## Material transformations

| File | Use | Transformation | SHA-256 |
| --- | --- | --- | --- |
| `mhoo-snout-transparent-1024.png` | Authentication, onboarding, favicon fallback, and email logo | Removed only the SVG background rectangle and rasterized the unchanged blue mark at 1024 by 1024 pixels with alpha | `36ac7dcc5e629540d050fd5a4111c4208f716c53205da439ac47a0075800bd47` |
| `mhoo-snout-white-1024.png` | Fixed light-background export and GitHub organization avatar parity | Replaced only the SVG dark background fill with white and rasterized at 1024 by 1024 pixels; rounded outer corners retain alpha | `c1179a9cf55c03eb1c5fd0297bb25e2c24696ff2ad311885cdf765b88a102590` |

## Verification

- Verified the legacy source file at the recorded commit matches the recorded
  source hash.
- Verified both destination files match the approved export hashes and are
  1024 by 1024 PNGs with alpha.
- Visually compared both outputs with the source mark.
- No credential, customer data, persisted Workspace data, or runtime state was
  copied.
