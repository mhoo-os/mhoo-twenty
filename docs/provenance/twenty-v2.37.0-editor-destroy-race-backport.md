# Twenty v2.37.0 editor destroy-race backport

- Upstream commit: `536afd76bb4535b156122021ba7b2b8b2be9752d`
- Upstream parent: `bfd3ffc03d819f51f171157139e93c6491daa498`
- Upstream subject: `Fix the rich text editor crash on the full screen toggle (#25071)`
- Governed baseline: `twenty/v2.37.0` at
  `6da524b8903ec16a3eeea4b2e4a5fb63dbfc1c58`
- Combined binary patch SHA-256:
  `75af933a1dee2ea8bd9c38ddaf625afac196407c60c59379649b94bf099abae7`

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

The combined diff from the governed v2.37.0 baseline across those paths is
byte-for-byte identical to the upstream commit diff across the same paths. The
source verifier records that patch hash, enumerates every allowed path, and has
a hostile regression proving that an additional mutation inside an allowed
path is rejected.

## Validation and authority boundary

Focused Jest coverage exercises the live editor state, null extension manager,
and form input lifecycle. Frontend type checking, linting, formatting, source
custody, and full repository CI remain required at the exact reviewed head.

This receipt authorizes no database migration, App installation, credential or
OAuth mutation, publication, deployment, traffic change, or production
cutover. Those remain separate, explicitly authorized operations with their
own rollback and runtime evidence.
