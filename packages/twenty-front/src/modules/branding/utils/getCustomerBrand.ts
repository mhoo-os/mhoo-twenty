export type CustomerBrand = {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  termsUrl: string;
  dataProcessingAgreementUrl: string;
  privacyUrl: string;
};

const TWENTY_BRAND: CustomerBrand = {
  name: 'Twenty',
  logoUrl: '/images/icons/android/android-launchericon-192-192.png',
  websiteUrl: 'https://twenty.com/',
  termsUrl: 'https://twenty.com/legal/terms',
  dataProcessingAgreementUrl: 'https://twenty.com/legal/dpa',
  privacyUrl: 'https://twenty.com/legal/privacy',
};

const MHOO_BRAND: CustomerBrand = {
  name: 'Mhoo',
  // No Mhoo visual asset is introduced by the foundation fork. This stable
  // location is the intentional replacement seam for a later approved asset.
  logoUrl: '/images/icons/android/android-launchericon-192-192.png',
  websiteUrl: 'https://mhoo.app/',
  termsUrl: 'https://mhoo.app/legal/terms',
  dataProcessingAgreementUrl: 'https://mhoo.app/legal/dpa',
  privacyUrl: 'https://mhoo.app/legal/privacy',
};

export const getCustomerBrand = (
  isMhooFoundationEnabled: boolean,
): CustomerBrand => (isMhooFoundationEnabled ? MHOO_BRAND : TWENTY_BRAND);
