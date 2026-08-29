import { workspacePublicDataState } from '@/auth/states/workspacePublicDataState';
import { DEFAULT_WORKSPACE_LOGO } from '@/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getImageAbsoluteURI } from 'twenty-shared/utils';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { getCustomerBrand } from '@/branding/utils/getCustomerBrand';
import { isMhooFoundationEnabledState } from '@/client-config/states/isMhooFoundationEnabledState';

export const PageFavicon = () => {
  const workspacePublicData = useAtomStateValue(workspacePublicDataState);
  const isMhooFoundationEnabled = useAtomStateValue(
    isMhooFoundationEnabledState,
  );
  const brand = getCustomerBrand(isMhooFoundationEnabled);
  return (
    <Helmet>
      <link
        rel="icon"
        type="image/x-icon"
        href={
          workspacePublicData?.logo
            ? (getImageAbsoluteURI({
                imageUrl: workspacePublicData.logo,
                baseUrl: REACT_APP_SERVER_BASE_URL,
              }) ?? DEFAULT_WORKSPACE_LOGO)
            : brand.logoUrl
        }
      />
    </Helmet>
  );
};
