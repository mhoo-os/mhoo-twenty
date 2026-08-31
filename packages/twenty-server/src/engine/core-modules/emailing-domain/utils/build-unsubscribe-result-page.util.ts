import { escapeHtml } from 'src/engine/core-modules/emailing-domain/utils/escape-html.util';
import { type EmailingPublicPageBrand } from 'src/engine/core-modules/emailing-domain/types/emailing-public-page-brand.type';

const PAGE_STYLE = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa;margin:0;padding:48px 16px;color:#1a1a1a;text-align:center}.card{max-width:420px;margin:0 auto;background:#fff;border:1px solid #ededed;border-radius:16px;padding:48px 32px}.brand{display:inline-flex;align-items:center;gap:8px;margin-bottom:28px;color:#1a1a1a;font-weight:700;text-decoration:none}.brand img{width:32px;height:32px;object-fit:contain}h1{font-size:24px;font-weight:700;margin:0 0 8px}p{color:#888;margin:0}.footer{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:28px;color:#888;font-size:12px}.footer a{color:#888}`;

export const buildUnsubscribeResultPage = (
  title: string,
  message: string,
  brand?: EmailingPublicPageBrand,
): string => {
  const brandHeader = brand
    ? `<a class="brand" href="${escapeHtml(brand.websiteUrl)}"><img src="${escapeHtml(brand.logoUrl)}" alt="" /><span>${escapeHtml(brand.name)}</span></a>`
    : '';
  const brandFooter = brand
    ? `<div class="footer"><a href="${escapeHtml(brand.privacyUrl)}">Privacy</a><a href="${escapeHtml(brand.termsUrl)}">Terms</a><a href="${escapeHtml(brand.platformAttribution.url)}">${escapeHtml(brand.platformAttribution.label)}</a></div>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(
    title,
  )}</title><style>${PAGE_STYLE}</style></head><body><div class="card">${brandHeader}<h1>${escapeHtml(
    title,
  )}</h1><p>${escapeHtml(message)}</p>${brandFooter}</div></body></html>`;
};
