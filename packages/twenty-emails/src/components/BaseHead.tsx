import { Font, Head } from 'react-email';

import { canvasTheme } from 'src/common-style';
import { getEmailCustomerBrand } from 'src/components/get-customer-brand';

export const BaseHead = () => {
  const brand = getEmailCustomerBrand();

  return (
    <Head>
      <title>{brand.name} email</title>
      <Font
        fontFamily={canvasTheme.font.family}
        fallbackFontFamily="sans-serif"
        fontStyle="normal"
        fontWeight={canvasTheme.font.weight.regular}
      />
    </Head>
  );
};
