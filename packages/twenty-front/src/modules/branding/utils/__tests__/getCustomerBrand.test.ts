import { getCustomerBrand } from '@/branding/utils/getCustomerBrand';

describe('getCustomerBrand', () => {
  it('keeps the upstream customer brand by default', () => {
    expect(getCustomerBrand(false).name).toBe('Twenty');
  });

  it('returns Mhoo customer-facing identity in foundation mode', () => {
    expect(getCustomerBrand(true)).toMatchObject({
      name: 'Mhoo',
      logoUrl: '/images/mhoo/mhoo-snout-transparent-1024.png',
      websiteUrl: 'https://mhoo.app/',
      termsUrl: 'https://mhoo.app/terms/',
      dataProcessingAgreementUrl: null,
      privacyUrl: 'https://mhoo.app/privacy/',
      platformAttribution: {
        label: 'Powered by Twenty',
        url: 'https://twenty.com/',
      },
    });
  });
});
