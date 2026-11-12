export default {
  "sourceLocale": "en",
  "locales": {
    "en": {
      "code": "en",
      "htmlLang": "en",
      "ogLocale": "en_US",
      "basePath": "/",
      "label": "EN"
    },
    "ru": {
      "code": "ru",
      "htmlLang": "ru",
      "ogLocale": "ru_RU",
      "basePath": "/ru/",
      "label": "RU"
    }
  },
  "pages": [
    {
      "id": "home",
      "template": "home.html",
      "output": {
        "en": "index.html",
        "ru": "ru/index.html"
      },
      "urlPath": {
        "en": "/",
        "ru": "/ru/"
      }
    },
    {
      "id": "how",
      "template": "how-it-works.html",
      "output": {
        "en": "how-it-works/index.html",
        "ru": "ru/how-it-works/index.html"
      },
      "urlPath": {
        "en": "/how-it-works/",
        "ru": "/ru/how-it-works/"
      }
    },
    {
      "id": "pricing",
      "template": "pricing.html",
      "output": {
        "en": "pricing/index.html",
        "ru": "ru/pricing/index.html"
      },
      "urlPath": {
        "en": "/pricing/",
        "ru": "/ru/pricing/"
      }
    },
    {
      "id": "faq",
      "template": "faq.html",
      "output": {
        "en": "faq/index.html",
        "ru": "ru/faq/index.html"
      },
      "urlPath": {
        "en": "/faq/",
        "ru": "/ru/faq/"
      }
    },
    {
      "id": "uk",
      "template": "country-uk.html",
      "locales": [
        "en"
      ],
      "htmlLang": {
        "en": "en-GB"
      },
      "ogLocale": {
        "en": "en_GB"
      },
      "hreflang": {
        "en": "en-GB"
      },
      "output": {
        "en": "uk/index.html"
      },
      "urlPath": {
        "en": "/uk/"
      }
    },
    {
      "id": "ireland",
      "template": "country-ireland.html",
      "locales": [
        "en"
      ],
      "htmlLang": {
        "en": "en-IE"
      },
      "ogLocale": {
        "en": "en_IE"
      },
      "hreflang": {
        "en": "en-IE"
      },
      "output": {
        "en": "ireland/index.html"
      },
      "urlPath": {
        "en": "/ireland/"
      }
    },
    {
      "id": "new-zealand",
      "template": "country-new-zealand.html",
      "locales": [
        "en"
      ],
      "htmlLang": {
        "en": "en-NZ"
      },
      "ogLocale": {
        "en": "en_NZ"
      },
      "hreflang": {
        "en": "en-NZ"
      },
      "output": {
        "en": "new-zealand/index.html"
      },
      "urlPath": {
        "en": "/new-zealand/"
      }
    },
    {
      "id": "hong-kong",
      "template": "country-hong-kong.html",
      "locales": [
        "en"
      ],
      "htmlLang": {
        "en": "zh-HK"
      },
      "ogLocale": {
        "en": "zh_HK"
      },
      "hreflang": {
        "en": "zh-HK"
      },
      "output": {
        "en": "hong-kong/index.html"
      },
      "urlPath": {
        "en": "/hong-kong/"
      },
      "dock": {
        "aria": "快速聯絡",
        "emailLabel": "電郵",
        "whatsappPrefill": "你好，我想查詢日本二手車入口香港的 CIF 報價。車型："
      }
    },
    {
      "id": "auction-sheet",
      "template": "guide-auction-sheet.html",
      "locales": [
        "en"
      ],
      "htmlLang": {
        "en": "en"
      },
      "ogLocale": {
        "en": "en_US"
      },
      "hreflang": {
        "en": "en"
      },
      "output": {
        "en": "auction-sheet/index.html"
      },
      "urlPath": {
        "en": "/auction-sheet/"
      }
    }
  ],
  "hiddenPages": [
    {
      "id": "cases",
      "urlPath": "/cases/"
    }
  ]
};
