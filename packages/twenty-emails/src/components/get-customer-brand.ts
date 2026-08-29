export type EmailCustomerBrand = {
  name: string;
  logoUrl: string;
  websiteUrl: string;
};

export const getEmailCustomerBrand = (): EmailCustomerBrand => {
  if (process.env.IS_MHOO_FOUNDATION_ENABLED === 'true') {
    return {
      name: 'Mhoo',
      logoUrl:
        'https://app.mhoo.app/images/icons/windows11/Square150x150Logo.scale-100.png',
      websiteUrl: 'https://mhoo.app/',
    };
  }

  return {
    name: 'Twenty',
    logoUrl:
      'https://app.twenty.com/images/icons/windows11/Square150x150Logo.scale-100.png',
    websiteUrl: 'https://twenty.com/',
  };
};
