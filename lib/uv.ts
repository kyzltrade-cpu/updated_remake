import * as Location from 'expo-location';

export type UVCategory = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

export interface HourlyUV {
  hour: string;
  uvi: number;
  safe: boolean;
}

export interface UVData {
  uvIndex: number;
  category: UVCategory;
  color: string;
  spfRecommendation: string;
  tanningAdvice: string;
  maxExposureMinutes?: number;
  tanningWindow: string;
  tanningWindowNote: string;
  hourlyForecast: HourlyUV[];
}

interface FitzpatrickType {
  type: number;
  name: string;
  hex: string;
  med: number; // J/m^2
  burnThreshold: number;
}

const FITZPATRICK_PROTOTYPES: FitzpatrickType[] = [
  { type: 1, name: 'Type I', hex: '#FCE5D6', med: 150, burnThreshold: 3 },
  { type: 2, name: 'Type II', hex: '#F3CDB6', med: 220, burnThreshold: 4 },
  { type: 3, name: 'Type III', hex: '#C9956A', med: 350, burnThreshold: 6 },
  { type: 4, name: 'Type IV', hex: '#A87453', med: 500, burnThreshold: 7 },
  { type: 5, name: 'Type V', hex: '#6E3F1F', med: 800, burnThreshold: 8 },
  { type: 6, name: 'Type VI', hex: '#2B1408', med: 1200, burnThreshold: 10 },
];

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '').trim();
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { r, g, b };
}

export function getClosestFitzpatrick(skinToneHex: string): FitzpatrickType {
  const userRgb = hexToRgb(skinToneHex);
  let closest = FITZPATRICK_PROTOTYPES[2]; // Default to Type III
  let minDistance = Infinity;

  for (const proto of FITZPATRICK_PROTOTYPES) {
    const protoRgb = hexToRgb(proto.hex);
    const dist = Math.sqrt(
      (userRgb.r - protoRgb.r) ** 2 +
      (userRgb.g - protoRgb.g) ** 2 +
      (userRgb.b - protoRgb.b) ** 2
    );
    if (dist < minDistance) {
      minDistance = dist;
      closest = proto;
    }
  }
  return closest;
}

function categorize(uv: number): Omit<UVData, 'uvIndex' | 'tanningWindow' | 'tanningWindowNote' | 'hourlyForecast'> {
  if (uv <= 2) return {
    category: 'Low',
    color: '#5DB075',
    spfRecommendation: 'No sunscreen needed',
    tanningAdvice: 'UV too low to tan today',
  };
  if (uv <= 5) return {
    category: 'Moderate',
    color: '#D4AF37',
    spfRecommendation: 'Apply SPF 30',
    tanningAdvice: 'Good window — limit exposure',
  };
  if (uv <= 7) return {
    category: 'High',
    color: '#E88C39',
    spfRecommendation: 'Apply SPF 50',
    tanningAdvice: 'Brief sessions only — stay safe',
  };
  if (uv <= 10) return {
    category: 'Very High',
    color: '#E85A39',
    spfRecommendation: 'SPF 50+, reapply every 2 hrs',
    tanningAdvice: 'Too intense — high burn risk',
  };
  return {
    category: 'Extreme',
    color: '#C0392B',
    spfRecommendation: 'Maximum protection required',
    tanningAdvice: 'Avoid sun exposure completely',
  };
}

function formatHour(h: number): string {
  const period = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}${period}`;
}

function calculateTanningWindow(
  hourlyUvs: number[],
  fitz: FitzpatrickType
): { window: string; note: string } {
  if (fitz.type === 1) {
    return {
      window: 'No safe window',
      note: 'Type I skin cannot safely tan',
    };
  }

  const daylightHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const eligibleHours: number[] = [];

  for (const h of daylightHours) {
    const uvi = hourlyUvs[h] ?? 0;
    if (uvi >= 2.0 && uvi <= fitz.burnThreshold) {
      eligibleHours.push(h);
    }
  }

  if (eligibleHours.length === 0) {
    const maxUv = Math.max(...hourlyUvs);
    if (maxUv < 2.0) {
      return {
        window: 'UV too low today',
        note: 'UV levels insufficient to tan',
      };
    } else {
      const morningShoulder = daylightHours.find(
        (h) => (hourlyUvs[h] ?? 0) > 0 && (hourlyUvs[h] ?? 0) <= fitz.burnThreshold
      );
      if (morningShoulder !== undefined) {
        const start = formatHour(morningShoulder);
        const end = formatHour(morningShoulder + 1);
        const uvi = hourlyUvs[morningShoulder] ?? 0;
        const maxMins = Math.round(fitz.med / (uvi * 1.5));
        return {
          window: `${start} – ${end}`,
          note: `Shoulder hour · ${maxMins} min max`,
        };
      }
      return {
        window: 'Avoid sun today',
        note: 'UV too intense for skin type',
      };
    }
  }

  const first = eligibleHours[0];
  const last = eligibleHours[eligibleHours.length - 1];
  const startStr = formatHour(first);
  const endStr = formatHour(last + 1);

  let sumUv = 0;
  for (const h of eligibleHours) sumUv += hourlyUvs[h] ?? 0;
  const avgUv = sumUv / eligibleHours.length;
  const maxMins = Math.round(fitz.med / (avgUv * 1.5));

  return {
    window: `${startStr} – ${endStr}`,
    note: `Low risk · ${maxMins} min max`,
  };
}

export async function fetchUVIndex(skinToneHex?: string): Promise<UVData> {
  let latitude = 40.7128; // Default fallback to New York
  let longitude = -74.0060;

  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }

    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      latitude = location.coords.latitude;
      longitude = location.coords.longitude;
    } else {
      console.warn('Location permission denied, using fallback coordinates');
    }
  } catch (err) {
    console.warn('Location lookup failed, using fallback coordinates:', err);
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=uv_index&timezone=auto&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('UV fetch failed');

  const json = (await res.json()) as { hourly?: { uv_index?: number[] } };
  const uvs = json.hourly?.uv_index ?? [];
  const currentHour = new Date().getHours();
  const raw = uvs[currentHour] ?? 0;
  const uvIndex = Math.round(raw);

  // Dynamic Skin Fitzpatrick classification
  const fitz = skinToneHex ? getClosestFitzpatrick(skinToneHex) : FITZPATRICK_PROTOTYPES[2];

  // Tanning advice calibration
  const maxExposureMinutes = raw > 0 ? Math.round(fitz.med / (raw * 1.5)) : undefined;

  const baseCategorization = categorize(uvIndex);
  let tanningAdvice = baseCategorization.tanningAdvice;
  if (fitz.type === 1) {
    tanningAdvice = 'Avoid tanning; burn risk only';
  } else if (maxExposureMinutes !== undefined && maxExposureMinutes < 120) {
    tanningAdvice = `Safe max: ${maxExposureMinutes} mins without SPF`;
  }

  const windowResult = calculateTanningWindow(uvs, fitz);

  // Extract key 7 hours for bar chart: 6am, 8am, 10am, 12pm, 2pm, 4pm, 6pm
  const targetHours = [6, 8, 10, 12, 14, 16, 18];
  const hourlyForecast: HourlyUV[] = targetHours.map((h) => {
    const uvi = uvs[h] ?? 0;
    const hourLabel = h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`;
    return {
      hour: hourLabel,
      uvi: Math.round(uvi * 10) / 10, // Keep 1 decimal place for visual accuracy
      safe: uvi <= fitz.burnThreshold,
    };
  });

  return {
    uvIndex,
    ...baseCategorization,
    tanningAdvice,
    maxExposureMinutes,
    tanningWindow: windowResult.window,
    tanningWindowNote: windowResult.note,
    hourlyForecast,
  };
}
