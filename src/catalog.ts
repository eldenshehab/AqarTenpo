import type { Property } from './data';
import { DEMO_PLANS } from './lib/demoPlans';

export type CategoryId = 'residential' | 'commercial' | 'industrial' | 'medical' | 'land' | 'investment' | 'resale' | 'new_project';

export interface Subtype { id: string; ar: string; en: string; type: Property['type'] }
export interface Category { id: CategoryId; ar: string; en: string; items: Subtype[] }

export const TAXONOMY: Category[] = [
  { id: 'residential', ar: 'سكني', en: 'Residential', items: [
    { id: 'apartment', ar: 'شقق', en: 'Apartments', type: 'apartment' },
    { id: 'villa', ar: 'فيلات', en: 'Villas', type: 'villa' },
    { id: 'duplex', ar: 'دوبلكس', en: 'Duplex', type: 'apartment' },
    { id: 'penthouse', ar: 'بنتهاوس', en: 'Penthouse', type: 'apartment' },
    { id: 'chalet', ar: 'شاليهات', en: 'Chalets', type: 'villa' },
  ] },
  { id: 'commercial', ar: 'تجاري وإداري', en: 'Commercial', items: [
    { id: 'shop', ar: 'محلات', en: 'Shops', type: 'commercial' },
    { id: 'office', ar: 'مكاتب', en: 'Offices', type: 'commercial' },
    { id: 'hq', ar: 'مقرات شركات', en: 'Headquarters', type: 'commercial' },
  ] },
  { id: 'industrial', ar: 'صناعي', en: 'Industrial', items: [
    { id: 'factory', ar: 'مصانع', en: 'Factories', type: 'industrial' },
    { id: 'warehouse', ar: 'مخازن', en: 'Warehouses', type: 'industrial' },
    { id: 'workshop', ar: 'ورش', en: 'Workshops', type: 'industrial' },
  ] },
  { id: 'medical', ar: 'طبي', en: 'Medical', items: [
    { id: 'clinic', ar: 'عيادات', en: 'Clinics', type: 'commercial' },
    { id: 'medical_center', ar: 'وحدات ومراكز طبية', en: 'Medical centers', type: 'commercial' },
  ] },
  { id: 'land', ar: 'أراضٍ', en: 'Land', items: [
    { id: 'land_residential', ar: 'سكنية', en: 'Residential land', type: 'land' },
    { id: 'land_commercial', ar: 'تجارية', en: 'Commercial land', type: 'land' },
    { id: 'land_industrial', ar: 'صناعية', en: 'Industrial land', type: 'land' },
    { id: 'land_agricultural', ar: 'زراعية', en: 'Agricultural land', type: 'land' },
  ] },
  { id: 'investment', ar: 'استثماري', en: 'Investment', items: [
    { id: 'rented', ar: 'عقارات مؤجرة', en: 'Tenanted assets', type: 'apartment' },
    { id: 'yield', ar: 'وحدات بعائد إيجاري', en: 'Yield units', type: 'apartment' },
  ] },
  { id: 'resale', ar: 'إعادة البيع', en: 'Resale', items: [
    { id: 'resale_cash', ar: 'وحدات كاش', en: 'Cash resale', type: 'apartment' },
    { id: 'resale_installment', ar: 'تقسيط', en: 'Installments', type: 'apartment' },
    { id: 'resale_remaining', ar: 'إعادة بيع بأقساط متبقية', en: 'Remaining installments', type: 'apartment' },
  ] },
  { id: 'new_project', ar: 'مشروعات جديدة', en: 'New projects', items: [
    { id: 'developer_unit', ar: 'وحدات من المطورين', en: 'Developer units', type: 'apartment' },
    { id: 'under_construction', ar: 'تحت الإنشاء', en: 'Under construction', type: 'apartment' },
  ] },
];

export const CURRENCIES: Record<string, { code: string; ar: string; en: string }> = {
  EG: { code: 'EGP', ar: 'ج.م', en: 'EGP' }, مصر: { code: 'EGP', ar: 'ج.م', en: 'EGP' },
  SA: { code: 'SAR', ar: 'ر.س', en: 'SAR' }, السعودية: { code: 'SAR', ar: 'ر.س', en: 'SAR' },
  AE: { code: 'AED', ar: 'د.إ', en: 'AED' }, الإمارات: { code: 'AED', ar: 'د.إ', en: 'AED' },
  KW: { code: 'KWD', ar: 'د.ك', en: 'KWD' }, الكويت: { code: 'KWD', ar: 'د.ك', en: 'KWD' },
  QA: { code: 'QAR', ar: 'ر.ق', en: 'QAR' }, قطر: { code: 'QAR', ar: 'ر.ق', en: 'QAR' },
  JO: { code: 'JOD', ar: 'د.أ', en: 'JOD' }, الأردن: { code: 'JOD', ar: 'د.أ', en: 'JOD' },
  MA: { code: 'MAD', ar: 'د.م', en: 'MAD' }, المغرب: { code: 'MAD', ar: 'د.م', en: 'MAD' },
  TR: { code: 'TRY', ar: 'ل.ت', en: 'TRY' }, تركيا: { code: 'TRY', ar: 'ل.ت', en: 'TRY' },
  US: { code: 'USD', ar: 'دولار', en: 'USD' }, أمريكا: { code: 'USD', ar: 'دولار', en: 'USD' },
  GB: { code: 'GBP', ar: 'إسترليني', en: 'GBP' }, بريطانيا: { code: 'GBP', ar: 'إسترليني', en: 'GBP' },
};

export interface BrokerProfile {
  id: string; name: string; nameEn: string; office: string; city: string; phone: string;
  bio: string; photo: string; logo: string; license: string; verified: boolean;
}
const face = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=70`;
export const BROKERS: BrokerProfile[] = [
  { id: 'b1', name: 'ياسمين فؤاد', nameEn: 'Yasmin Fouad', office: 'تينبو ريزيدنس', city: 'القاهرة الجديدة', phone: '201111111111', bio: 'وساطة سكنية في التجمع ومدينتي والرحاب، مع مراجعة مستندات التنازل قبل العرض.', photo: face('photo-1544005313-94ddf0286df2'), logo: 'TR', license: 'EG-BR-1044', verified: true },
  { id: 'b2', name: 'كريم حسني', nameEn: 'Karim Hosny', office: 'أكتوبر بارتنرز', city: '6 أكتوبر', phone: '201222222222', bio: 'فيلات ووحدات استثمارية في أكتوبر والشيخ زايد، وتنسيق تعاون بين الوسطاء.', photo: face('photo-1500648767791-00dcc994a43e'), logo: 'OP', license: 'EG-BR-2281', verified: true },
  { id: 'b3', name: 'ليان القاسم', nameEn: 'Layan Al Qasim', office: 'خليج تينبو', city: 'الرياض', phone: '966555555555', bio: 'عقارات سكنية وتجارية في الرياض وجدة، والأسعار تُعرض بالريال السعودي.', photo: face('photo-1573496359142-b8d87734a5a2'), logo: 'GT', license: 'KSA-REG-19', verified: true },
];

export interface AreaGuide {
  slug: string; nameAr: string; nameEn: string; cover: string; about: string;
  compounds: string[]; services: string[]; roads: { name: string; distance: string }[];
  keys: string[];
}
export const AREAS: AreaGuide[] = [
  {
    slug: 'new-cairo', nameAr: 'التجمع والقاهرة الجديدة', nameEn: 'New Cairo', cover: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=70',
    about: 'نبدأ من هنا بصفحة منطقة لا قائمة شقق فقط: التجمع الأول والخامس وجنوب الأكاديمية ومدينتي والرحاب. المسافات تقريبية وتختلف حسب الزحام.',
    compounds: ['جنوب الأكاديمية', 'النرجس الجديدة', 'مدينتي', 'الرحاب', 'التجمع الخامس'],
    services: ['جامعة القاهرة الجديدة والجامعة الأمريكية', 'مستشفيات ومراكز طبية على طريق السويس', 'كايرو فيستيفال سيتي وداون تاون كاتاميا', 'مدارس دولية ومحاور داخلية'],
    roads: [{ name: 'الطريق الدائري', distance: 'حوالي 8–15 كم حسب الحي' }, { name: 'طريق السويس', distance: 'محور مباشر لمعظم الأحياء' }, { name: 'العاصمة الإدارية', distance: 'غالباً 20–35 دقيقة' }],
    keys: ['التجمع', 'القاهرة الجديدة', 'جنوب الأكاديمية', 'مدينتي', 'الرحاب', 'النرجس'],
  },
  {
    slug: 'october', nameAr: '6 أكتوبر والشيخ زايد', nameEn: '6th of October', cover: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=70',
    about: 'الصفحة الثانية في الإطلاق: أكتوبر والتوسعات الشمالية والشيخ زايد. نعرض نطاقات أسعار الإعلان، لا أسعار صفقات بيع فعلية.',
    compounds: ['بيفرلي هيلز', 'ويست تاون', 'التوسعات الشمالية', 'بالم هيلز أكتوبر', 'ديونز'],
    services: ['مول العرب ومستشفيات المدينة', 'الجامعة البريطانية وجامعات المدينة', 'أندية وخدمات داخل الكمبوندات', 'مناطق تجارية على المحاور الرئيسية'],
    roads: [{ name: 'محور 26 يوليو', distance: 'الرابط الأقرب لوسط القاهرة' }, { name: 'طريق الواحات', distance: 'مدخل التوسعات الشمالية' }, { name: 'طريق القاهرة–الإسكندرية الصحراوي', distance: 'محور إقليمي مباشر' }],
    keys: ['أكتوبر', 'اكتوبر', 'الشيخ زايد', 'زايد', 'بيفرلي', 'ويست تاون'],
  },
];

export const COMPOUNDS = [
  { name: 'جنوب الأكاديمية', area: 'new-cairo', lat: 30.02, lng: 31.45 },
  { name: 'النرجس الجديدة', area: 'new-cairo', lat: 30.055, lng: 31.42 },
  { name: 'مدينتي', area: 'new-cairo', lat: 30.09, lng: 31.62 },
  { name: 'الرحاب', area: 'new-cairo', lat: 30.06, lng: 31.49 },
  { name: 'بيفرلي هيلز', area: 'october', lat: 30.045, lng: 30.96 },
  { name: 'ويست تاون', area: 'october', lat: 30.02, lng: 30.99 },
  { name: 'التوسعات الشمالية', area: 'october', lat: 29.99, lng: 30.9 },
  { name: 'بالم هيلز أكتوبر', area: 'october', lat: 29.97, lng: 30.94 },
];

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;
const pics = {
  apt: [img('photo-1502672260266-1c1ef2d93688'), img('photo-1560448204-e02f11c3d0e2')],
  villa: [img('photo-1613490493576-7fde63acd811'), img('photo-1600585154340-be6161a56a0c')],
  work: [img('photo-1497366216548-37526070297c'), img('photo-1486406146926-c627a92ad1ab')],
  industrial: [img('photo-1586528116311-ad8dd3c8310d'), img('photo-1553413077-190dd305871c')],
  land: [img('photo-1500382017468-9049fed747ef')],
  medical: [img('photo-1519494026892-80bbd2d6fd0d'), img('photo-1538108149393-fbbd81895907')],
};
const rooms = (set: string[]) => [
  { src: set[0], room: 'المعيشة' }, { src: set[1] || set[0], room: 'غرفة النوم' }, { src: set[0], room: 'المطبخ' },
];

export const EXTRA_LISTINGS: Property[] = [
  { id: 'x1', title: 'دوبلكس بحديقة في بالم هيلز أكتوبر', titleEn: 'Garden duplex in Palm Hills October', type: 'apartment', category: 'residential', subtype: 'duplex', city: '6 أكتوبر', cityEn: '6th October', locationArea: 'بالم هيلز أكتوبر', compound: 'بالم هيلز أكتوبر', price: 9200000, area: 240, beds: 4, baths: 3, lat: 29.972, lng: 30.945, images: pics.apt, desc: 'دوبلكس داخل كمبوند، استلام فوري، ومقدم معلن مليون جنيه. السعر سعر عرض وليس سعر صفقة.', rent: 45000, year: 2024, phone: '201222222222', deal: 'sale', country: 'مصر', currency: 'EGP', downPayment: 1000000, brokerId: 'b2', phoneVerified: true, docsVerified: true, reviewStatus: 'approved', status: 'ready', furnishing: 'semi_furnished', videoUrl: 'https://videos.pexels.com/video-files/7578552/7578552-uhd_2560_1440_30fps.mp4', panoramas: rooms(pics.apt), projectDrawings: DEMO_PLANS.apartment },
  { id: 'x2', title: 'عيادة طبية جاهزة في التجمع الخامس', titleEn: 'Ready clinic in Fifth Settlement', type: 'commercial', category: 'medical', subtype: 'clinic', city: 'القاهرة الجديدة', cityEn: 'New Cairo', locationArea: 'التجمع الخامس', compound: 'التجمع الخامس', price: 6500000, area: 95, beds: 0, baths: 2, lat: 30.01, lng: 31.43, images: pics.medical, desc: 'عيادة على شارع طبي، وتم التحقق من رقم الهاتف. المستندات ما زالت قيد المراجعة.', rent: 40000, year: 2022, phone: '201111111111', deal: 'sale', country: 'مصر', currency: 'EGP', brokerId: 'b1', phoneVerified: true, docsVerified: false, reviewStatus: 'approved', status: 'ready' },
  { id: 'x3', title: 'مركز طبي صغير في الرحاب', titleEn: 'Small medical center in Rehab', type: 'commercial', category: 'medical', subtype: 'medical_center', city: 'القاهرة الجديدة', cityEn: 'New Cairo', locationArea: 'الرحاب', compound: 'الرحاب', price: 18000000, area: 320, beds: 0, baths: 4, lat: 30.062, lng: 31.492, images: pics.medical, desc: 'وحدة طبية متعددة الغرف داخل الرحاب. الإعلان مراجع وظاهر كسعر عرض.', rent: 90000, year: 2021, phone: '201111111119', deal: 'sale', country: 'مصر', currency: 'EGP', phoneVerified: true, docsVerified: true, reviewStatus: 'approved', status: 'ready' },
  { id: 'x4', title: 'مصنع قائم في العاشر من رمضان', titleEn: 'Operating factory in 10th of Ramadan', type: 'industrial', category: 'industrial', subtype: 'factory', city: 'العاشر من رمضان', cityEn: '10th of Ramadan', locationArea: 'العاشر من رمضان', price: 27000000, area: 4200, beds: 0, baths: 4, lat: 30.29, lng: 31.74, images: pics.industrial, desc: 'مصنع مرخص العرض الخاص به بعد مراجعة الإعلان. لا يمثل سعر بيع فعلي مؤكد.', rent: 180000, year: 2019, phone: '201555555501', deal: 'sale', country: 'مصر', currency: 'EGP', phoneVerified: true, docsVerified: true, reviewStatus: 'approved', status: 'ready' },
  { id: 'x5', title: 'ورشة على محور صناعي بمدينة بدر', titleEn: 'Workshop in Badr industrial zone', type: 'industrial', category: 'industrial', subtype: 'workshop', city: 'بدر', cityEn: 'Badr', locationArea: 'بدر', price: 4300000, area: 600, beds: 0, baths: 1, lat: 30.14, lng: 31.72, images: pics.industrial, desc: 'ورشة بمكتب إداري صغير وموقف تحميل.', rent: 25000, year: 2018, phone: '201555555502', deal: 'rent', country: 'مصر', currency: 'EGP', phoneVerified: true, docsVerified: false, reviewStatus: 'approved', status: 'ready' },
  { id: 'x6', title: 'شقة مؤجرة بعائد في جنوب الأكاديمية', titleEn: 'Tenanted yield apartment in South Academy', type: 'apartment', category: 'investment', subtype: 'yield', city: 'القاهرة الجديدة', cityEn: 'New Cairo', locationArea: 'جنوب الأكاديمية - التجمع الخامس', compound: 'جنوب الأكاديمية', price: 5100000, area: 165, beds: 3, baths: 2, lat: 30.018, lng: 31.455, images: pics.apt, desc: 'وحدة عليها عقد إيجار قائم. العائد محسوب من الإيجار المعلن وليس من صفقة بيع.', rent: 28000, year: 2023, phone: '201111111111', deal: 'sale', country: 'مصر', currency: 'EGP', brokerId: 'b1', phoneVerified: true, docsVerified: true, reviewStatus: 'approved', status: 'ready', furnishing: 'furnished' },
  { id: 'x7', title: 'شقة من المطور تحت الإنشاء في مدينتي', titleEn: 'Developer unit under construction in Madinaty', type: 'apartment', category: 'new_project', subtype: 'under_construction', city: 'القاهرة الجديدة', cityEn: 'New Cairo', locationArea: 'مدينتي', compound: 'مدينتي', price: 3900000, area: 130, beds: 3, baths: 2, lat: 30.088, lng: 31.625, images: pics.apt, desc: 'وحدة مطور تحت الإنشاء. المقدم المعلن 900 ألف جنيه، والاستلام غير فوري.', rent: 0, year: 2028, phone: '201111111120', deal: 'sale', country: 'مصر', currency: 'EGP', downPayment: 900000, phoneVerified: true, docsVerified: false, reviewStatus: 'approved', status: 'under_construction' },
  { id: 'x8', title: 'فيلا إعادة بيع كاش في الشيخ زايد', titleEn: 'Cash resale villa in Sheikh Zayed', type: 'villa', category: 'resale', subtype: 'resale_cash', city: 'الشيخ زايد', cityEn: 'Sheikh Zayed', locationArea: 'الشيخ زايد - بيفرلي هيلز', compound: 'بيفرلي هيلز', price: 19800000, area: 480, beds: 5, baths: 5, lat: 30.04, lng: 30.965, images: pics.villa, desc: 'إعادة بيع كاش بدون أقساط متبقية. السعر انخفض في العرض خلال آخر شهر.', rent: 0, year: 2022, phone: '201222222222', deal: 'sale', country: 'مصر', currency: 'EGP', brokerId: 'b2', phoneVerified: true, docsVerified: true, reviewStatus: 'approved', status: 'ready', videoUrl: 'https://videos.pexels.com/video-files/7578552/7578552-uhd_2560_1440_30fps.mp4', panoramas: rooms(pics.villa), projectDrawings: DEMO_PLANS.villa },
  { id: 'x9', title: 'شقة عائلية في حي النرجس بالرياض', titleEn: 'Family apartment in Al Narjis, Riyadh', type: 'apartment', category: 'residential', subtype: 'apartment', city: 'الرياض', cityEn: 'Riyadh', locationArea: 'حي النرجس - الرياض', price: 1450000, area: 170, beds: 3, baths: 3, lat: 24.86, lng: 46.68, images: pics.apt, desc: 'إعلان سعودي معتمد العرض، والسعر بالريال السعودي لا بالجنيه.', rent: 70000, year: 2021, phone: '966555555555', deal: 'sale', country: 'السعودية', currency: 'SAR', brokerId: 'b3', phoneVerified: true, docsVerified: true, reviewStatus: 'approved', status: 'ready' },
  { id: 'x10', title: 'مكتب في الخليج التجاري بدبي', titleEn: 'Office in Business Bay, Dubai', type: 'commercial', category: 'commercial', subtype: 'office', city: 'دبي', cityEn: 'Dubai', locationArea: 'الخليج التجاري - دبي', price: 2800000, area: 140, beds: 0, baths: 2, lat: 25.18, lng: 55.27, images: pics.work, desc: 'مكتب إداري والسعر بالدرهم الإماراتي. لا يتم تحويله تلقائياً إلى الجنيه.', rent: 140000, year: 2020, phone: '971501234567', deal: 'sale', country: 'الإمارات', currency: 'AED', phoneVerified: true, docsVerified: false, reviewStatus: 'approved', status: 'ready' },
  { id: 'x11', title: 'أرض سكنية في التوسعات الشمالية', titleEn: 'Residential land in Northern Expansions', type: 'land', category: 'land', subtype: 'land_residential', city: '6 أكتوبر', cityEn: '6th October', locationArea: 'مدينة 6 أكتوبر - التوسعات الشمالية', compound: 'التوسعات الشمالية', price: 7500000, area: 800, beds: 0, baths: 0, lat: 29.995, lng: 30.905, images: pics.land, desc: 'أرض سكنية داخل نطاق التوسعات. المساحة والسعر معلنان من صاحب الإعلان.', rent: 0, year: 2026, phone: '201222222229', deal: 'sale', country: 'مصر', currency: 'EGP', phoneVerified: true, docsVerified: true, reviewStatus: 'approved', status: 'ready' },
  { id: 'x12', title: 'مقر إداري لشركة في العاصمة الإدارية', titleEn: 'Company headquarters in the New Capital', type: 'commercial', category: 'commercial', subtype: 'hq', city: 'العاصمة الإدارية', cityEn: 'New Capital', locationArea: 'العاصمة الإدارية - الحي المالي والدبلوماسي', price: 24000000, area: 900, beds: 0, baths: 6, lat: 30.005, lng: 31.74, images: pics.work, desc: 'مقر شركة كامل الدور في الحي المالي. الإعلان عليه شارة تحقق الهاتف فقط.', rent: 160000, year: 2025, phone: '201010101010', deal: 'sale', country: 'مصر', currency: 'EGP', phoneVerified: true, docsVerified: false, reviewStatus: 'approved', status: 'under_construction' },
];

const OVERRIDES: Record<string, Partial<Property>> = {
  '4': { category: 'residential', subtype: 'duplex', compound: 'النرجس الجديدة' },
  '7': { category: 'residential', subtype: 'penthouse' },
  '9': { category: 'residential', subtype: 'chalet', compound: 'بورتو السخنة', videoUrl: 'https://videos.pexels.com/video-files/7578552/7578552-uhd_2560_1440_30fps.mp4' },
  '10': { category: 'residential', subtype: 'chalet' },
  as1: { category: 'resale', subtype: 'resale_remaining' },
  as2: { category: 'resale', subtype: 'resale_remaining', compound: 'ويست تاون' },
  as3: { category: 'resale', subtype: 'resale_remaining' },
  as4: { category: 'resale', subtype: 'resale_remaining' },
};

export function currencyOf(p: Pick<Property, 'currency' | 'country'> | string) {
  if (typeof p === 'string') return CURRENCIES[p] || CURRENCIES.EG;
  return CURRENCIES[p.currency || ''] || CURRENCIES[p.country || ''] || CURRENCIES.EG;
}

export function listingCategory(p: Property) {
  return TAXONOMY.find(c => c.id === (p.category as CategoryId)) || TAXONOMY[0];
}
export function listingSubtype(p: Property) {
  const cat = listingCategory(p);
  return cat.items.find(s => s.id === p.subtype) || cat.items[0];
}

export function inferClassification(p: Property): Pick<Property, 'category' | 'subtype'> {
  if (p.assignment) return { category: 'resale', subtype: 'resale_remaining' };
  if (p.status === 'under_construction') return { category: 'new_project', subtype: 'under_construction' };
  if (p.type === 'villa') return { category: 'residential', subtype: 'villa' };
  if (p.type === 'apartment') return { category: 'residential', subtype: 'apartment' };
  if (p.type === 'commercial') return { category: 'commercial', subtype: 'office' };
  if (p.type === 'industrial') return { category: 'industrial', subtype: 'warehouse' };
  return { category: 'land', subtype: 'land_residential' };
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=70';

export function present(p: Property): Property {
  if (!p || typeof p !== 'object') return null as never;
  const id = String(p.id || Math.random().toString(36).slice(2));
  const safe: Property = {
    ...p,
    id,
    title: p.title || 'عقار بدون عنوان',
    titleEn: p.titleEn || p.title || 'Untitled property',
    images: Array.isArray(p.images) && p.images.filter(Boolean).length ? p.images.filter(Boolean) : [FALLBACK_IMG],
    price: Number(p.price) || 0,
    area: Number(p.area) || 0,
    rent: Number(p.rent) || 0,
    beds: Number(p.beds) || 0,
    baths: Number(p.baths) || 0,
    lat: Number.isFinite(Number(p.lat)) ? Number(p.lat) : 30.04,
    lng: Number.isFinite(Number(p.lng)) ? Number(p.lng) : 31.24,
    city: p.city || 'مصر',
    cityEn: p.cityEn || p.city || 'Egypt',
    desc: p.desc || '',
    phone: String(p.phone || '201000000000'),
    year: Number(p.year) || new Date().getFullYear(),
  };
  const p2 = safe;
  const inferred = inferClassification(p2);
  const currency = p2.currency || currencyOf(p2.country || 'مصر').code;
  const now = Date.parse('2026-04-01T00:00:00Z');
  const drift = (p2.id.charCodeAt(p2.id.length - 1) % 5) - 1;
  const history = Array.isArray(p2.priceHistory) && p2.priceHistory.length ? p2.priceHistory : [90, 60, 30, 0].map(days => ({ t: now - days * 86400000, price: Math.round(p2.price * (1 + drift * 0.015 * (days / 90))) }));
  return {
    ...inferred,
    ...OVERRIDES[p2.id],
    ...p2,
    category: p2.category || OVERRIDES[p2.id]?.category || inferred.category,
    subtype: p2.subtype || OVERRIDES[p2.id]?.subtype || inferred.subtype,
    currency,
    country: p2.country || 'مصر',
    phoneVerified: p2.phoneVerified ?? !p2.ownerId,
    docsVerified: p2.docsVerified ?? Boolean(p2.assignment),
    reviewStatus: p2.reviewStatus || (p2.ownerId ? 'pending' : 'approved'),
    updatedAt: p2.updatedAt || now - (p2.id.charCodeAt(0) % 12) * 86400000,
    priceHistory: history,
    pricePerMeter: p2.pricePerMeter || (p2.area ? Math.round(p2.price / p2.area) : 0),
  };
}

export function isPublicListing(p: Property, ownerId?: string) {
  return p.reviewStatus !== 'pending' && p.reviewStatus !== 'rejected' || p.ownerId === ownerId;
}

export function findDuplicate(candidate: { title: string; phone: string; price: number; location?: string }, list: Property[]) {
  const phone = candidate.phone.replace(/\D/g, '');
  const title = candidate.title.trim().toLowerCase();
  return list.find(p => {
    const samePhone = phone.length > 6 && p.phone.replace(/\D/g, '') === phone;
    const sameTitle = title.length > 6 && p.title.trim().toLowerCase() === title;
    const samePlace = candidate.location && (p.locationArea === candidate.location || p.city === candidate.location);
    const closePrice = p.price > 0 && Math.abs(p.price - candidate.price) / p.price < 0.08;
    return samePhone && (sameTitle || (samePlace && closePrice));
  }) || null;
}

export function marketRows(list: Property[]) {
  const groups = new Map<string, Property[]>();
  list.filter(p => p.deal === 'sale' && p.area > 0).forEach(p => {
    const key = p.compound || p.city;
    groups.set(key, [...(groups.get(key) || []), p]);
  });
  return [...groups.entries()].map(([name, rows]) => {
    const ppm = rows.map(p => p.price / p.area);
    const avg = ppm.reduce((s, n) => s + n, 0) / ppm.length;
    const first = rows[0];
    const change = first.priceHistory && first.priceHistory.length > 1 ? (first.priceHistory.at(-1)!.price - first.priceHistory[0].price) / first.priceHistory[0].price : 0;
    return { name, count: rows.length, avg, min: Math.min(...ppm), max: Math.max(...ppm), currency: currencyOf(first), change, sale: rows.filter(p => p.deal === 'sale').length, rent: list.filter(p => (p.compound || p.city) === name && p.deal === 'rent').length };
  }).sort((a, b) => b.count - a.count);
}

export interface ParsedRequest { locations: string[]; category: string; subtype: string; minArea: number; maxPrice: number; downPayment: number; status: string; deal: '' | 'sale' | 'rent'; notes: string[]; missing: string[] }
export function parseRequest(text: string): ParsedRequest {
  const q = text.toLowerCase();
  const out: ParsedRequest = { locations: [], category: '', subtype: '', minArea: 0, maxPrice: 0, downPayment: 0, status: '', deal: 'sale', notes: [], missing: [] };
  const places: [string, string][] = [['التجمع', 'التجمع الخامس'], ['اكتوبر', '6 أكتوبر'], ['أكتوبر', '6 أكتوبر'], ['زايد', 'الشيخ زايد'], ['رياض', 'الرياض'], ['دبي', 'دبي'], ['مدينتي', 'مدينتي'], ['رحاب', 'الرحاب'], ['أكاديمية', 'جنوب الأكاديمية - التجمع الخامس'], ['اكاديمية', 'جنوب الأكاديمية - التجمع الخامس']];
  places.forEach(([k, v]) => { if (q.includes(k) && !out.locations.includes(v)) out.locations.push(v); });
  if (/فيلا|فيلات/.test(q)) { out.category = 'residential'; out.subtype = 'villa'; }
  else if (/دوبلكس/.test(q)) { out.category = 'residential'; out.subtype = 'duplex'; }
  else if (/بنتهاوس/.test(q)) { out.category = 'residential'; out.subtype = 'penthouse'; }
  else if (/شاليه/.test(q)) { out.category = 'residential'; out.subtype = 'chalet'; }
  else if (/شقة|شقق/.test(q)) { out.category = 'residential'; out.subtype = 'apartment'; }
  else if (/عيادة|طبي/.test(q)) { out.category = 'medical'; out.subtype = 'clinic'; }
  else if (/مكتب|مقر/.test(q)) { out.category = 'commercial'; out.subtype = 'office'; }
  else if (/أرض|ارض/.test(q)) { out.category = 'land'; out.subtype = 'land_residential'; }
  else out.missing.push('لم أحدد نوع العقار، لذلك أعرض كل الأنواع المطابقة للمكان والميزانية.');
  const area = q.match(/(\d+)\s*متر/);
  if (area) out.minArea = +area[1] - 20;
  else out.missing.push('لا توجد مساحة محددة؛ لن أستبعد عقاراً بسبب المساحة.');
  const million = (label: RegExp) => { const m = q.match(label); return m ? Math.round(+m[1] * 1000000) : 0; };
  out.maxPrice = million(/(?:حد أقصى|بحد أقصى|بـ|ب)\s*(\d+(?:\.\d+)?)\s*مليون/) || million(/(\d+(?:\.\d+)?)\s*مليون/);
  out.downPayment = million(/مقدم\s*(\d+(?:\.\d+)?)\s*مليون/);
  if (/استلام فوري|جاهز/.test(q)) out.status = 'ready';
  if (/إيجار|ايجار/.test(q)) out.deal = 'rent';
  if (/ريال/.test(q)) out.notes.push('فهمت العملة كريال عند وجود إعلان سعودي مطابق.');
  if (!out.locations.length) out.missing.push('لم أتعرف على منطقة، لذلك لم أقيّد النتائج بمكان.');
  if (!out.maxPrice && !out.downPayment) out.missing.push('لا توجد ميزانية واضحة، ولن أطبّق حد سعر.');
  return out;
}

export function matchesParsed(p: Property, q: ParsedRequest) {
  if (q.locations.length && !q.locations.some(l => `${p.locationArea || ''} ${p.city} ${p.compound || ''}`.includes(l.replace('6 أكتوبر', 'أكتوبر')) || `${p.locationArea || ''} ${p.city}`.includes(l))) return false;
  if (q.category && p.category !== q.category) return false;
  if (q.subtype && p.subtype !== q.subtype) return false;
  if (q.minArea && p.area && p.area < q.minArea) return false;
  if (q.maxPrice && p.price > q.maxPrice) return false;
  if (q.downPayment && p.downPayment && p.downPayment > q.downPayment) return false;
  if (q.status && p.status && p.status !== q.status) return false;
  if (q.deal && p.deal !== q.deal) return false;
  return true;
}
