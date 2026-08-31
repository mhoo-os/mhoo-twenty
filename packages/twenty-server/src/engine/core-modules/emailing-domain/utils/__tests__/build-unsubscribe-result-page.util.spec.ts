import { buildUnsubscribeResultPage } from 'src/engine/core-modules/emailing-domain/utils/build-unsubscribe-result-page.util';

describe('buildUnsubscribeResultPage', () => {
  it('escapes result content', () => {
    const page = buildUnsubscribeResultPage(
      '<script>alert(1)</script>',
      '<strong>message</strong>',
    );

    expect(page).not.toContain('<script>');
    expect(page).not.toContain('<strong>');
  });

  it('renders the supplied customer brand and platform attribution', () => {
    const page = buildUnsubscribeResultPage('Done', 'Saved', {
      name: 'Mhoo',
      logoUrl: '/images/mhoo/logo.png',
      websiteUrl: 'https://mhoo.app/',
      privacyUrl: 'https://mhoo.app/privacy/',
      termsUrl: 'https://mhoo.app/terms/',
      platformAttribution: {
        label: 'Powered by Twenty',
        url: 'https://twenty.com/',
      },
    });

    expect(page).toContain('>Mhoo</span>');
    expect(page).toContain('>Powered by Twenty</a>');
  });
});
