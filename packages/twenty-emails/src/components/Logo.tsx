import { Img } from 'react-email';
import { getEmailCustomerBrand } from 'src/components/get-customer-brand';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  const brand = getEmailCustomerBrand();

  return (
    <Img
      src={brand.logoUrl}
      alt={`${brand.name} logo`}
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
