export const sourceLocale = 'en';

export const locales = {
  en: {
    code: 'en',
    label: 'EN',
    htmlLang: 'en',
    ogLocale: 'en_US',
    pathPrefix: '',
    dir: 'ltr',
    isSource: true
  },
  ru: {
    code: 'ru',
    label: 'RU',
    htmlLang: 'ru',
    ogLocale: 'ru_RU',
    pathPrefix: 'ru',
    dir: 'ltr',
    isSource: false
  }
};

export const pages = [
  {
    id: 'home',
    slug: '',
    outFile: 'index.html',
    type: 'home',
    hasRu: true,
    priority: '1.0'
  },
  {
    id: 'how',
    slug: 'how-it-works',
    outFile: 'how-it-works/index.html',
    type: 'how',
    hasRu: true,
    priority: '0.8'
  },
  {
    id: 'pricing',
    slug: 'pricing',
    outFile: 'pricing/index.html',
    type: 'pricing',
    hasRu: true,
    priority: '0.8'
  },
  {
    id: 'faq',
    slug: 'faq',
    outFile: 'faq/index.html',
    type: 'faq',
    hasRu: true,
    priority: '0.8'
  },
  {
    id: 'cases',
    slug: 'cases',
    outFile: 'cases/index.html',
    type: 'cases',
    hasRu: false,
    priority: '0.3',
    noindex: true
  }
];
