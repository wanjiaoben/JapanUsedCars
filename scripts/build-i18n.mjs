import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const baseUrl = 'https://japanusedcars.nice.okinawa';

const pages = [
  { id: 'home', template: 'src/templates/index.html', out: 'index.html', ruOut: 'ru/index.html', enPath: '/', ruPath: '/ru/' },
  { id: 'how', template: 'src/templates/how-it-works.html', out: 'how-it-works/index.html', ruOut: 'ru/how-it-works/index.html', enPath: '/how-it-works/', ruPath: '/ru/how-it-works/' },
  { id: 'pricing', template: 'src/templates/pricing.html', out: 'pricing/index.html', ruOut: 'ru/pricing/index.html', enPath: '/pricing/', ruPath: '/ru/pricing/' },
  { id: 'faq', template: 'src/templates/faq.html', out: 'faq/index.html', ruOut: 'ru/faq/index.html', enPath: '/faq/', ruPath: '/ru/faq/' }
];

const replacements = [
  ['meta.home.title', 'Okinawa Used Cars | Japan Used Car Export & Purchase Support', 'Подержанные автомобили из Окинавы | экспорт авто из Японии'],
  ['meta.home.description', 'Okinawa used car and Japan used car export support for right-hand drive vehicles, local purchase inquiries, documentation, shipping coordination, and 二手车购入代行 consultation.', 'Подбор и экспорт подержанных автомобилей из Окинавы и Японии: праворульные автомобили, местные запросы, документы, координация отправки и консультации по покупке.'],
  ['meta.home.ogDescription', 'Okinawa used car and Japan used car export support for right-hand drive vehicles, documentation, shipping coordination, and local purchase inquiries.', 'Подбор и экспорт подержанных автомобилей из Окинавы и Японии: праворульные автомобили, документы, координация отправки и местные запросы.'],
  ['meta.home.keywords', 'Okinawa used car, Japan used car export, used cars Okinawa Japan, right-hand drive vehicles, buy car Japan, 二手车购入代行, 右舵車, 沖縄 中古車, used car dealer Okinawa, Toyota used car Japan', 'подержанные автомобили из Японии, экспорт подержанных автомобилей из Японии, автомобили с японских аукционов, покупка автомобиля на японском аукционе, праворульные автомобили, подержанные автомобили Окинава'],
  ['meta.how.title', 'How Japan Used Car Export Works | Okinawa Auto', 'Как работает экспорт подержанных автомобилей из Японии | Okinawa Auto'],
  ['meta.how.description', 'Step-by-step guide to buying an Okinawa used car for Japan used car export, from inquiry and auction sheet review to payment, shipping, documents, and arrival at port.', 'Пошаговое описание покупки подержанного автомобиля из Окинавы для экспорта из Японии: запрос, аукционный лист, оплата, отправка, документы и прибытие в порт.'],
  ['meta.pricing.title', 'Japan Used Car Export Pricing | FOB, CIF, Fees | Okinawa Auto', 'Цены на экспорт автомобилей из Японии | FOB, CIF и сборы | Okinawa Auto'],
  ['meta.pricing.description', 'How Okinawa Auto calculates Japan used car export pricing, including FOB, CIF, auction agent fees, inspection, shipping, payment timing, and what is not included.', 'Как Okinawa Auto рассчитывает экспортную цену автомобиля из Японии: FOB, CIF, агентские сборы, проверка, отправка, сроки оплаты и что не входит в цену.'],
  ['meta.faq.title', 'Japan Used Car Export FAQ | Okinawa Auto', 'FAQ по экспорту подержанных автомобилей из Японии | Okinawa Auto'],
  ['meta.faq.description', 'FAQ for Okinawa used car and Japan used car export buyers: export countries and regions, right-hand drive cars, age limits, payment safety, shipping schedules, cancellations, and documents.', 'FAQ для покупателей подержанных автомобилей из Окинавы и Японии: страны и регионы экспорта, правый руль, ограничения по возрасту, безопасность оплаты, расписание судов, отмена и документы.'],
  ['nav.services', 'Services', 'Услуги'],
  ['nav.vehicles', 'Vehicles', 'Автомобили'],
  ['nav.process', 'Process', 'Процесс'],
  ['nav.pricing', 'Pricing', 'Цены'],
  ['nav.contact', 'Contact', 'Контакты'],
  ['nav.how', 'How it works', 'Как это работает'],
  ['nav.home', 'Home', 'Главная'],
  ['home.hero.kicker', 'Okinawa, Japan · Est. 2024', 'Окинава, Япония · с 2024 года'],
  ['home.hero.title1', 'Okinawa Used Cars', 'Подержанные автомобили из Окинавы'],
  ['home.hero.title2', 'Japan Used Car Export', 'Экспорт подержанных автомобилей из Японии'],
  ['home.hero.desc', 'Right-hand drive Japanese used cars for export worldwide or local purchase in Okinawa, with documentation and shipping coordination.', 'Праворульные подержанные автомобили из Японии для экспортных запросов по миру или местной покупки в Окинаве, с документами и координацией отправки.'],
  ['home.hero.cta1', 'Inquire Now', 'Отправить запрос'],
  ['home.hero.cta2', 'Browse Vehicles', 'Смотреть автомобили'],
  ['home.stats.stock', 'Cars in Stock', 'автомобилей в наличии'],
  ['home.stats.regions', 'Countries & regions exported', 'стран и регионов экспорта'],
  ['home.stats.inspected', 'Inspected', 'проверено'],
  ['home.why.kicker', 'Why Buy from Japan', 'Почему покупают из Японии'],
  ['home.why.title.full', '<h2 class="section-title">The <em>Japanese advantage</em> in every vehicle</h2>', '<h2 class="section-title">Преимущество <em>японских автомобилей</em> в каждой машине</h2>'],
  ['home.why.title.b', 'Japanese advantage', 'японских автомобилей'],
  ['home.why.title.c', 'in every vehicle', 'в каждой машине'],
  ['home.why.inspection.title', 'Strict Vehicle Inspection', 'Строгая проверка автомобилей'],
  ['home.why.inspection.text', "Japan's shaken system enforces rigorous safety and emissions standards. Every vehicle on our lot has passed Japanese government inspection.", 'Японская система shaken применяет строгие требования к безопасности и выбросам. Каждый автомобиль на нашей площадке прошел государственную проверку в Японии.'],
  ['home.why.mileage.title', 'Low Mileage, Honest Records', 'Небольшой пробег и честные записи'],
  ['home.why.mileage.text', "Okinawa's compact geography means local vehicles accumulate less mileage. Full service history available for every car.", 'Компактная география Окинавы помогает местным автомобилям набирать меньше пробега. Полная сервисная история доступна по каждому автомобилю.'],
  ['home.why.climate.title', 'Okinawa Climate Advantage', 'Климатическое преимущество Окинавы'],
  ['home.why.climate.text', 'No snow, no road salt — Okinawa vehicles avoid the corrosion damage common in mainland Japan, giving you cleaner undercarriages.', 'Нет снега и дорожной соли — автомобили Окинавы избегают коррозии, часто встречающейся на материковой Японии, поэтому днище обычно чище.'],
  ['home.why.docs.title', 'Export Documentation', 'Экспортные документы'],
  ['home.why.docs.text', 'We handle all Japanese export paperwork: deregistration, export certificate, and shipping coordination to your country / region.', 'Мы занимаемся японскими экспортными документами: снятием с регистрации, экспортным сертификатом и координацией отправки в вашу страну или регион.'],
  ['home.why.lang.title', 'Multilingual Support', 'Многоязычная поддержка'],
  ['home.why.lang.text', 'English, Chinese, and Japanese communication. We understand the needs of international buyers and make the process smooth.', 'Общение на английском, китайском и японском. Мы понимаем потребности иностранных покупателей и делаем процесс понятным.'],
  ['home.why.port.title', 'Direct Port Access', 'Прямой доступ к порту'],
  ['home.why.port.text', 'Located in Okinawa with direct access to shipping routes to Taiwan, Southeast Asia, the Middle East, and beyond.', 'Мы находимся в Окинаве с доступом к морским маршрутам на Тайвань, в Юго-Восточную Азию, на Ближний Восток и дальше.'],
  ['home.offer.kicker', 'What We Offer', 'Что мы предлагаем'],
  ['home.offer.title.a', 'Two ways to', 'Два способа'],
  ['home.offer.title.b', 'get your car', 'получить автомобиль'],
  ['home.offer.export.title', 'Japan Used Car Export', 'Экспорт подержанных автомобилей из Японии'],
  ['home.offer.export.text', 'We support Japan used car export inquiries for buyers across Asia, the Middle East, Europe, and the Americas. From selection to shipping coordination, we manage the process so you receive export-ready documentation.', 'Мы принимаем запросы на экспорт подержанных автомобилей из Японии от покупателей из Азии, Ближнего Востока, Европы и Америки. От подбора до координации отправки мы ведем процесс так, чтобы вы получили документы, готовые для экспорта.'],
  ['home.offer.local.title', 'Okinawa Used Car Purchase Support', 'Поддержка покупки автомобиля в Окинаве'],
  ['home.offer.local.text', 'Residents and long-term visitors in Okinawa can inquire about local purchase support from our lot. We support foreign license transfers, help with local registration, and can assist with insurance referrals.', 'Жители и долгосрочные посетители Окинавы могут запросить поддержку покупки автомобиля с нашей площадки. Мы помогаем с иностранными водительскими правами, местной регистрацией и можем направить по вопросам страховки.'],
  ['home.offer.tag.auctionAgent', '二手车购入代行', 'Покупка на аукционе'],
  ['home.guides.kicker', 'Buyer Guides', 'Гиды для покупателей'],
  ['home.guides.title.a', 'Plan your', 'Планируйте'],
  ['home.guides.title.b', 'Japan used car export', 'экспорт автомобиля из Японии'],
  ['home.guides.how.title', 'How it works', 'Как это работает'],
  ['home.guides.how.text', 'From inquiry and auction sheet review to payment, export documents, shipping, and arrival at the destination port.', 'От запроса и проверки аукционного листа до оплаты, экспортных документов, отправки и прибытия в порт назначения.'],
  ['home.guides.how.link', 'Read the process', 'Читать процесс'],
  ['home.guides.pricing.title', 'Pricing basis', 'Основа расчета цены'],
  ['home.guides.pricing.text', 'Understand FOB, CIF, auction agent fees, inspection, freight, and buyer-side destination costs without fixed vehicle prices.', 'Разберите FOB, CIF, агентские сборы, проверку, фрахт и расходы покупателя в стране назначения без фиксированных цен на автомобили.'],
  ['home.guides.pricing.link', 'See the formula', 'Смотреть формулу'],
  ['home.guides.faq.title', 'Export FAQ', 'FAQ по экспорту'],
  ['home.guides.faq.text', 'Answers on countries and regions, right-hand drive vehicles, age limits, payment safety, shipping schedules, and cancellations.', 'Ответы о странах и регионах, праворульных автомобилях, возрастных ограничениях, безопасности оплаты, расписании судов и отмене.'],
  ['home.guides.faq.link', 'Open FAQ', 'Открыть FAQ'],
  ['home.stock.kicker', 'Current Stock', 'Текущие примеры'],
  ['home.stock.title.a', 'Featured', 'Рекомендуемые'],
  ['home.stock.title.b', 'Vehicles', 'автомобили'],
  ['home.stock.desc', 'Stock updates regularly. Contact us for a full current inventory list.', 'Наличие регулярно меняется. Свяжитесь с нами для актуального списка автомобилей.'],
  ['vehicle.year', 'Year', 'Год'],
  ['vehicle.mileage', 'Mileage', 'Пробег'],
  ['vehicle.color', 'Color', 'Цвет'],
  ['vehicle.status.export', 'Available for Export', 'Доступен для экспортного запроса'],
  ['vehicle.status.localExport', 'Local & Export', 'Местный запрос и экспорт'],
  ['vehicle.status.local', 'Local Stock', 'Местный склад'],
  ['home.stock.more', 'More vehicles available.', 'Доступны и другие автомобили.'],
  ['home.stock.contact', 'Contact us for full inventory.', 'Свяжитесь с нами для полного списка.'],
  ['home.stock.viewAll', 'View All', 'Смотреть все'],
  ['home.trust.auction', 'Every vehicle comes with its auction inspection sheet — an independent condition report issued by the Japanese auction house, not by us. Ask for it on any listing.', 'К каждому автомобилю прилагается аукционный лист — независимый отчет о состоянии, выданный японским аукционным домом, а не нами. Запросите его по любому объявлению.'],
  ['home.process.kicker', 'How It Works', 'Как это работает'],
  ['home.process.title.a', 'From', 'От'],
  ['home.process.title.b', 'inquiry to delivery', 'запроса до доставки'],
  ['home.process.title.c', '— step by step', '— шаг за шагом'],
  ['home.process.inquiry.title', 'Inquiry', 'Запрос'],
  ['home.process.inquiry.text', "Tell us what you're looking for — model, budget, year, destination country / region.", 'Сообщите, что вы ищете: модель, бюджет, год, страну или регион назначения.'],
  ['home.process.selection.title', 'Selection', 'Подбор'],
  ['home.process.selection.text', 'We send you matching options with photos, inspection reports, and pricing.', 'Мы отправляем подходящие варианты с фотографиями, отчетами проверки и расчетом цены.'],
  ['home.process.agreement.title', 'Agreement', 'Согласование'],
  ['home.process.agreement.text', 'Confirm your vehicle, review the contract, and pay the deposit to secure it.', 'Подтвердите автомобиль, проверьте договор и внесите депозит, чтобы закрепить покупку.'],
  ['home.process.export.title', 'Export / Prep', 'Экспорт / подготовка'],
  ['home.process.export.text', 'We handle Japanese deregistration, export certification, and shipping booking.', 'Мы занимаемся снятием с регистрации в Японии, экспортным сертификатом и бронированием отправки.'],
  ['home.process.delivery.title', 'Delivery', 'Доставка'],
  ['home.process.delivery.text', 'Vehicle arrives at your designated port with full documentation for local registration.', 'Автомобиль прибывает в указанный порт с полным пакетом документов для местной регистрации.'],
  ['home.faq.title.a', 'Okinawa used car and', 'FAQ по подержанным автомобилям из Окинавы'],
  ['home.faq.title.b', 'Japan used car export', 'и экспорту авто из Японии'],
  ['faq.warranty.q', 'Do you offer a warranty on the vehicles?', 'Предоставляете ли вы гарантию на автомобили?'],
  ['faq.warranty.a', 'No. All vehicles are sold as-is. Ownership and all associated risk transfer to the buyer once the vehicle is loaded and the vessel departs Japan. This is standard practice in Japanese used car export. What protects you is disclosure before purchase: every vehicle comes with its auction inspection sheet and condition grade, so you know exactly what you are buying before you commit.', 'Нет. Все автомобили продаются как есть. Право собственности и все связанные риски переходят к покупателю после погрузки автомобиля и выхода судна из Японии. Это стандартная практика экспорта подержанных автомобилей из Японии. Защита покупателя состоит в раскрытии информации до покупки: к каждому автомобилю прилагается аукционный инспекционный лист и оценка состояния, поэтому вы точно знаете, что покупаете, до принятия решения.'],
  ['faq.inspection.q', 'Can I inspect the car before buying, and what condition information do you provide?', 'Можно ли осмотреть автомобиль перед покупкой и какую информацию о состоянии вы предоставляете?'],
  ['faq.inspection.a', 'Vehicles are sourced through Japanese auction houses, and neither you nor we inspect them in person — the same is true of every exporter working this market. What you get instead is the auction inspection sheet: an independent assessment carried out by the auction house, covering the overall condition grade, interior grade, mileage verification, and a diagram marking scratches, dents, and rust. Grade S is the top rating. Export vehicles are de-registered and shipped without plates, so a Japanese 車検 (shaken) certificate does not carry over. Ask us for the auction sheet on any vehicle you are considering and we will send it before you decide.', 'Автомобили подбираются через японские аукционные дома, и ни вы, ни мы не осматриваем их лично — это верно для каждого экспортера, работающего на этом рынке. Вместо этого вы получаете аукционный инспекционный лист: независимую оценку, выполненную аукционным домом, с общей оценкой состояния, оценкой салона, проверкой пробега и схемой, где отмечены царапины, вмятины и ржавчина. Оценка S является высшей. Экспортные автомобили снимаются с регистрации и отправляются без номеров, поэтому японский сертификат 車検 (shaken) не переносится. Запросите у нас аукционный лист по любому автомобилю, который рассматриваете, и мы отправим его до вашего решения.'],
  ['faq.registration.q', 'Do you handle registration and ownership transfer?', 'Вы занимаетесь регистрацией и переходом права собственности?'],
  ['faq.registration.a', 'We sell for export, not for local Japanese registration. Every vehicle we ship goes through 抹消登録 (masshō tōroku), the Japanese deregistration process, and we prepare the export certificate and related documents. Registration in the destination country is handled by the buyer under local rules. One exception: if you are purchasing for rental-car operation, contact us directly and we will discuss it case by case.', 'Мы продаем автомобили на экспорт, а не для местной японской регистрации. Каждый автомобиль, который мы отправляем, проходит 抹消登録 (masshō tōroku), японскую процедуру снятия с регистрации, и мы готовим экспортный сертификат и связанные документы. Регистрация в стране назначения выполняется покупателем по местным правилам. Единственное исключение: если вы покупаете автомобиль для работы прокатного бизнеса, свяжитесь с нами напрямую, и мы обсудим это индивидуально.'],
  ['faq.shipping.q', 'How much is shipping, and what other costs are involved?', 'Сколько стоит отправка и какие еще расходы возможны?'],
  ['faq.shipping.a', 'We quote for Europe, New Zealand, and Southeast Asia. The figure depends on destination port, vessel schedule, and vehicle size, so we quote per inquiry rather than publish a fixed rate. Send us the model you are interested in and your destination port, and we will come back with a number. Contact us any time.', 'Мы рассчитываем отправку для Европы, Новой Зеландии и Юго-Восточной Азии. Сумма зависит от порта назначения, расписания судов и размера автомобиля, поэтому мы рассчитываем каждый запрос отдельно, а не публикуем фиксированную ставку. Отправьте модель, которая вас интересует, и порт назначения, и мы вернемся с расчетом. Связаться с нами можно в любое время.'],
  ['home.contact.kicker', 'Get in Touch', 'Связаться'],
  ['home.contact.title.a', 'Ready to find your', 'Готовы найти'],
  ['home.contact.title.b', 'next car?', 'следующий автомобиль?'],
  ['home.contact.text', "Whether you're buying locally in Okinawa or importing to your country / region, we're here to help. Reach out via your preferred channel — we respond within 24 hours.", 'Покупаете ли вы автомобиль в Окинаве или импортируете его в свою страну или регион, мы готовы помочь. Напишите удобным способом — мы отвечаем в течение 24 часов.'],
  ['form.heading', 'Send an Inquiry', 'Отправить запрос'],
  ['form.name', 'Your Name', 'Ваше имя'],
  ['form.country', 'Country / region', 'Страна или регион'],
  ['form.country.placeholder', 'Select country or region', 'Выберите страну или регион'],
  ['form.email', 'Email', 'Email'],
  ['form.purpose', 'Purpose', 'Цель'],
  ['form.purpose.placeholder', 'Select', 'Выберите'],
  ['form.purpose.export', 'Export to my country / region', 'Экспорт в мою страну или регион'],
  ['form.purpose.local', 'Local purchase in Okinawa', 'Покупка в Окинаве'],
  ['form.purpose.browse', 'Just browsing / price check', 'Пока смотрю и проверяю цену'],
  ['form.interest', 'Vehicle Interest', 'Интересующий автомобиль'],
  ['form.interest.placeholder', 'e.g. Toyota Alphard, budget ~$20,000 USD', 'например Toyota Alphard, бюджет около 20 000 USD'],
  ['form.message', 'Message', 'Сообщение'],
  ['form.message.placeholder', 'Any specific requirements, preferred colors, year range...', 'Особые требования, желаемый цвет, диапазон года...'],
  ['form.note', '* Please include your destination country or port if you need an export quote.', '* Укажите страну или порт назначения, если нужен экспортный расчет.'],
  ['form.submit', 'Send Inquiry →', 'Отправить запрос →'],
  ['form.status.sending', 'Sending your inquiry...', 'Отправляем запрос...'],
  ['form.status.ok', 'Thank you! We received your inquiry and will reply within 24 hours.', 'Спасибо! Мы получили ваш запрос и ответим в течение 24 часов.'],
  ['form.status.missingContact', 'Please enter your email. If this keeps failing, email info@nice.okinawa or use WhatsApp.', 'Введите email. Если ошибка повторится, напишите на info@nice.okinawa или используйте WhatsApp.'],
  ['form.status.missingTurnstile', 'Please complete the security check. If this keeps failing, email info@nice.okinawa or use WhatsApp.', 'Пройдите проверку безопасности. Если ошибка повторится, напишите на info@nice.okinawa или используйте WhatsApp.'],
  ['form.status.error', 'Could not send. Please email info@nice.okinawa or use WhatsApp instead.', 'Не удалось отправить. Напишите на info@nice.okinawa или используйте WhatsApp.'],
  ['geo.how.kicker', 'Japan used car export process', 'Процесс экспорта автомобилей из Японии'],
  ['geo.how.title.a', 'From Okinawa inquiry to', 'От запроса в Окинаве до'],
  ['geo.how.title.b', 'vehicle arrival at port', 'прибытия автомобиля в порт'],
  ['geo.how.intro', "This page explains the practical steps for buying an Okinawa used car for export. The exact schedule depends on stock status, auction timing, vessel availability, and the destination country's import process.", 'Эта страница объясняет практические шаги покупки подержанного автомобиля из Окинавы для экспорта. Точный график зависит от наличия автомобиля, сроков аукциона, доступности судов и импортного процесса страны назначения.'],
  ['geo.how.timeline.title', 'Typical timeline', 'Типичный график'],
  ['geo.how.timeline.text', 'Stock vehicles may move faster than auction purchases. Shipping schedules and destination port handling can change the final arrival date.', 'Автомобили со склада могут двигаться быстрее, чем аукционные покупки. Расписание судов и обработка в порту назначения могут изменить итоговую дату прибытия.'],
  ['geo.how.condition.title', 'Condition basis', 'Основа оценки состояния'],
  ['geo.how.condition.text', 'Vehicles sourced through Japanese auction houses come with an independent auction inspection sheet available on request before commitment.', 'Автомобили, подобранные через японские аукционные дома, имеют независимый аукционный инспекционный лист, доступный по запросу до подтверждения.'],
  ['geo.how.buyer.title', 'Buyer role', 'Роль покупателя'],
  ['geo.how.buyer.text', 'The buyer confirms import eligibility, prepares consignee details, and handles destination customs, taxes, registration, and local compliance.', 'Покупатель подтверждает импортную допустимость, готовит данные получателя и занимается таможней, налогами, регистрацией и местным соответствием в стране назначения.'],
  ['geo.how.step1.title', 'Inquiry and destination check', 'Запрос и проверка направления'],
  ['geo.how.step1.text', 'Send the model, budget, preferred year range, destination country or region, destination port, and whether you need FOB or CIF guidance.', 'Отправьте модель, бюджет, желаемый диапазон года, страну или регион назначения, порт назначения и укажите, нужна ли консультация по FOB или CIF.'],
  ['geo.how.step2.title', 'Vehicle selection and auction sheet review', 'Подбор автомобиля и проверка аукционного листа'],
  ['geo.how.step2.text', 'We share current stock or auction options. Ask for the auction inspection sheet before deciding so you can review grade, mileage, interior grade, and marked condition points.', 'Мы отправляем варианты со склада или аукциона. Запросите аукционный инспекционный лист до решения, чтобы проверить оценку, пробег, оценку салона и отмеченные точки состояния.'],
  ['geo.how.step3.title', 'Quote confirmation', 'Подтверждение расчета'],
  ['geo.how.step3.text', 'The quote states the vehicle basis and export cost basis. FOB covers costs up to Japan export handover; CIF adds ocean freight and marine insurance to the named destination port when available.', 'В расчете указана основа стоимости автомобиля и экспортных расходов. FOB покрывает расходы до экспортной передачи в Японии; CIF добавляет морской фрахт и морское страхование до указанного порта назначения, если маршрут доступен.'],
  ['geo.how.step4.title', 'Payment and purchase', 'Оплата и покупка'],
  ['geo.how.step4.text', 'Payment timing is confirmed before commitment. Auction purchases usually require faster deposit and balance timing than vehicles already held in stock.', 'Сроки оплаты подтверждаются до обязательства. Аукционные покупки обычно требуют более быстрых сроков депозита и остатка, чем автомобили, уже находящиеся на складе.'],
  ['geo.how.step5.title', 'Japanese export preparation', 'Японская экспортная подготовка'],
  ['geo.how.step5.text', 'We prepare Japanese deregistration and export documents, coordinate vehicle handover to the port side, and book shipping according to vessel availability.', 'Мы готовим снятие с регистрации в Японии и экспортные документы, координируем передачу автомобиля в порт и бронируем отправку по доступности судов.'],
  ['geo.how.step6.title', 'Arrival and local import', 'Прибытие и местный импорт'],
  ['geo.how.step6.text', 'The buyer or destination agent uses the export documents for customs clearance, taxes, inspection, registration, and any local roadworthiness requirements.', 'Покупатель или агент в стране назначения использует экспортные документы для таможни, налогов, проверки, регистрации и местных требований к пригодности к эксплуатации.'],
  ['geo.how.docs.title', 'Documents buyers usually prepare', 'Документы, которые обычно готовит покупатель'],
  ['geo.how.docs.buyerName', 'Full buyer or company name matching destination import records.', 'Полное имя покупателя или название компании, совпадающее с импортными записями в стране назначения.'],
  ['geo.how.docs.destination', 'Destination country or region, destination port, and consignee information.', 'Страна или регион назначения, порт назначения и данные получателя.'],
  ['geo.how.docs.eligibility', 'Local import eligibility confirmation for vehicle age, steering side, emissions, inspection, and registration rules.', 'Подтверждение местной допустимости по возрасту автомобиля, стороне руля, выбросам, проверке и правилам регистрации.'],
  ['geo.how.docs.payment', 'Payment sender details and bank remittance reference when payment is made.', 'Данные отправителя платежа и банковская ссылка перевода после оплаты.'],
  ['geo.how.docs.broker', 'Destination customs broker or clearing agent contact, if required by your country or region.', 'Контакт таможенного брокера или агента по оформлению в стране назначения, если это требуется местными правилами.'],
  ['pricing.kicker', 'Pricing basis', 'Основа цены'],
  ['pricing.title.a', 'Japan used car export pricing', 'Расчет экспорта автомобиля из Японии'],
  ['pricing.title.b', 'without fixed car prices', 'без фиксированных цен на автомобили'],
  ['pricing.intro', 'We quote by calculation, not by a public fixed price table. The final number depends on the vehicle, auction or stock basis, inspection information, destination port, shipping route, and payment timing.', 'Мы рассчитываем цену индивидуально, а не по публичной таблице фиксированных цен. Итоговая сумма зависит от автомобиля, аукционной или складской основы, данных проверки, порта назначения, маршрута отправки и сроков оплаты.'],
  ['pricing.fob.title', 'FOB Japan', 'FOB Япония'],
  ['pricing.fob.text', 'FOB is the Japan-side export basis. It usually covers the vehicle cost basis, our agreed service or auction agent fee, export preparation, documentation, and handover for shipment from Japan.', 'FOB — это экспортная база на стороне Японии. Обычно она включает основу стоимости автомобиля, согласованную сервисную или агентскую плату, экспортную подготовку, документы и передачу для отправки из Японии.'],
  ['pricing.cif.title', 'CIF destination port', 'CIF порт назначения'],
  ['pricing.cif.text', 'CIF starts with FOB and adds ocean freight plus marine insurance to the named destination port when that route can be quoted.', 'CIF начинается с FOB и добавляет морской фрахт и морское страхование до указанного порта назначения, если такой маршрут можно рассчитать.'],
  ['pricing.estimate.title', 'How the estimate is calculated', 'Как рассчитывается смета'],
  ['pricing.vehicleBasis', 'Vehicle basis', 'Основа стоимости автомобиля'],
  ['pricing.vehicleBasis.text', 'Current stock asking basis or auction winning bid estimate, depending on where the vehicle is sourced.', 'Запрашиваемая основа по текущему складу или оценка выигрышной ставки на аукционе, в зависимости от источника автомобиля.'],
  ['pricing.auctionFee', 'Auction agent fee', 'Агентская плата аукциона'],
  ['pricing.auctionFee.text', 'The agreed fee for auction search, bidding support, purchase coordination, and buyer communication when the car is not already in stock.', 'Согласованная плата за поиск на аукционе, поддержку ставок, координацию покупки и коммуникацию с покупателем, если автомобиль еще не находится на складе.'],
  ['pricing.inspection', 'Inspection and disclosure', 'Проверка и раскрытие информации'],
  ['pricing.inspection.text', 'Auction inspection sheet review is part of the purchase decision. Extra third-party checks, if requested and available, are quoted separately.', 'Разбор аукционного инспекционного листа входит в процесс принятия решения о покупке. Дополнительные сторонние проверки, если они запрошены и доступны, рассчитываются отдельно.'],
  ['pricing.exportHandling', 'Japan-side export handling', 'Экспортное оформление в Японии'],
  ['pricing.exportHandling.text', 'Deregistration, export certificate preparation, port-side handling, and document coordination.', 'Снятие с регистрации, подготовка экспортного сертификата, портовая обработка и координация документов.'],
  ['pricing.freight', 'Freight and insurance', 'Фрахт и страхование'],
  ['pricing.freight.text', 'Added for CIF quotes. The figure changes by destination port, vessel schedule, vehicle size, and route availability.', 'Добавляется в расчеты CIF. Сумма меняется в зависимости от порта назначения, расписания судов, размера автомобиля и доступности маршрута.'],
  ['pricing.destinationCosts', 'Destination costs', 'Расходы в стране назначения'],
  ['pricing.destinationCosts.text', 'Import duty, VAT or GST, customs broker fees, destination port charges, inspection, registration, local compliance, and inland delivery are normally buyer-side costs.', 'Импортная пошлина, VAT или GST, услуги таможенного брокера, сборы порта назначения, проверка, регистрация, местное соответствие и внутренняя доставка обычно относятся к расходам покупателя.'],
  ['pricing.payment.title', 'Payment method and timing', 'Способ и сроки оплаты'],
  ['pricing.payment.line1', 'We confirm the payment schedule before purchase commitment.', 'Мы подтверждаем график оплаты до обязательства покупки.'],
  ['pricing.payment.line2', 'Auction purchases usually require a deposit before bidding and balance payment after successful purchase.', 'Аукционные покупки обычно требуют депозит до ставки и оплату остатка после успешной покупки.'],
  ['pricing.payment.line3', 'Stock purchases usually follow the agreed invoice and reservation timing.', 'Покупки со склада обычно следуют согласованному счету и срокам резервирования.'],
  ['pricing.payment.line4', 'Bank transfer details are provided only through direct communication for a specific invoice.', 'Банковские реквизиты предоставляются только в прямой переписке по конкретному счету.'],
  ['pricing.payment.line5', 'Never send payment to an account that was not confirmed through our official WhatsApp or info@nice.okinawa email thread.', 'Никогда не отправляйте платеж на счет, который не был подтвержден через наш официальный WhatsApp или переписку с info@nice.okinawa.'],
  ['pricing.faq.fixed.q', 'Do you publish fixed vehicle prices?', 'Публикуете ли вы фиксированные цены на автомобили?'],
  ['pricing.faq.fixed.a', 'No. Vehicle pricing is quoted per inquiry because stock condition, auction result, destination port, freight route, and exchange-rate timing can change the final figure.', 'Нет. Цена автомобиля рассчитывается по запросу, потому что состояние складского автомобиля, результат аукциона, порт назначения, маршрут фрахта и момент обменного курса могут изменить итоговую сумму.'],
  ['pricing.faq.fob.q', 'What does FOB usually include?', 'Что обычно входит в FOB?'],
  ['pricing.faq.fob.a', 'FOB usually includes the vehicle cost basis, agreed service or auction agent fee, Japan-side export handling, deregistration and export document preparation, and handover for shipping from Japan.', 'FOB обычно включает основу стоимости автомобиля, согласованную сервисную или агентскую плату, экспортное оформление в Японии, снятие с регистрации, подготовку экспортных документов и передачу для отправки из Японии.'],
  ['pricing.faq.cif.q', 'What does CIF usually add?', 'Что обычно добавляет CIF?'],
  ['pricing.faq.cif.a', 'CIF adds ocean freight and marine insurance to the named destination port when we can quote that route. Destination customs, duties, taxes, port charges, local inspection, registration, and inland transport are not included unless explicitly stated.', 'CIF добавляет морской фрахт и морское страхование до указанного порта назначения, когда мы можем рассчитать этот маршрут. Таможня, пошлины, налоги, портовые сборы, местная проверка, регистрация и внутренняя перевозка в стране назначения не включены, если это не указано отдельно.'],
  ['pricing.cta.quote', 'Ask for a quote', 'Запросить расчет'],
  ['faqPage.kicker', 'Buyer questions', 'Вопросы покупателей'],
  ['faqPage.title.a', 'Japan used car export', 'Экспорт подержанных автомобилей из Японии'],
  ['faqPage.title.b', 'FAQ', 'FAQ'],
  ['faqPage.intro', 'These answers explain the buying and export basis before you choose a vehicle. Destination import rules vary, so buyers should confirm local eligibility before purchase commitment.', 'Эти ответы объясняют основу покупки и экспорта до выбора автомобиля. Правила импорта различаются, поэтому покупателю нужно подтвердить местную допустимость до обязательства покупки.'],
  ['faqPage.exportCountries.q', 'Which countries and regions can you export to?', 'В какие страны и регионы возможен экспорт?'],
  ['faqPage.exportCountries.a', 'We handle inquiries from Asia, Oceania, the Middle East, Africa, Europe, the Americas, and other countries or regions. Export availability depends on destination port access, vessel schedules, local import rules, and the vehicle itself.', 'Мы рассматриваем запросы из Азии, Океании, Ближнего Востока, Африки, Европы, Америки и других стран или регионов. Доступность экспорта зависит от доступа к порту назначения, расписания судов, местных правил импорта и самого автомобиля.'],
  ['faqPage.rhd.q', 'Are Japanese used cars right-hand drive?', 'Подержанные автомобили из Японии праворульные?'],
  ['faqPage.rhd.a', 'Most Japanese domestic vehicles are right-hand drive. Buyers should confirm that right-hand drive registration is allowed in their destination country or region before purchase.', 'Большинство автомобилей внутреннего японского рынка праворульные. Покупателю следует подтвердить, что регистрация праворульного автомобиля разрешена в стране или регионе назначения до покупки.'],
  ['faqPage.lhd.q', 'Can you export left-hand drive vehicles?', 'Можете ли вы экспортировать леворульные автомобили?'],
  ['faqPage.lhd.a', 'Left-hand drive vehicles are uncommon in Japanese domestic stock. If you specifically need left-hand drive, tell us before the search begins so we can check whether suitable inventory exists.', 'Леворульные автомобили редко встречаются в японском внутреннем наличии. Если вам нужен именно левый руль, сообщите об этом до начала поиска, чтобы мы проверили наличие подходящих вариантов.'],
  ['faqPage.ageMileage.q', 'Do destination countries have year or mileage restrictions?', 'Есть ли в странах назначения ограничения по году или пробегу?'],
  ['faqPage.ageMileage.a', 'Many destinations have vehicle age, mileage, emissions, inspection, or steering-side rules. The buyer is responsible for confirming local import eligibility before purchase commitment.', 'Во многих направлениях действуют правила по возрасту автомобиля, пробегу, выбросам, проверке или стороне руля. Покупатель отвечает за подтверждение местной импортной допустимости до обязательства покупки.'],
  ['faqPage.auctionSheet.q', 'Do you provide the auction inspection sheet?', 'Предоставляете ли вы аукционный инспекционный лист?'],
  ['faqPage.auctionSheet.a', 'Yes. Vehicles sourced through Japanese auction houses come with an independent auction inspection sheet. Ask for it on any vehicle you are considering before you decide.', 'Да. Автомобили, подобранные через японские аукционные дома, имеют независимый аукционный инспекционный лист. Запросите его по любому автомобилю, который рассматриваете, до принятия решения.'],
  ['faqPage.paymentSafe.q', 'Is payment safe?', 'Безопасна ли оплата?'],
  ['faqPage.paymentSafe.a', 'Payment instructions are provided only for a specific invoice through our official WhatsApp or info@nice.okinawa email thread. Do not send money to account details that were not confirmed through those official channels.', 'Платежные инструкции предоставляются только по конкретному счету через наш официальный WhatsApp или переписку с info@nice.okinawa. Не отправляйте деньги на реквизиты, которые не были подтверждены через эти официальные каналы.'],
  ['faqPage.whenPay.q', 'When do I pay?', 'Когда нужно платить?'],
  ['faqPage.whenPay.a', 'Payment timing depends on whether the vehicle is current stock or an auction purchase. We confirm deposit, balance, and document release timing before purchase commitment.', 'Срок оплаты зависит от того, находится ли автомобиль на складе или покупается на аукционе. Мы подтверждаем депозит, оплату остатка и сроки выдачи документов до обязательства покупки.'],
  ['faqPage.shippingTime.q', 'How long does shipping take?', 'Сколько занимает отправка?'],
  ['faqPage.shippingTime.a', 'Shipping time depends on the destination port, vessel schedule, transshipment route, and port handling. We quote and discuss timing per inquiry rather than publish a fixed schedule.', 'Срок отправки зависит от порта назначения, расписания судов, маршрута с перегрузкой и обработки в порту. Мы рассчитываем и обсуждаем сроки по каждому запросу, а не публикуем фиксированный график.'],
  ['faqPage.cancel.q', 'Can I cancel after committing to a vehicle?', 'Можно ли отменить покупку после подтверждения автомобиля?'],
  ['faqPage.cancel.a', 'Cancellation terms depend on the purchase stage. Auction bids and confirmed purchases may create costs that cannot be reversed. We explain the commitment point before bidding or purchase.', 'Условия отмены зависят от стадии покупки. Аукционные ставки и подтвержденные покупки могут создавать расходы, которые нельзя отменить. Мы объясняем момент обязательства до ставки или покупки.'],
  ['faqPage.documents.q', 'What documents are provided for export?', 'Какие документы предоставляются для экспорта?'],
  ['faqPage.documents.a', 'For export vehicles, we prepare Japanese deregistration and export certificate documents. Destination customs, tax, inspection, registration, and local compliance documents are handled by the buyer or destination agent under local rules.', 'Для экспортных автомобилей мы готовим японские документы о снятии с регистрации и экспортный сертификат. Таможня, налоги, проверка, регистрация и документы местного соответствия в стране назначения оформляются покупателем или агентом назначения по местным правилам.']
];

const extraRu = new Map(replacements.map(([, en, ru]) => [en, ru]));

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function absUrl(pathname) {
  return `${baseUrl}${pathname === '/' ? '/' : pathname}`;
}

async function read(file) {
  return fs.readFile(path.join(root, file), 'utf8');
}

async function write(file, html) {
  const target = path.join(root, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html, 'utf8');
}

function injectHead(html, page, locale) {
  const canonical = locale === 'ru' ? absUrl(page.ruPath) : absUrl(page.enPath);
  const en = absUrl(page.enPath);
  const ru = absUrl(page.ruPath);
  let out = html;
  if (out.includes('<link rel="canonical"')) {
    out = out.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${canonical}">`);
  } else {
    out = out.replace(/(<meta property="og:url" content="[^"]+">\n)/, `$1  <link rel="canonical" href="${canonical}">\n`);
  }
  out = out.replace(/(?:\s*<link rel="alternate" hreflang="(?:x-default|en|ru)" href="[^"]+">\n?)+/g, '\n');
  const alternates = `  <link rel="alternate" hreflang="x-default" href="${en}">\n  <link rel="alternate" hreflang="en" href="${en}">\n  <link rel="alternate" hreflang="ru" href="${ru}">\n`;
  out = out.replace(/(<link rel="canonical" href="[^"]+">\n)/, `$1${alternates}`);
  out = out.replace(/<meta property="og:url" content="[^"]+">/, `<meta property="og:url" content="${canonical.replace(/\/$/, page.id === 'home' ? '' : '/')}">`);
  if (out.includes('property="og:locale"')) {
    out = out.replace(/<meta property="og:locale" content="[^"]+">/, `<meta property="og:locale" content="${locale === 'ru' ? 'ru_RU' : 'en_US'}">`);
  } else {
    out = out.replace(/(<meta property="og:url" content="[^"]+">\n)/, `$1  <meta property="og:locale" content="${locale === 'ru' ? 'ru_RU' : 'en_US'}">\n`);
  }
  if (!out.includes('.locale-switch')) {
    out = out.replace('</style>', `.locale-switch{display:inline-flex;align-items:center;gap:.35rem;margin-left:.75rem;font-family:'DM Sans',sans-serif;font-size:.78rem;letter-spacing:.04em}.locale-switch a,.locale-switch span{color:inherit;text-decoration:none;border:1px solid rgba(255,255,255,.3);padding:.35rem .45rem;border-radius:3px}.locale-switch .active{font-weight:700;background:rgba(255,255,255,.14)}\n</style>`);
  }
  return out;
}

function injectLanguageSwitch(html, page, locale) {
  const enHref = page.enPath;
  const ruHref = page.ruPath;
  const label = locale === 'ru' ? 'Переключение языка' : 'Language switcher';
  const switcher = locale === 'ru'
    ? `<span class="locale-switch" aria-label="${label}"><a href="${enHref}">EN</a><span aria-hidden="true">/</span><span class="active" aria-current="page">RU</span></span>`
    : `<span class="locale-switch" aria-label="${label}"><span class="active" aria-current="page">EN</span><span aria-hidden="true">/</span><a href="${ruHref}">RU</a></span>`;
  if (html.includes('class="locale-switch"')) return html;
  if (/<button class="nav-lang"[\s\S]*?<\/button>/.test(html)) {
    return html.replace(/(<button class="nav-lang"[\s\S]*?<\/button>)/, `$1\n  ${switcher}`);
  }
  return html.replace('</nav>', `  ${switcher}\n  </nav>`);
}

function localizeLinks(html, page) {
  return html
    .replaceAll('href="/how-it-works/"', 'href="/ru/how-it-works/"')
    .replaceAll('href="/pricing/"', 'href="/ru/pricing/"')
    .replaceAll('href="/faq/"', 'href="/ru/faq/"')
    .replaceAll('href="/#vehicles"', 'href="/ru/#vehicles"')
    .replaceAll('href="/#contact"', 'href="/ru/#contact"')
    .replaceAll('href="/"', 'href="/ru/"');
}

function translateJsonLd(html, locale) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_all, body) => {
    const data = JSON.parse(body);
    function walk(value) {
      if (typeof value === 'string') return extraRu.get(value) || value;
      if (Array.isArray(value)) return value.map(walk);
      if (value && typeof value === 'object') {
        const out = {};
        for (const [key, val] of Object.entries(value)) out[key] = walk(val);
        if (locale === 'ru' && (out['@type'] === 'FAQPage' || out['@type'] === 'AutoDealer' || out['@type'] === 'HowTo')) out.inLanguage = 'ru';
        if (locale === 'ru' && typeof out.url === 'string') out.url = out.url.replace(baseUrl, `${baseUrl}/ru`).replace('/ru/ru', '/ru');
        if (locale === 'ru' && typeof out['@id'] === 'string') out['@id'] = out['@id'].replace(baseUrl, `${baseUrl}/ru`).replace('/ru/ru', '/ru');
        return out;
      }
      return value;
    }
    return `<script type="application/ld+json">\n  ${JSON.stringify(walk(data), null, 2).replace(/\n/g, '\n  ')}\n  </script>`;
  });
}

function translateOptions(html) {
  const countries = [
    ['China','Китай'],['Taiwan','Тайвань'],['Hong Kong','Гонконг'],['Macau','Макао'],['South Korea','Южная Корея'],['Mongolia','Монголия'],['Singapore','Сингапур'],['Malaysia','Малайзия'],['Thailand','Таиланд'],['Vietnam','Вьетнам'],['Philippines','Филиппины'],['Indonesia','Индонезия'],['Myanmar','Мьянма'],['Sri Lanka','Шри-Ланка'],['Bangladesh','Бангладеш'],['Pakistan','Пакистан'],['India','Индия'],['Australia','Австралия'],['New Zealand','Новая Зеландия'],['Fiji','Фиджи'],['Papua New Guinea','Папуа — Новая Гвинея'],['United Arab Emirates','ОАЭ'],['Saudi Arabia','Саудовская Аравия'],['Oman','Оман'],['Jordan','Иордания'],['Israel','Израиль'],['Kenya','Кения'],['Tanzania','Танзания'],['Uganda','Уганда'],['Zambia','Замбия'],['Zimbabwe','Зимбабве'],['Malawi','Малави'],['Mozambique','Мозамбик'],['Botswana','Ботсвана'],['DR Congo','ДР Конго'],['South Africa','ЮАР'],['Nigeria','Нигерия'],['Ghana','Гана'],['United Kingdom','Великобритания'],['Ireland','Ирландия'],['Netherlands','Нидерланды'],['Germany','Германия'],['France','Франция'],['Cyprus','Кипр'],['Malta','Мальта'],['Georgia','Грузия'],['Russia','Россия'],['United States','США'],['Canada','Канада'],['Chile','Чили'],['Paraguay','Парагвай'],['Bolivia','Боливия'],['Guyana','Гайана'],['Trinidad and Tobago','Тринидад и Тобаго'],['Jamaica','Ямайка'],['Other country or region','Другая страна или регион']
  ];
  let out = html;
  for (const [en, ru] of countries) {
    out = out.replaceAll(`<option>${en}</option>`, `<option value="${en}">${ru}</option>`);
    out = out.replaceAll(`>${en}</option>`, `>${ru}</option>`);
  }
  out = out.replaceAll('>Japan (Okinawa local)</option>', '>Япония (местно в Окинаве)</option>');
  return out;
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let index = 0;
  while ((index = haystack.indexOf(needle, index)) !== -1) {
    count += 1;
    index += needle.length;
  }
  return count;
}

function applyControlledTranslations(html) {
  const scripts = [];
  let out = html.replace(/<script[\s\S]*?<\/script>/g, (script) => {
    const token = `__JUC_SCRIPT_${scripts.length}__`;
    scripts.push(script);
    return token;
  });
  for (const [key, en, ru] of replacements.sort((a, b) => b[1].length - a[1].length)) {
    if (en === ru) continue;
    if (en === 'The' || en === 'Okinawa' || en === 'Auto') {
      throw new Error(`unsafe generic translation key: ${key}`);
    }
    if (en.length < 4 && !en.includes('<')) {
      throw new Error(`unsafe short translation key: ${key}`);
    }
    const found = countOccurrences(out, en);
    if (found === 0) continue;
    out = out.replaceAll(en, ru);
  }
  return out.replace(/__JUC_SCRIPT_(\d+)__/g, (_match, index) => scripts[Number(index)]);
}

function translateScriptStrings(html) {
  const scriptStrings = [
    ['Sending your inquiry...', 'Отправляем запрос...'],
    ['Thank you! We received your inquiry and will reply within 24 hours.', 'Спасибо! Мы получили ваш запрос и ответим в течение 24 часов.'],
    ['Please enter your email. If this keeps failing, email info@nice.okinawa or use WhatsApp.', 'Введите email. Если ошибка повторится, напишите на info@nice.okinawa или используйте WhatsApp.'],
    ['Please complete the security check. If this keeps failing, email info@nice.okinawa or use WhatsApp.', 'Пройдите проверку безопасности. Если ошибка повторится, напишите на info@nice.okinawa или используйте WhatsApp.'],
    ['Could not send. Please email info@nice.okinawa or use WhatsApp instead.', 'Не удалось отправить. Напишите на info@nice.okinawa или используйте WhatsApp.']
  ];
  let out = html;
  for (const [en, ru] of scriptStrings) out = out.replaceAll(en, ru);
  return out;
}

function translatePage(html, page) {
  let out = html.replace('<html lang="en">', '<html lang="ru">');
  out = injectHead(out, page, 'ru');
  out = injectLanguageSwitch(out, page, 'ru');
  out = translateJsonLd(out, 'ru');
  out = applyControlledTranslations(out);
  out = translateScriptStrings(out);
  out = translateOptions(out);
  out = out
    .replaceAll('value="Экспорт в мою страну или регион"', 'value="Export to my country / region"')
    .replaceAll('value="Покупка в Окинаве"', 'value="Local purchase in Okinawa"')
    .replaceAll('value="Пока смотрю и проверяю цену"', 'value="Just browsing / price check"')
    .replaceAll('<option>Экспорт в мою страну или регион</option>', '<option value="Export to my country / region">Экспорт в мою страну или регион</option>')
    .replaceAll('<option>Покупка в Окинаве</option>', '<option value="Local purchase in Okinawa">Покупка в Окинаве</option>')
    .replaceAll('<option>Пока смотрю и проверяю цену</option>', '<option value="Just browsing / price check">Пока смотрю и проверяю цену</option>');
  out = localizeLinks(out, page);
  out = out.replaceAll("language: document.documentElement.lang || 'en'", "language: document.documentElement.lang || 'ru'");
  out = out.replaceAll('japanusedcars.nice.okinawa/ · v2026.06.14', 'japanusedcars.nice.okinawa/ru/ · v2026.06.14');
  return out;
}

function renderEnglish(html, page) {
  return injectLanguageSwitch(injectHead(html, page, 'en'), page, 'en');
}

function sitemap() {
  const rows = [];
  for (const page of pages) {
    for (const pathName of [page.enPath, page.ruPath]) {
      rows.push(`  <url>\n    <loc>${absUrl(pathName)}</loc>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrl(page.enPath)}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${absUrl(page.enPath)}"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="${absUrl(page.ruPath)}"/>\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}

function llms() {
  return `# JapanUsedCars.nice.okinawa\n\nOkinawa Auto is a Japan used car export and purchase support service in Okinawa, helping overseas buyers inquire about Okinawa used cars, Japanese auction vehicles, and export-ready right-hand-drive cars through WhatsApp, email, and the website inquiry form.\n\n## Core facts\n\n- Vehicles are sourced through Japanese auction houses.\n- Every vehicle comes with an independent auction inspection sheet, available to buyers on request.\n- Export quotes available for Europe, New Zealand, and Southeast Asia.\n- Prices are quoted per inquiry; published fixed vehicle prices are not used.\n- Export eligibility depends on the vehicle, destination country / region rules, route availability, and current Japanese export controls.\n- No warranty is offered; export vehicles are sold as-is.\n\n## Contact\n\n- WhatsApp: +81 70-8952-3968\n- Email: info@nice.okinawa\n- Website: ${baseUrl}/\n\n## Public pages\n\n- ${baseUrl}/\n- ${baseUrl}/how-it-works/\n- ${baseUrl}/pricing/\n- ${baseUrl}/faq/\n- ${baseUrl}/ru/\n- ${baseUrl}/ru/how-it-works/\n- ${baseUrl}/ru/pricing/\n- ${baseUrl}/ru/faq/\n\n## Russian-language summary\n\nРусские страницы используют те же общие бизнес-факты, что и английские исходные страницы. Они описывают экспорт подержанных автомобилей из Японии, автомобили с японских аукционов, аукционные инспекционные листы и расчет FOB/CIF по запросу без неподтвержденных обещаний по маршрутам, таможне, оплате или срокам доставки.\n`;
}

if (process.argv.includes('--stage1-check')) {
  for (const page of pages) {
    const template = await read(page.template);
    const baseline = execFileSync('git', ['show', `origin/main:${page.out}`], { cwd: root, encoding: 'utf8' });
    const ok = sha256(template) === sha256(baseline);
    console.log(`${page.id} baseline=${sha256(baseline)} generated=${sha256(template)} byteParity=${ok}`);
    if (!ok) process.exitCode = 1;
  }
} else {
  for (const page of pages) {
    const template = await read(page.template);
    await write(page.out, renderEnglish(template, page));
    await write(page.ruOut, translatePage(template, page));
  }
  await write('sitemap.xml', sitemap());
  await write('llms.txt', llms());
}
