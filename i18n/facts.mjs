export const facts = {
  baseUrl: 'https://japanusedcars.nice.okinawa',
  businessName: 'OKINAWA AUTO',
  siteName: 'Okinawa Auto Japan Used Cars',
  screenshotVersion: 'v2026.06.14',
  contact: {
    whatsapp: '+81 70-8952-3968',
    whatsappUrl: 'https://wa.me/817089523968',
    email: 'info@nice.okinawa',
    wechat: 'OkinawaOnline'
  },
  form: {
    endpoint: 'https://inquiry-nice-okinawa-preview.gerheidicn.workers.dev/api/inquiries',
    turnstileSitekey: '0x4AAAAAADvhTRK9Z-f9ydQ1',
    turnstileAction: 'japanusedcars-inquiry-v1',
    site: 'japanusedcars',
    sourceSite: 'japanusedcars.nice.okinawa',
    defaultProject: 'Japan used car inquiry',
    purposeOptions: [
      ['purposeExport', 'Export to my country / region'],
      ['purposeLocal', 'Local purchase in Okinawa'],
      ['purposeBrowse', 'Just browsing / price check']
    ]
  },
  analytics: {
    beacon: 'https://analytics.nice.okinawa/beacon.js',
    site: 'japanusedcars'
  },
  company: {
    areaServed: ['Asia', 'Oceania', 'Middle East', 'Africa', 'Europe', 'Americas']
  },
  countries: [
    {
      group: 'Asia',
      options: [
        ['China', 'China'],
        ['Taiwan', 'Taiwan'],
        ['Hong Kong', 'Hong Kong'],
        ['Macau', 'Macau'],
        ['South Korea', 'South Korea'],
        ['Mongolia', 'Mongolia'],
        ['Singapore', 'Singapore'],
        ['Malaysia', 'Malaysia'],
        ['Thailand', 'Thailand'],
        ['Vietnam', 'Vietnam'],
        ['Philippines', 'Philippines'],
        ['Indonesia', 'Indonesia'],
        ['Myanmar', 'Myanmar'],
        ['Sri Lanka', 'Sri Lanka'],
        ['Bangladesh', 'Bangladesh'],
        ['Pakistan', 'Pakistan'],
        ['India', 'India']
      ]
    },
    {
      group: 'Oceania',
      options: [
        ['Australia', 'Australia'],
        ['New Zealand', 'New Zealand'],
        ['Fiji', 'Fiji'],
        ['Papua New Guinea', 'Papua New Guinea']
      ]
    },
    {
      group: 'Middle East',
      options: [
        ['United Arab Emirates', 'United Arab Emirates'],
        ['Saudi Arabia', 'Saudi Arabia'],
        ['Oman', 'Oman'],
        ['Jordan', 'Jordan'],
        ['Israel', 'Israel']
      ]
    },
    {
      group: 'Africa',
      options: [
        ['Kenya', 'Kenya'],
        ['Tanzania', 'Tanzania'],
        ['Uganda', 'Uganda'],
        ['Zambia', 'Zambia'],
        ['Zimbabwe', 'Zimbabwe'],
        ['Malawi', 'Malawi'],
        ['Mozambique', 'Mozambique'],
        ['Botswana', 'Botswana'],
        ['DR Congo', 'DR Congo'],
        ['South Africa', 'South Africa'],
        ['Nigeria', 'Nigeria'],
        ['Ghana', 'Ghana']
      ]
    },
    {
      group: 'Europe',
      options: [
        ['United Kingdom', 'United Kingdom'],
        ['Ireland', 'Ireland'],
        ['Netherlands', 'Netherlands'],
        ['Germany', 'Germany'],
        ['France', 'France'],
        ['Cyprus', 'Cyprus'],
        ['Malta', 'Malta'],
        ['Georgia', 'Georgia'],
        ['Russia', 'Russia']
      ]
    },
    {
      group: 'Americas',
      options: [
        ['United States', 'USA'],
        ['Canada', 'Canada'],
        ['Chile', 'Chile'],
        ['Paraguay', 'Paraguay'],
        ['Bolivia', 'Bolivia'],
        ['Guyana', 'Guyana'],
        ['Trinidad and Tobago', 'Trinidad and Tobago'],
        ['Jamaica', 'Jamaica']
      ]
    }
  ],
  specialCountryOptions: [
    ['Japan (Okinawa local)', 'Japan (Okinawa Local)']
  ],
  otherCountryOption: ['Other country or region', 'Other'],
  vehicles: [
    {
      maker: 'Toyota',
      model: 'Alphard 2.5S',
      year: '2020',
      mileage: '28,000 km',
      color: 'Pearl White',
      statusKey: 'vehicle.status.availableExport'
    },
    {
      maker: 'Nissan',
      model: 'X-Trail 20X',
      year: '2019',
      mileage: '34,500 km',
      color: 'Black',
      statusKey: 'vehicle.status.ready'
    },
    {
      maker: 'Honda',
      model: 'Vezel Hybrid Z',
      year: '2021',
      mileage: '19,200 km',
      color: 'Metallic Blue',
      statusKey: 'vehicle.status.auction'
    }
  ],
  geoPages: [
    {
      slug: 'how-it-works',
      source: 'how-it-works/index.html',
      jsonLd: 'HowTo'
    },
    {
      slug: 'pricing',
      source: 'pricing/index.html',
      jsonLd: 'FAQPage'
    },
    {
      slug: 'faq',
      source: 'faq/index.html',
      jsonLd: 'FAQPage'
    }
  ]
};
