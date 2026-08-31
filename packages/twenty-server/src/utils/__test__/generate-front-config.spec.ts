import * as fs from 'fs';

import { generateFrontConfig } from 'src/utils/generate-front-config';

// dotenv runs at import time with override: true, which would clobber the
// per-test process.env we set below. Neutralize it so each test controls env.
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

const INDEX_TEMPLATE = `<html>
  <head>
    <!-- BEGIN: Customer Brand -->
    <title>Twenty</title>
    <!-- END: Customer Brand -->
    <!-- BEGIN: Twenty Config -->
    <script id="twenty-env-config">
      window._env_ = {"REACT_APP_SERVER_BASE_URL":"http://stale-value"};
    </script>
    <!-- END: Twenty Config -->
  </head>
</html>`;

// Pull the injected _env_ object back out of the written index.html and
// normalize whitespace so the multi-line output can be compared against a
// compact expected string.
const getInjectedEnv = (): string => {
  const writtenContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
  const match = writtenContent.match(/window\._env_ = (\{[\s\S]*?\});/);

  return match ? match[1].replace(/\s+/g, '') : '';
};

const getWrittenContent = (callIndex = 0): string =>
  mockedFs.writeFileSync.mock.calls[callIndex][1] as string;

describe('generateFrontConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    mockedFs.readFileSync.mockReturnValue(INDEX_TEMPLATE);
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should clear any baked value so the front resolves the API origin from the page origin', () => {
    process.env.SERVER_URL = 'http://x.com';

    generateFrontConfig();

    expect(getInjectedEnv()).toBe('{}');
  });

  it('keeps the upstream shell when Mhoo foundation mode is disabled', () => {
    generateFrontConfig({ isMhooFoundationEnabled: false });

    expect(getWrittenContent()).toContain('<title>Twenty</title>');
    expect(getWrittenContent()).toContain('href="/manifest.json"');
    expect(getWrittenContent()).not.toContain('<title>Mhoo</title>');
  });

  it('writes the Mhoo shell and powered-by description in foundation mode', () => {
    generateFrontConfig({ isMhooFoundationEnabled: true });

    expect(getWrittenContent()).toContain('<title>Mhoo</title>');
    expect(getWrittenContent()).toContain('href="/manifest.mhoo.json"');
    expect(getWrittenContent()).toContain(
      'Mhoo is a managed business workspace powered by Twenty.',
    );
  });

  it('can restore the upstream shell after a foundation-mode restart', () => {
    generateFrontConfig({ isMhooFoundationEnabled: true });
    mockedFs.readFileSync.mockReturnValue(getWrittenContent());

    generateFrontConfig({ isMhooFoundationEnabled: false });

    expect(getWrittenContent(1)).toContain('<title>Twenty</title>');
    expect(getWrittenContent(1)).not.toContain('<title>Mhoo</title>');
  });
});
