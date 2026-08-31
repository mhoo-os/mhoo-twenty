export type CustomerBrand = {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  termsUrl: string;
  dataProcessingAgreementUrl: string | null;
  privacyUrl: string;
  platformAttribution: {
    label: string;
    url: string;
  } | null;
};

const TWENTY_BRAND: CustomerBrand = {
  name: 'Twenty',
  logoUrl: '/images/icons/android/android-launchericon-192-192.png',
  websiteUrl: 'https://twenty.com/',
  termsUrl: 'https://twenty.com/legal/terms',
  dataProcessingAgreementUrl: 'https://twenty.com/legal/dpa',
  privacyUrl: 'https://twenty.com/legal/privacy',
  platformAttribution: null,
};

const MHOO_BRAND: CustomerBrand = {
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
};

export const getCustomerBrand = (
  isMhooFoundationEnabled: boolean,
): CustomerBrand => (isMhooFoundationEnabled ? MHOO_BRAND : TWENTY_BRAND);
