import * as Location from 'expo-location';

export type UVCategory = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

export interface UVData {
  uvIndex: number;
  category: UVCategory;
  color: string;
  spfRecommendation: string;
  tanningAdvice: string;
}

function categorize(uv: number): Omit<UVData, 'uvIndex'> {
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
    tanningAdvice: 'Good window — limit to 30 min',
  };
  if (uv <= 7) return {
    category: 'High',
    color: '#E88C39',
    spfRecommendation: 'Apply SPF 50',
    tanningAdvice: 'Brief sessions only — 15 min max',
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
    tanningAdvice: 'Avoid sun exposure',
  };
}

export async function fetchUVIndex(): Promise<UVData> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low,
  });
  const { latitude, longitude } = location.coords;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=uv_index&timezone=auto&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('UV fetch failed');

  const json = await res.json() as { hourly?: { uv_index?: number[] } };
  const currentHour = new Date().getHours();
  const raw = json.hourly?.uv_index?.[currentHour] ?? 0;
  const uvIndex = Math.round(raw);

  return { uvIndex, ...categorize(uvIndex) };
}
