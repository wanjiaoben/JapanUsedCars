export default {
  "brand": {
    "name": "Okinawa Auto",
    "displayName": "OKINAWA AUTO",
    "network": "OkinawaOnline",
    "company": "Okinawa Auto"
  },
  "site": {
    "url": "https://japanusedcars.nice.okinawa",
    "host": "japanusedcars.nice.okinawa"
  },
  "contact": {
    "email": "info@nice.okinawa",
    "phoneDisplay": "+81 70-8952-3968",
    "whatsappNumber": "817089523968",
    "whatsappUrl": "https://wa.me/817089523968",
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=Okinawa%2C%20Japan"
  },
  "form": {
    "endpoint": "https://inquiry-nice-okinawa-preview.gerheidicn.workers.dev/api/inquiries",
    "site": "japanusedcars",
    "sourceSite": "japanusedcars.nice.okinawa",
    "turnstileSiteKey": "0x4AAAAAADvhTRK9Z-f9ydQ1",
    "turnstileAction": "japanusedcars-inquiry-v1",
    "purposes": [
      {
        "value": "Export to my country / region",
        "labelKey": "form.purpose.export"
      },
      {
        "value": "Local purchase in Okinawa",
        "labelKey": "form.purpose.local"
      },
      {
        "value": "Just browsing / price check",
        "labelKey": "form.purpose.browse"
      }
    ]
  },
  "currency": {
    "code": "JPY"
  },
  "pricing": {
    "publicVehiclePrice": "Inquiry"
  },
  "vehicles": {
    "alphard": {
      "id": "vehicle_01",
      "brand": "Toyota",
      "model": "Alphard 2.5S",
      "year": "2020",
      "mileage": "28,000 km",
      "colorKey": "vehicleColors.pearlWhite",
      "statusKey": "vehicle.status.export",
      "media": {
        "type": "emoji",
        "value": "🚗"
      }
    },
    "hiace": {
      "id": "vehicle_02",
      "brand": "Toyota",
      "model": "Hiace Van GL",
      "year": "2019",
      "mileage": "42,000 km",
      "colorKey": "vehicleColors.silver",
      "statusKey": "vehicle.status.export",
      "media": {
        "type": "emoji",
        "value": "🚙"
      }
    },
    "serena": {
      "id": "vehicle_03",
      "brand": "Nissan",
      "model": "Serena e-POWER",
      "year": "2021",
      "mileage": "19,500 km",
      "colorKey": "vehicleColors.darkBlue",
      "statusKey": "vehicle.status.localExport",
      "media": {
        "type": "emoji",
        "value": "🏎️"
      }
    },
    "stepwgn": {
      "id": "vehicle_04",
      "brand": "Honda",
      "model": "Stepwgn Spada",
      "year": "2020",
      "mileage": "33,000 km",
      "colorKey": "vehicleColors.black",
      "statusKey": "vehicle.status.local",
      "media": {
        "type": "emoji",
        "value": "🚐"
      }
    },
    "cx5": {
      "id": "vehicle_05",
      "brand": "Mazda",
      "model": "CX-5 XD",
      "year": "2021",
      "mileage": "24,000 km",
      "colorKey": "vehicleColors.soulRed",
      "statusKey": "vehicle.status.export",
      "media": {
        "type": "emoji",
        "value": "🚘"
      }
    }
  },
  "countryGroups": [
    {
      "key": "asia",
      "labelKey": "form.countryGroups.asia",
      "countries": [
        "China",
        "Taiwan",
        "Hong Kong",
        "Macau",
        "South Korea",
        "Mongolia",
        "Singapore",
        "Malaysia",
        "Thailand",
        "Vietnam",
        "Philippines",
        "Indonesia",
        "Myanmar",
        "Sri Lanka",
        "Bangladesh",
        "Pakistan",
        "India"
      ]
    },
    {
      "key": "oceania",
      "labelKey": "form.countryGroups.oceania",
      "countries": [
        "Australia",
        "New Zealand",
        "Fiji",
        "Papua New Guinea"
      ]
    },
    {
      "key": "middleEast",
      "labelKey": "form.countryGroups.middleEast",
      "countries": [
        "United Arab Emirates",
        "Saudi Arabia",
        "Oman",
        "Jordan",
        "Israel"
      ]
    },
    {
      "key": "africa",
      "labelKey": "form.countryGroups.africa",
      "countries": [
        "Kenya",
        "Tanzania",
        "Uganda",
        "Zambia",
        "Zimbabwe",
        "Malawi",
        "Mozambique",
        "Botswana",
        "DR Congo",
        "South Africa",
        "Nigeria",
        "Ghana"
      ]
    },
    {
      "key": "europe",
      "labelKey": "form.countryGroups.europe",
      "countries": [
        "United Kingdom",
        "Ireland",
        "Netherlands",
        "Germany",
        "France",
        "Cyprus",
        "Malta",
        "Georgia",
        "Russia"
      ]
    },
    {
      "key": "americas",
      "labelKey": "form.countryGroups.americas",
      "countries": [
        "United States",
        "Canada",
        "Chile",
        "Paraguay",
        "Bolivia",
        "Guyana",
        "Trinidad and Tobago",
        "Jamaica"
      ]
    }
  ],
  "analytics": {
    "beaconUrl": "https://analytics.nice.okinawa/beacon.js"
  }
};
