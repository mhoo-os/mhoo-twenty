import * as fs from 'fs';
import * as path from 'path';

import { config } from 'dotenv';
config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  override: true,
});

type GenerateFrontConfigOptions = {
  isMhooFoundationEnabled?: boolean;
};

const TWENTY_CUSTOMER_BRAND_BLOCK = `<!-- BEGIN: Customer Brand -->
    <link
      rel="icon"
      type="image/x-icon"
      href="/images/icons/android/android-launchericon-48-48.png"
      data-rh="true"
    />
    <link rel="apple-touch-icon" href="/images/icons/ios/192.png" />
    <link rel="manifest" href="/manifest.json" />

    <meta name="theme-color" content="#000000" />
    <meta name="description" content="A modern open-source CRM" />
    <meta
      property="og:image"
      content="https://raw.githubusercontent.com/twentyhq/twenty/main/docs/static/img/social-card.png"
    />
    <meta property="og:description" content="A modern open-source CRM" />
    <meta property="og:title" content="Twenty" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta
      name="twitter:image"
      content="https://raw.githubusercontent.com/twentyhq/twenty/main/docs/static/img/social-card.png"
    />

    <meta name="twitter:description" content="A modern open-source CRM" />
    <meta name="twitter:title" content="Twenty" />
    <title>Twenty</title>
    <!-- END: Customer Brand -->`;

const MHOO_CUSTOMER_BRAND_BLOCK = `<!-- BEGIN: Customer Brand -->
    <link
      rel="icon"
      type="image/png"
      href="/images/mhoo/mhoo-snout-transparent-1024.png"
      data-rh="true"
    />
    <link
      rel="apple-touch-icon"
      href="/images/mhoo/mhoo-snout-white-1024.png"
    />
    <link rel="manifest" href="/manifest.mhoo.json" />

    <meta name="theme-color" content="#0b5cff" />
    <meta
      name="description"
      content="Mhoo is a managed business workspace powered by Twenty."
    />
    <meta
      property="og:image"
      content="https://mhoo.app/images/mhoo/mhoo-snout-white-1024.png"
    />
    <meta
      property="og:description"
      content="Mhoo is a managed business workspace powered by Twenty."
    />
    <meta property="og:title" content="Mhoo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta
      name="twitter:image"
      content="https://mhoo.app/images/mhoo/mhoo-snout-white-1024.png"
    />

    <meta
      name="twitter:description"
      content="Mhoo is a managed business workspace powered by Twenty."
    />
    <meta name="twitter:title" content="Mhoo" />
    <title>Mhoo</title>
    <!-- END: Customer Brand -->`;

export function generateFrontConfig({
  isMhooFoundationEnabled = false,
}: GenerateFrontConfigOptions = {}): void {
  // A page served by this server can always reach the API on the origin it
  // was loaded from, so the front resolves it from window.location (see
  // packages/twenty-front/src/config). Rewriting clears any value baked into
  // index.html at build time.
  const configString = `<!-- BEGIN: Twenty Config -->
    <script id="twenty-env-config">
      window._env_ = {};
    </script>
    <!-- END: Twenty Config -->`;

  const distPath = path.join(__dirname, '..', 'front');
  const indexPath = path.join(distPath, 'index.html');

  try {
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    indexContent = indexContent.replace(
      /<!-- BEGIN: Twenty Config -->[\s\S]*?<!-- END: Twenty Config -->/,
      configString,
    );
    indexContent = indexContent.replace(
      /<!-- BEGIN: Customer Brand -->[\s\S]*?<!-- END: Customer Brand -->/,
      isMhooFoundationEnabled
        ? MHOO_CUSTOMER_BRAND_BLOCK
        : TWENTY_CUSTOMER_BRAND_BLOCK,
    );

    fs.writeFileSync(indexPath, indexContent, 'utf8');
  } catch {
    // oxlint-disable-next-line no-console
    console.log(
      'Frontend build not found or not writable, assuming it is served independently',
    );
  }
}
