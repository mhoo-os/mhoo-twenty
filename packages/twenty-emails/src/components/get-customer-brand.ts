export type EmailCustomerBrand = {
  name: string;
  legalName: string;
  location: string;
  logoUrl: string;
  websiteUrl: string;
  privacyUrl: string;
  termsUrl: string;
  platformAttribution: {
    label: string;
    url: string;
  } | null;
};

export const getEmailCustomerBrand = (): EmailCustomerBrand => {
  if (process.env.IS_MHOO_FOUNDATION_ENABLED === 'true') {
    return {
      name: 'Mhoo',
      legalName: 'MHOO Co., Ltd.',
      location: 'Bangkok, Thailand',
      logoUrl: 'https://mhoo.app/images/mhoo/mhoo-snout-transparent-1024.png',
      websiteUrl: 'https://mhoo.app/',
      privacyUrl: 'https://mhoo.app/privacy/',
      termsUrl: 'https://mhoo.app/terms/',
      platformAttribution: {
        label: 'Powered by Twenty',
        url: 'https://twenty.com/',
      },
    };
  }

  return {
    name: 'Twenty',
    legalName: 'Twenty.com, Public Benefit Corporation',
    location: 'San Francisco / Paris',
    logoUrl:
      'https://app.twenty.com/images/icons/windows11/Square150x150Logo.scale-100.png',
    websiteUrl: 'https://twenty.com/',
    privacyUrl: 'https://twenty.com/legal/privacy',
    termsUrl: 'https://twenty.com/legal/terms',
    platformAttribution: null,
  };
};
