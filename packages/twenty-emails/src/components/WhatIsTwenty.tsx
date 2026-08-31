import { type I18n } from '@lingui/core';
import { MainText } from 'src/components/MainText';
import { SubTitle } from 'src/components/SubTitle';
import { getEmailCustomerBrand } from 'src/components/get-customer-brand';

type WhatIsTwentyProps = {
  i18n: I18n;
};

export const WhatIsTwenty = ({ i18n }: WhatIsTwentyProps) => {
  const brand = getEmailCustomerBrand();

  return (
    <>
      <SubTitle
        value={
          brand.name === 'Mhoo'
            ? i18n._('What is Mhoo?')
            : i18n._('What is Twenty?')
        }
      />
      <MainText>
        {brand.name === 'Mhoo'
          ? i18n._(
              'Mhoo is a managed business workspace that helps teams organize customer data, relationships, and work. It is powered by Twenty.',
            )
          : i18n._(
              "It's a CRM, a software to help businesses manage their customer data and relationships efficiently.",
            )}
      </MainText>
    </>
  );
};
