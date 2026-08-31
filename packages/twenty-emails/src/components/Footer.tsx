import { type I18n } from '@lingui/core';
import { Column, Container, Row } from 'react-email';
import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';
import { getEmailCustomerBrand } from 'src/components/get-customer-brand';

const footerContainerStyle = {
  marginTop: '12px',
};

type FooterProps = {
  i18n: I18n;
};

export const Footer = ({ i18n }: FooterProps) => {
  const brand = getEmailCustomerBrand();

  return (
    <Container style={footerContainerStyle}>
      <Row>
        <Column>
          <ShadowText>
            <Link
              href={brand.websiteUrl}
              value={i18n._('Website')}
              aria-label={i18n._(`Visit ${brand.name}'s website`)}
            />
          </ShadowText>
        </Column>
        {brand.name === 'Twenty' && (
          <>
            <Column>
              <ShadowText>
                <Link
                  href="https://github.com/twentyhq/twenty"
                  value={i18n._('Github')}
                  aria-label={i18n._("Visit Twenty's GitHub repository")}
                />
              </ShadowText>
            </Column>
            <Column>
              <ShadowText>
                <Link
                  href="https://docs.twenty.com/getting-started/introduction"
                  value={i18n._('User guide')}
                  aria-label={i18n._("Read Twenty's user guide")}
                />
              </ShadowText>
            </Column>
            <Column>
              <ShadowText>
                <Link
                  href="https://docs.twenty.com/"
                  value={i18n._('Developers')}
                  aria-label={i18n._("Visit Twenty's developer documentation")}
                />
              </ShadowText>
            </Column>
          </>
        )}
        {brand.name === 'Mhoo' && (
          <>
            <Column>
              <ShadowText>
                <Link
                  href={brand.privacyUrl}
                  value={i18n._('Privacy')}
                  aria-label={i18n._("Read Mhoo's Privacy Policy")}
                />
              </ShadowText>
            </Column>
            <Column>
              <ShadowText>
                <Link
                  href={brand.termsUrl}
                  value={i18n._('Terms')}
                  aria-label={i18n._("Read Mhoo's Terms of Service")}
                />
              </ShadowText>
            </Column>
            {brand.platformAttribution !== null && (
              <Column>
                <ShadowText>
                  <Link
                    href={brand.platformAttribution.url}
                    value={brand.platformAttribution.label}
                    aria-label={i18n._('Visit Twenty')}
                  />
                </ShadowText>
              </Column>
            )}
          </>
        )}
      </Row>
      <ShadowText>
        <>
          {brand.legalName}
          <br />
          {brand.location}
        </>
      </ShadowText>
    </Container>
  );
};
