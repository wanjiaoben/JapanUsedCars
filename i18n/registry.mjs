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
    }
  ],
  "hiddenPages": [
    {
      "id": "cases",
      "urlPath": "/cases/"
    }
  ]
};
