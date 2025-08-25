

export type Terrain = "road" | "smooth" | "mixed" | "technical" | "sandy";

export interface TerrainSegment {
  id: string;
  dist: number;
  terrain: Terrain;
}

export interface Leg {
  id:string;
  name?: string;
  dist: number;
  gain: number;
  loss: number;
  terrain: Terrain;
  stop: number;
  sleepMinutes?: number;
  notes?: string; // For Crew, shown on full plan
  runnerNotes?: string; // For Runner, shown on runner cards
  pacerNotes?: string; // For Pacer, shown on pacer cards
  cutoff?: string;
  crewAccess?: boolean;
  pacerIn?: boolean;
  pacerOut?: boolean;
  dropBag?: boolean;
  terrainSegments?: TerrainSegment[];
}

export interface Profile {
  heat: number;
  fadePer10k: number;
  nightConf: "High" | "Medium" | "Low";
  upCostPct: number;
  downBenefitPct: number;
  downPenaltyPct: number;
  tRoad: number;
  tSmooth: number;
  tMixed: number;
  tTech: number;
  tSand: number;
  hike: boolean;
  hikeThr: number;
  vam: number;
  poles: boolean;
  packKg: number;
  muscularResilience: number;
  hikingEconomyFactor: number;
}

export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
  cum: number; // cumulative distance in meters
}

export interface GpxData {
  pts: GpxPoint[];
  dist_m: number;
  gain_m: number;
  loss_m: number;
}

export interface Segment {
  len_m: number;
  ele: number;
  grade: number;
}

export interface ChartDataPoint {
    km: number;
    elevation: number;
    pace: number; // s/km
    leg?: number;
    cumulativeTime?: number; // seconds from start
    terrain: Terrain;
    grade: number;
}

export interface ComputationResult {
    flatTime: number;
    finalTime: number;
    addedTimes: {
        elevation: number;
        terrain: number;
        stops: number;
        night: number;
        weather: number;
        fatigue: number;
    };
    chartData: ChartDataPoint[];
}

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
}

export type MarkerIcon = 'water' | 'creek' | 'hut' | 'first-aid' | 'food' | 'general' | 'photo' | 'toilet';

export const markerIcons: { value: MarkerIcon, label: string }[] = [
    { value: 'water', label: '💧 Water' },
    { value: 'creek', label: '🌊 Creek' },
    { value: 'hut', label: '🛖 Hut' },
    { value: 'first-aid', label: '⛑️ First Aid' },
    { value: 'food', label: '🍎 Food' },
    { value: 'toilet', label: '🚽 Toilet' },
    { value: 'general', label: '📍 General' },
    { value: 'photo', label: '📸 Photo Op' },
];

export interface Marker {
  id: string;
  km: number;
  note: string;
  icon: MarkerIcon;
}

export interface NightPeriod {
  x1: number;
  x2: number;
}

export interface RaceEvent {
  km: number;
  type: 'sunrise' | 'sunset';
}

export interface LegPlanInfo {
  leg: Leg;
  legRunningTime: number; // in seconds
  carbsNeeded: number;
  waterNeeded: number;
  adjustedPace: number; // in s/km
  segments: ChartDataPoint[];
  startKm: number;
  endKm: number;
  cumulativeDist: number;
  arrivalTime: Date;
  departureTime: Date;
  totalStopTimeMins: number;
  markers: Marker[];
  terrainSegments?: TerrainSegment[];
  terrainBreakdown?: string;
}

export interface SupportNote {
    do: string;
    say: string;
}