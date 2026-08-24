import { getCustomerBrand } from '@/branding/utils/getCustomerBrand';

describe('getCustomerBrand', () => {
  it('keeps the upstream customer brand by default', () => {
    expect(getCustomerBrand(false).name).toBe('Twenty');
  });

  it('returns Mhoo customer-facing identity in foundation mode', () => {
    expect(getCustomerBrand(true)).toMatchObject({
      name: 'Mhoo',
      websiteUrl: 'https://mhoo.app/',
    });
  });
});
