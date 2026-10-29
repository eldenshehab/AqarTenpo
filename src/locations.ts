import type { Property } from './data';

export interface LocItem {
  id: string;
  nameAr: string;
  nameEn: string;
  cityAr: string; // parent label (governorate / country)
  cityEn: string;
  keywords: string[];
  kind: 'country' | 'gov' | 'area';
}

/* All 27 Egyptian governorates */
export const GOVERNORATES: [string, string][] = [
  ['القاهرة', 'Cairo'], ['الجيزة', 'Giza'], ['الإسكندرية', 'Alexandria'], ['الدقهلية', 'Dakahlia'],
  ['البحر الأحمر', 'Red Sea'], ['البحيرة', 'Beheira'], ['الفيوم', 'Fayoum'], ['الغربية', 'Gharbia'],
  ['الإسماعيلية', 'Ismailia'], ['المنوفية', 'Monufia'], ['المنيا', 'Minya'], ['القليوبية', 'Qalyubia'],
  ['الوادي الجديد', 'New Valley'], ['السويس', 'Suez'], ['أسوان', 'Aswan'], ['أسيوط', 'Assiut'],
  ['بني سويف', 'Beni Suef'], ['بورسعيد', 'Port Said'], ['دمياط', 'Damietta'], ['الشرقية', 'Sharqia'],
  ['جنوب سيناء', 'South Sinai'], ['كفر الشيخ', 'Kafr El Sheikh'], ['مطروح', 'Matrouh'], ['الأقصر', 'Luxor'],
  ['قنا', 'Qena'], ['شمال سيناء', 'North Sinai'], ['سوهاج', 'Sohag'],
];

/* Cities, districts and popular compounds: [name AR, name EN, governorate AR] */
const AREAS: [string, string, string][] = [
  ['القاهرة الجديدة', 'New Cairo', 'القاهرة'],
  ['جنوب الأكاديمية - التجمع الخامس', 'South Academy - 5th Settlement', 'القاهرة'],
  ['التجمع الخامس', 'Fifth Settlement', 'القاهرة'],
  ['التجمع الأول', 'First Settlement', 'القاهرة'],
  ['التجمع الثالث', 'Third Settlement', 'القاهرة'],
  ['النرجس الجديدة', 'New Narges', 'القاهرة'],
  ['مدينتي', 'Madinaty', 'القاهرة'],
  ['الرحاب', 'Rehab City', 'القاهرة'],
  ['مدينة الشروق', 'Shorouk City', 'القاهرة'],
  ['العاصمة الإدارية', 'New Capital', 'القاهرة'],
  ['الحي المالي والدبلوماسي', 'Financial District', 'القاهرة'],
  ['R7 / R8 - العاصمة الإدارية', 'R7 / R8 - New Capital', 'القاهرة'],
  ['الزمالك', 'Zamalek', 'القاهرة'],
  ['المعادي', 'Maadi', 'القاهرة'],
  ['دجلة - المعادي', 'Degla - Maadi', 'القاهرة'],
  ['سرايات المعادي', 'Sarayat Maadi', 'القاهرة'],
  ['مصر الجديدة', 'Heliopolis', 'القاهرة'],
  ['مدينة نصر', 'Nasr City', 'القاهرة'],
  ['عباس العقاد - مدينة نصر', 'Abbas El Akkad - Nasr City', 'القاهرة'],
  ['مكرم عبيد - مدينة نصر', 'Makram Ebeid - Nasr City', 'القاهرة'],
  ['المقطم', 'Mokattam', 'القاهرة'],
  ['وسط البلد', 'Downtown Cairo', 'القاهرة'],
  ['شبرا', 'Shubra', 'القاهرة'],
  ['حدائق القبة', 'Hadayek El Kobba', 'القاهرة'],
  ['الشيخ زايد', 'Sheikh Zayed', 'الجيزة'],
  ['بيفرلي هيلز - الشيخ زايد', 'Beverly Hills - Sheikh Zayed', 'الجيزة'],
  ['ديونز - الشيخ زايد', 'Zayed Dunes', 'الجيزة'],
  ['ويست تاون - الشيخ زايد', 'Westown - Sheikh Zayed', 'الجيزة'],
  ['6 أكتوبر', '6th October', 'الجيزة'],
  ['الهرم', 'Haram', 'الجيزة'],
  ['فيصل', 'Faisal', 'الجيزة'],
  ['المهندسين', 'Mohandessin', 'الجيزة'],
  ['الدقي', 'Dokki', 'الجيزة'],
  ['العجوزة', 'Agouza', 'الجيزة'],
  ['روزيتا - الإسكندرية', 'Rosetta - Alexandria', 'الإسكندرية'],
  ['سموحة', 'Smouha', 'الإسكندرية'],
  ['سيدي بشر', 'Sidi Bishr', 'الإسكندرية'],
  ['المنتزه', 'Montaza', 'الإسكندرية'],
  ['العامرية', 'Amreya', 'الإسكندرية'],
  ['برج العرب', 'Borg El Arab', 'الإسكندرية'],
  ['الساحل الشمالي', 'North Coast', 'مطروح'],
  ['رأس الحكمة', 'Ras El Hekma', 'مطروح'],
  ['مراسي - سيدي عبد الرحمن', 'Marassi - Sidi Abdel Rahman', 'مطروح'],
  ['العلمين الجديدة', 'New Alamein', 'مطروح'],
  ['مرسى مطروح', 'Marsa Matrouh', 'مطروح'],
  ['الغردقة', 'Hurghada', 'البحر الأحمر'],
  ['الجونة', 'El Gouna', 'البحر الأحمر'],
  ['سهل حشيش', 'Sahl Hasheesh', 'البحر الأحمر'],
  ['مرسى علم', 'Marsa Alam', 'البحر الأحمر'],
  ['العين السخنة', 'Ain Sokhna', 'السويس'],
  ['بورتو السخنة', 'Porto Sokhna', 'السويس'],
  ['العاشر من رمضان', '10th of Ramadan', 'الشرقية'],
  ['الزقازيق', 'Zagazig', 'الشرقية'],
  ['المنصورة', 'Mansoura', 'الدقهلية'],
  ['دمياط الجديدة', 'New Damietta', 'دمياط'],
  ['بنها', 'Banha', 'القليوبية'],
  ['العبور', 'Obour', 'القليوبية'],
  ['دمنهور', 'Damanhur', 'البحيرة'],
  ['طنطا', 'Tanta', 'الغربية'],
  ['شبين الكوم', 'Shibin El Kom', 'المنوفية'],
  ['مدينة السادات', 'Sadat City', 'المنوفية'],
  ['الخارجة', 'Kharga', 'الوادي الجديد'],
  ['العريش', 'Arish', 'شمال سيناء'],
  ['شرم الشيخ', 'Sharm El Sheikh', 'جنوب سيناء'],
  ['دهب', 'Dahab', 'جنوب سيناء'],
  ['نويبع', 'Nuweiba', 'جنوب سيناء'],
  ['كفر الدوار', 'Kafr El Dawar', 'البحيرة'],
];

/* Countries & international cities */
const COUNTRIES_AR: [string, string][] = [
  ['مصر', 'Egypt'], ['السعودية', 'Saudi Arabia'], ['الإمارات', 'UAE'], ['الكويت', 'Kuwait'],
  ['قطر', 'Qatar'], ['الأردن', 'Jordan'], ['المغرب', 'Morocco'], ['تركيا', 'Turkey'],
  ['أمريكا', 'USA'], ['بريطانيا', 'UK'],
];
const INTL_CITIES: [string, string, string, string][] = [
  ['دبي', 'Dubai', 'الإمارات', 'UAE'], ['أبوظبي', 'Abu Dhabi', 'الإمارات', 'UAE'],
  ['الرياض', 'Riyadh', 'السعودية', 'Saudi Arabia'], ['جدة', 'Jeddah', 'السعودية', 'Saudi Arabia'],
  ['إسطنبول', 'Istanbul', 'تركيا', 'Turkey'], ['لندن', 'London', 'بريطانيا', 'UK'],
  ['الدار البيضاء', 'Casablanca', 'المغرب', 'Morocco'], ['عمّان', 'Amman', 'الأردن', 'Jordan'],
];

const govEn = (ar: string) => GOVERNORATES.find(g => g[0] === ar)?.[1] ?? ar;

export const ALL_LOCATIONS: LocItem[] = [
  ...COUNTRIES_AR.map(([ar, en]) => ({ id: 'c-' + ar, nameAr: ar, nameEn: en, cityAr: 'دولة', cityEn: 'Country', keywords: [], kind: 'country' as const })),
  ...GOVERNORATES.map(([ar, en]) => ({ id: 'g-' + ar, nameAr: ar, nameEn: en, cityAr: 'محافظة · مصر', cityEn: 'Governorate · Egypt', keywords: [], kind: 'gov' as const })),
  ...AREAS.map(([ar, en, gov]) => ({ id: 'a-' + ar, nameAr: ar, nameEn: en, cityAr: gov, cityEn: govEn(gov), keywords: [], kind: 'area' as const })),
  ...INTL_CITIES.map(([ar, en, c, ce]) => ({ id: 'i-' + ar, nameAr: ar, nameEn: en, cityAr: c, cityEn: ce, keywords: [], kind: 'area' as const })),
];

/* Normalize Arabic/English text so that أ/إ/ا, ة/ه, ى/ي and "ال" prefix do not block matches */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();

const stripAl = (w: string) => (w.length > 3 && w.startsWith('ال') ? w.slice(2) : w);

const POPULAR = [
  'جنوب الأكاديمية - التجمع الخامس', 'القاهرة الجديدة', 'الشيخ زايد', 'الساحل الشمالي',
  'العاصمة الإدارية', 'روزيتا - الإسكندرية', 'العين السخنة', 'المعادي', 'الزمالك',
  'مدينة نصر', 'القاهرة', 'الجيزة', 'الإسكندرية', 'مصر',
];

/* Smart search: prefix match first (جن → جنوب الأكاديمية، رو → روزيتا)، then word-start, then contains */
export function searchLocations(query: string, selected: string[], limit = 30): LocItem[] {
  const pool = ALL_LOCATIONS.filter(l => !selected.includes(l.nameAr));
  const q = norm(query);
  if (!q) {
    return POPULAR.map(n => pool.find(l => l.nameAr === n)).filter((x): x is LocItem => !!x);
  }
  const qq = stripAl(q);
  return pool
    .map(l => {
      const name = norm(l.nameAr);
      const en = norm(l.nameEn);
      const parent = norm(l.cityAr);
      const words = [name, en, parent].join(' ').split(/[\s\-–·]+/).filter(Boolean).map(stripAl);
      let score = 0;
      if (name.startsWith(q) || stripAl(name).startsWith(qq)) score = 100;
      else if (en.startsWith(q)) score = 90;
      else if (words.some(w => w.startsWith(qq))) score = 70;
      else if (name.includes(q) || en.includes(q) || parent.includes(q)) score = 40;
      // areas/compounds rank slightly above governorates on equal match quality
      if (score > 0 && l.kind === 'area') score += 2;
      return { l, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.l);
}

/* City → governorate mapping for listings */
const CITY_GOV: Record<string, string> = {
  'القاهرة الجديدة': 'القاهرة', 'العاصمة الإدارية': 'القاهرة', 'الزمالك': 'القاهرة', 'المعادي': 'القاهرة',
  'مدينة نصر': 'القاهرة', 'الشروق': 'القاهرة', 'الشيخ زايد': 'الجيزة', '6 أكتوبر': 'الجيزة',
  'الساحل الشمالي': 'مطروح', 'العلمين الجديدة': 'مطروح', 'العين السخنة': 'السويس',
  'العاشر من رمضان': 'الشرقية', 'الغردقة': 'البحر الأحمر', 'الإسكندرية': 'الإسكندرية',
};

export function propLocationKeys(p: Property): string[] {
  const areaGov = AREAS.find(a => a[0] === p.locationArea)?.[2];
  const gov = CITY_GOV[p.city] ?? areaGov ?? GOVERNORATES.find(g => g[0] === p.city)?.[0] ?? '';
  return [p.locationArea, p.city, gov, p.country || 'مصر']
    .filter((s): s is string => !!s)
    .map(norm);
}

/* Does a property match a selected location chip? */
export function matchesLocation(p: Property, selected: string): boolean {
  const q = norm(selected);
  const keys = propLocationKeys(p);
  const known = ALL_LOCATIONS.some(l => l.nameAr === selected);
  if (known) return keys.includes(q);
  const text = norm(`${p.title} ${p.titleEn} ${p.city} ${p.locationArea ?? ''} ${p.desc}`);
  return keys.some(k => k.includes(q)) || text.includes(q);
}
