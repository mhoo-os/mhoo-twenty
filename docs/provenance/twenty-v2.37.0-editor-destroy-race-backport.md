# Twenty v2.37.0 editor destroy-race backport

- Upstream commit: `536afd76bb4535b156122021ba7b2b8b2be9752d`
- Upstream parent: `bfd3ffc03d819f51f171157139e93c6491daa498`
- Upstream subject: `Fix the rich text editor crash on the full screen toggle (#25071)`
- Governed baseline: `twenty/v2.37.0` at
  `6da524b8903ec16a3eeea4b2e4a5fb63dbfc1c58`
- Path-and-blob content manifest SHA-256:
  `8de536b7849e4be1cb5c64881e8a6711423bf12138ca30be95b99e7e50f62125`

## Rationale

Twenty v2.37.0 can retain a stale TipTap editor snapshot after
`Editor.destroy()` clears its extension manager. Code that reads extensions
from that stale snapshot can then throw while rendering AI settings and other
advanced-editor surfaces. This backport applies the later official Twenty fix
without adopting unrelated post-v2.37 source.

## Custodied scope

The backport changes exactly these 13 paths:

- `packages/twenty-front/src/modules/activities/emails/editor/components/EmailEditorCanvas.tsx`
- `packages/twenty-front/src/modules/activities/emails/hooks/useCampaignCanvasWidth.ts`
- `packages/twenty-front/src/modules/advanced-text-editor/components/ImageBubbleMenu.tsx`
- `packages/twenty-front/src/modules/advanced-text-editor/components/LinkBubbleMenu.tsx`
- `packages/twenty-front/src/modules/advanced-text-editor/components/__tests__/FormAdvancedTextFieldInput.test.tsx`
- `packages/twenty-front/src/modules/advanced-text-editor/hooks/__tests__/useLiveEditorState.test.tsx`
- `packages/twenty-front/src/modules/advanced-text-editor/hooks/useLiveEditorState.ts`
- `packages/twenty-front/src/modules/advanced-text-editor/hooks/useTextBubbleState.ts`
- `packages/twenty-front/src/modules/advanced-text-editor/hooks/useTurnIntoBlockOptions.ts`
- `packages/twenty-front/src/modules/advanced-text-editor/utils/__tests__/hasEditorExtension.test.ts`
- `packages/twenty-front/src/modules/advanced-text-editor/utils/hasEditorExtension.ts`
- `packages/twenty-front/src/modules/side-panel/pages/email-block-settings/components/EmailPageStyleSection.tsx`
- `packages/twenty-front/src/modules/side-panel/pages/email-block-settings/components/SidePanelEmailBlockSettingsPage.tsx`

Every governed backport path has the same Git blob identity as that path in the
official upstream fix commit. The source verifier hashes the ordered path and
blob manifest, enumerates every allowed path, and has a hostile regression
proving that an additional mutation inside an allowed path is rejected.

## Validation and authority boundary

Focused Jest coverage exercises the live editor state, null extension manager,
and form input lifecycle. Frontend type checking, linting, formatting, source
custody, and full repository CI remain required at the exact reviewed head.

This receipt authorizes no database migration, App installation, credential or
OAuth mutation, publication, deployment, traffic change, or production
cutover. Those remain separate, explicitly authorized operations with their
own rollback and runtime evidence.
