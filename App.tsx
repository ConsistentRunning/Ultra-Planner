
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Leg, Profile, GpxData, Segment, Terrain, ChartDataPoint, SunTimes, Marker, NightPeriod, RaceEvent, TerrainSegment, LegPlanInfo, ComputationResult, GpxPoint, MarkerIcon, markerIcons, SupportNote } from './types';
import { Controls } from './components/Controls';
import { Visuals } from './components/Visuals';
import { ProfileModal } from './components/ProfileModal';
import { InfoModal } from './components/InfoModal';
import { parseGPX as parseGPXUtil, presets, whyRows, clamp, SEGMENT_LENGTH_M, fmtTime, getFatigueReset, getMuscularFatigueReset, getWeatherFactor, getNightFactor, getTerrainFactor, getElevationAtKm, formatMinutes, terrainColors, getElevationAtDistanceM, MENTAL_NOTES, HELPER_NOTE_MODULES, HelperModuleKey, getRandomNote, replaceRandomNote, COMPREHENSIVE_CREW_NOTES, PACER_NOTE_MODULES, getRandomSupportNote, GENERAL_PACER_NOTES } from './utils';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { LegsEditor } from './components/LegsEditor';
import { MarkersEditor } from './components/MarkersEditor';
import { RacePlan } from './components/RacePlan';
import { TerrainTuningModal } from './components/TerrainTuningModal';
import { AidStationTemplateModal } from './components/AidStationTemplateModal';
import jsPDF from 'jspdf';
import SunCalc from 'suncalc';
import { RunnerCardsModal } from './components/RunnerCardsModal';
import { MentalStrategyModal } from './components/MentalStrategyModal';
import { TimeBreakdownExplanationModal } from './components/TimeBreakdownExplanationModal';
import { WelcomeModal } from './components/AppGuideModal';


const Logo: React.FC = () => (
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
         viewBox="540 250 200 210" className="h-14 w-auto" aria-label="Consistent Running Logo" role="img">
        <g>
            <g>
                <path fill="#98CA3C" d="M707.404,439.735c-0.025,0.607-0.018,0.558-0.042,1.165c-5.749,1.447-11.591,6.032-17.299,5.891 c-5.034-0.133-9.719,0.399-14.536,1.299c-0.524-0.25-1.032-0.483-1.572-0.741c-2.098-4.102-2.446-8.354-1.956-13.071 c0.383-3.72-0.682-7.797-1.938-11.433c-2.496-7.239-6.108-14.129-8.229-21.459c-1.481-5.092-1.539-10.675-1.647-16.059 c-0.051-2.821-0.292-5.225-2.08-7.33c-0.184-0.217-0.375-0.424-0.591-0.633c-4.868-4.734-9.619-9.585-14.486-14.461 c-7.223,7.871-14.004,15.303-20.835,22.673c-2.263,2.447-4.935,2.871-7.955,1.282c-7.513-3.953-15.002-7.945-22.606-11.699 c-6.091-3.012-12.314-5.766-18.556-8.453c-1.098-0.475-2.637-0.217-3.902,0.051c-3.353,0.682-6.689,2.246-10.001,2.171 c-3.395-0.067-5.85,0.79-8.354,2.87c-0.949,0.783-2.347,1.016-3.67,1.348c-0.491,0.117-0.974-0.166-1.098-0.656 c-0.408-1.656-1.099-3.445-0.541-4.66c1.182-2.579,2.953-5.758,5.3-6.731c5.226-2.18,8.912-5.882,12.789-9.644 c5.217-5.059,6.182-2.979,10.417,2.022c1.798,2.122,3.711,4.518,6.116,5.699c5.865,2.903,12.056,4.735,18.796,5.159 c4.094,0.266,8.246,2.246,11.99,4.186c2.014,1.039,3.054,0.957,4.151-0.592c1.132-1.572,2.113-3.27,3.013-4.992 c2.812-5.408,5.633-10.816,8.262-16.309c0.516-1.09,0.566-2.67,0.242-3.86c-2.646-9.718-0.441-18.006,6.34-25.503 c1.556-1.713,2.405-5.316,1.764-7.521c-2.329-7.946-2.87-15.826-1.747-23.996c0.333-2.389-0.541-4.943-0.898-7.738 c-5.75,1.93-11.374,3.76-16.925,5.773c-0.59,0.217-1.122,1.557-1.09,2.355c0.309,7.355,0.69,14.702,1.198,22.041 c0.075,1.008,0.841,2.055,1.481,2.921c3.245,4.368,3.154,7.072-0.449,10.525c-1.664,1.597-8.362,1.198-10.085-1.182 c-1.048-1.439-1.589-4.169-0.948-5.741c3.021-7.405,1.156-14.645-0.333-21.809c-2.496-12.072-1.897-13.854,8.695-19.828 c5.275-2.979,11.224-4.692,15.501-9.576c1.465-1.673,4.818-2.064,7.372-2.313c4.51-0.449,9.078-0.341,14.42-0.491 c-0.641-1.93-0.841-3.727-1.739-5.075c-7.579-11.392-2.612-19.212,9.951-23.606c0.85-0.299,1.772-0.291,2.612,0.042 c4.835,1.947,11.067,5.026,11.259,10.768c0.191,5.6-0.058,11.224-0.266,16.833c-0.076,2.138-0.883,3.802-3.67,3.186 c-0.541-0.115-1.672,0.607-1.822,1.141c-0.149,0.541,0.407,1.506,0.939,1.972c0.708,0.624,1.648,1.248,2.547,1.349 c5.808,0.665,7.297,4.959,8.162,9.66c1.106,5.982,1.931,12.006,3.046,17.988c0.267,1.481,1.114,4.002,1.813,4.044 c1.748,0.108,3.687-0.707,5.292-1.622c0.957-0.541,1.281-2.105,2.146-2.954c0.849-0.823,1.947-1.673,3.054-1.889 c4.152-0.815,4.992,2.13,5.691,5.267c0.757,3.445-0.957,5.201-3.869,6.416c-3.928,1.646-7.729,3.61-11.707,5.066 c-2.288,0.841-5.043,1.739-7.197,1.166c-1.863-0.483-3.188-3.013-4.426-4.303c-1.882,4.136-4.261,8.729-6.1,13.521 c-2.813,7.33-5.284,14.785-7.813,22.216c-0.241,0.698-0.133,1.798,0.225,2.446c4.834,8.57,9.76,17.074,14.603,25.636 c0.358,0.624,0.707,1.257,1.065,1.88c0.791,1.398,1.647,2.996,1.722,4.527c0.55,11.656,1.124,23.321,1.307,34.995 c0.208,12.697,6.831,20.735,17.973,25.512C699.333,438.421,703.626,438.471,707.404,439.735z"/>
                <path fill="#98CA3C" d="M718.278,299.276c-9.177-10.709-20.918-19.13-34.289-24.264c-0.324-1.655-0.907-3.994-2.155-6.248 C696.403,275.687,708.918,286.255,718.278,299.276z"/>
                <g>
                    <path fill="#98CA3C" d="M696.453,431.269c0.445,0.212,0.891,0.422,1.358,0.623c0.361,0.154,0.747,0.29,1.152,0.413 c5.968-4.61,11.39-9.918,16.134-15.815C709.599,422.245,703.324,427.228,696.453,431.269z"/>
                </g>
                <path fill="#98CA3C" d="M668.33,448.057c-9.27,2.763-19.112,4.135-29.288,3.86c-34.356-0.933-63.937-20.294-79.787-48.501 c-4.394-7.813-7.729-16.3-9.826-25.261c1.431-0.342,3.236-0.865,4.851-2.197c1.506-1.256,2.713-1.664,4.784-1.621 c3.004,0.074,5.725-0.75,8.13-1.465c0.832-0.242,1.605-0.467,2.354-0.65c1.905,10.368,5.642,20.104,10.85,28.84 c14.562,24.404,40.688,41.02,70.9,41.844c5.242,0.142,10.384-0.208,15.385-0.989C666.99,444.087,667.522,446.117,668.33,448.057z"/>
                <path fill="#98CA3C" d="M623.315,261.559c-2.08,1.714-4.609,2.929-7.438,4.284c-1.614,0.775-3.286,1.573-4.95,2.514 c-11.167,6.307-13.805,10.234-12.124,21.284c-15.617,13.246-26.534,32.06-29.737,53.534c-0.108-0.008-0.217-0.024-0.333-0.033 c-3.611-0.191-6.415,2.022-8.903,4.428l-0.466,0.457c-3.528,3.428-6.573,6.382-10.634,8.079c-0.657,0.274-1.265,0.616-1.839,1.007 c-0.017-1.273-0.017-2.547,0.025-3.836C548.155,307.497,580.78,270.054,623.315,261.559z"/>
                <path fill="#3E3E3E" d="M734.404,358.36c-0.823,30.52-18.114,56.663-43.001,69.935c-3.903-2.904-6.365-6.549-7.514-11.059 c19.046-12.78,31.868-34.455,32.542-59.358c0.158-5.967-0.383-11.781-1.564-17.373c-2.504-11.965-7.896-22.883-15.418-31.936 c6.49-3.369,6.407-8.853,5.725-11.947c-0.332-1.506-0.732-3.07-1.465-4.535c11.3,9.003,20.145,21.002,25.387,34.78 C732.798,336.618,734.704,347.261,734.404,358.36z"/>
                <path fill="#3E3E3E" d="M666.617,433.721c0.249-2.41-0.443-5.272-1.175-7.602c-7.397,2.331-15.291,3.491-23.463,3.271 c-21.139-0.574-39.909-10.274-52.757-25.275c14.152,19.694,36.826,32.762,62.715,33.464c4.936,0.134,9.778-0.19,14.491-0.928 C666.459,435.699,666.512,434.733,666.617,433.721z"/>
            </g>
        </g>
    </svg>
);

const App: React.FC = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    const [raceName, setRaceName] = useState("My Ultra Race");
    const [flatTimeStr, setFlatTimeStr] = useState("24:00:00");
    const [distanceKm, setDistanceKm] = useState(161);
    const [startDate, setStartDate] = useState(formattedDate);
    const [startTime, setStartTime] = useState("06:00");
    const [nightFrom, setNightFrom] = useState("19:00");
    const [nightTo, setNightTo] = useState("06:00");
    const [tempC, setTempC] = useState(18);
    const [nightTempDrop, setNightTempDrop] = useState(8);
    const [humPct, setHumPct] = useState(50);
    const [sun, setSun] = useState<'Partly Cloudy' | 'Sunny' | 'Overcast'>('Partly Cloudy');
    const [profile, setProfile] = useState<Profile>(presets.allrounder);
    const [gpxData, setGpxData] = useState<GpxData | null>(null);
    const [gpxFileName, setGpxFileName] = useState('');
    const [smoothM, setSmoothM] = useState(1000);
    const [legs, setLegs] = useState<Leg[]>([]);
    const [isLegMode, setIsLegMode] = useState(false);
    const [simpleGain, setSimpleGain] = useState(1000);
    const [simpleLoss, setSimpleLoss] = useState(1000);
    const [simpleTerrain, setSimpleTerrain] = useState<Terrain>('mixed');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
    const [isLegsInfoModalOpen, setIsLegsInfoModalOpen] = useState(false);
    const [isFromDistInfoModalOpen, setIsFromDistInfoModalOpen] = useState(false);
    const [isAutoNotesInfoModalOpen, setIsAutoNotesInfoModalOpen] = useState(false);
    const [isSleepInfoModalOpen, setIsSleepInfoModalOpen] = useState(false);
    const [isNightInfoModalOpen, setIsNightInfoModalOpen] = useState(false);
    const [isHikeInfoModalOpen, setIsHikeInfoModalOpen] = useState(false);
    const [isRunnerCardsModalOpen, setIsRunnerCardsModalOpen] = useState(false);
    const [isMentalStrategyModalOpen, setIsMentalStrategyModalOpen] = useState(false);
    const [isRiegelInfoModalOpen, setIsRiegelInfoModalOpen] = useState(false);
    const [isTimeBreakdownExplanationModalOpen, setIsTimeBreakdownExplanationModalOpen] = useState(false);
    const [selectedNoteModules, setSelectedNoteModules] = useState<HelperModuleKey[]>([]);
    const [carbsPerHour, setCarbsPerHour] = useState(70);
    const [waterPerHour, setWaterPerHour] = useState(500);
    const [modelType, setModelType] = useState<'predict' | 'goal'>('predict');
    const [goalTimeStr, setGoalTimeStr] = useState("13:30:00");
    const [referenceDistance, setReferenceDistance] = useState<'race' | '10k' | 'half' | 'marathon' | '50k'>('race');
    const [referenceTimeStr, setReferenceTimeStr] = useState("24:00:00");
    const [isSleepPlanned, setIsSleepPlanned] = useState(false);
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [tuningLeg, setTuningLeg] = useState<Leg | null>(null);
    const [focusedLegId, setFocusedLegId] = useState<string | null>(null);
    const planRef = useRef<HTMLDivElement>(null);
    const [isChartExpanded, setIsChartExpanded] = useState(false);
    const [checklistItems, setChecklistItems] = useState<string[]>(['Fill water', 'Take salt tab', 'Grab food', 'Lube feet', 'Tell a joke']);
    const [feedbackItems, setFeedbackItems] = useState<string[]>(['Energy level (1-5)', 'Stomach issues (Y/N)', 'Pain points?', 'Mental state (1-5)']);
    const [isAidStationModalOpen, setIsAidStationModalOpen] = useState(false);
    const [showChecklist, setShowChecklist] = useState(true);
    const [showFeedback, setShowFeedback] = useState(true);
    const [isGreyscale, setIsGreyscale] = useState(false);
    const [autoFilledTargets, setAutoFilledTargets] = useState<{ runner: boolean; crew: boolean; pacer: boolean; }>({ runner: false, crew: false, pacer: false });
    const prevLegsRef = useRef<Leg[]>(legs);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

    useEffect(() => {
        const hasVisited = localStorage.getItem('hasVisitedUltraPlanner');
        if (!hasVisited) {
            setIsWelcomeModalOpen(true);
            localStorage.setItem('hasVisitedUltraPlanner', 'true');
        }
    }, []);

    const isTimeNight = (time: Date, nightFrom: string, nightTo: string): boolean => {
        if (isNaN(time.getTime())) return false;
        const timePartsStart = nightFrom.split(':').map(Number);
        const nightStartSecs = timePartsStart[0] * 3600 + timePartsStart[1] * 60;
        const timePartsEnd = nightTo.split(':').map(Number);
        const nightEndSecs = timePartsEnd[0] * 3600 + timePartsEnd[1] * 60;
        const secsIntoDay = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
        return (nightStartSecs > nightEndSecs && (secsIntoDay >= nightStartSecs || secsIntoDay < nightEndSecs)) || 
                (nightStartSecs < nightEndSecs && secsIntoDay >= nightStartSecs && secsIntoDay < nightEndSecs);
    };

    useEffect(() => {
        if (modelType !== 'predict') {
            return;
        }

        const parseTimeToSeconds = (timeStr: string): number => {
            const parts = timeStr.split(':').map(Number);
            if (parts.length < 2 || parts.some(isNaN)) return 0;
            return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
        };

        if (referenceDistance === 'race') {
            setFlatTimeStr(referenceTimeStr);
        } else {
            const distanceMap = {
                '10k': 10,
                'half': 21.0975,
                'marathon': 42.195,
                '50k': 50,
            };
            const d1 = distanceMap[referenceDistance as keyof typeof distanceMap];
            const d2 = distanceKm;
            const t1 = parseTimeToSeconds(referenceTimeStr);

            if (d1 > 0 && d2 > 0 && t1 > 0) {
                // Riegel's endurance model: T2 = T1 * (D2 / D1) ^ 1.06
                const t2 = t1 * Math.pow(d2 / d1, 1.06);
                setFlatTimeStr(fmtTime(t2));
            } else {
                setFlatTimeStr("0:00:00"); // Indicate an error or invalid input
            }
        }
    }, [referenceDistance, referenceTimeStr, distanceKm, modelType]);

    useEffect(() => {
        if (gpxData) {
            setDistanceKm(gpxData.dist_m / 1000);
            if (!isLegMode) {
                setSimpleGain(gpxData.gain_m);
                setSimpleLoss(gpxData.loss_m);
            }
        }
    }, [gpxData, isLegMode]);
    
    const parseGPX = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const gpx = parseGPXUtil(e.target!.result as string);
            setGpxData(gpx);
            setGpxFileName(file.name);
        };
        reader.readAsText(file);
    }, []);

    const effectiveLegs = useMemo((): Leg[] => {
        if (!isLegMode) {
            return [{ id: 'simple', dist: distanceKm, gain: simpleGain, loss: simpleLoss, terrain: simpleTerrain, stop: 0 }];
        }
        return legs;
    }, [isLegMode, distanceKm, simpleGain, simpleLoss, simpleTerrain, legs]);

    const sunTimes = useMemo((): SunTimes => {
        if (gpxData?.pts?.[0]) {
            const { lat, lon } = gpxData.pts[0];
            const date = new Date(startDate + 'T12:00:00');
            if (!isNaN(date.getTime())) {
                const times = SunCalc.getTimes(date, lat, lon);
                return { sunrise: times.sunrise, sunset: times.sunset };
            }
        }
        return { sunrise: null, sunset: null };
    }, [gpxData, startDate]);

    useEffect(() => {
        if (sunTimes.sunrise && sunTimes.sunset) {
            setNightTo(sunTimes.sunrise.toTimeString().substring(0, 5));
            setNightFrom(sunTimes.sunset.toTimeString().substring(0, 5));
        }
    }, [sunTimes]);

    const computation = useMemo((): ComputationResult | null => {
        const parseTimeToSeconds = (timeStr: string): number => {
            const parts = timeStr.split(':').map(Number);
            return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
        };

        let flatTime: number;
        if (modelType === 'predict') {
            flatTime = parseTimeToSeconds(flatTimeStr);
        } else {
            const goalTime = parseTimeToSeconds(goalTimeStr);
            let low = 0, high = goalTime * 2;
            let bestFlatTime = goalTime;
            for (let i = 0; i < 20; i++) { // 20 iterations for binary search
                const mid = (low + high) / 2;
                const tempResult = compute(mid);
                if (tempResult.finalTime < goalTime) {
                    high = mid;
                    bestFlatTime = mid;
                } else {
                    low = mid;
                }
            }
            flatTime = bestFlatTime;
        }

        if (flatTime <= 0) return null;
        
        function compute(flatTimeSeconds: number): ComputationResult {
            const totalDistKm = effectiveLegs.reduce((sum, leg) => sum + leg.dist, 0);
            const totalDistM = totalDistKm * 1000;
            if (totalDistKm <= 0) return { flatTime: 0, finalTime: 0, addedTimes: { elevation: 0, terrain: 0, stops: 0, night: 0, weather: 0, fatigue: 0 }, chartData: [] };
            const flatSpeedKmps = totalDistKm / flatTimeSeconds;

            const addedTimes = { elevation: 0, terrain: 0, stops: 0, night: 0, weather: 0, fatigue: 0 };
            const chartData: ChartDataPoint[] = [];

            let currentDistM = 0;
            let currentTimeS = 0;
            let effortSeconds = 0;
            let muscularDamageScore = 0;
            let fatigueFactor = 1.0;
            let currentFatigueReset = 0;

            const raceStartDate = new Date(`${startDate}T${startTime}`);
            if(isNaN(raceStartDate.getTime())) return { flatTime: 0, finalTime: 0, addedTimes: { elevation: 0, terrain: 0, stops: 0, night: 0, weather: 0, fatigue: 0 }, chartData: [] };


            effectiveLegs.forEach((leg, legIndex) => {
                const legStartDistM = currentDistM;
                const legDistM = leg.dist * 1000;
                let segments: Segment[] = [];
                if (gpxData) {
                    const startM = currentDistM;
                    const endM = currentDistM + legDistM;
                    let lastEle = getElevationAtDistanceM(startM, gpxData.pts);
                    for (let d = startM + SEGMENT_LENGTH_M; d <= endM; d += SEGMENT_LENGTH_M) {
                        const ele = getElevationAtDistanceM(d, gpxData.pts);
                        segments.push({ len_m: SEGMENT_LENGTH_M, ele: ele, grade: ((ele - lastEle) / SEGMENT_LENGTH_M) * 100 });
                        lastEle = ele;
                    }
                } else {
                    const numSegments = Math.round(legDistM / SEGMENT_LENGTH_M);
                    const gainPerSegment = (leg.gain / numSegments) || 0;
                    const lossPerSegment = (leg.loss / numSegments) || 0;
                    // Simplified grade model for non-gpx data
                    const grade = ((leg.gain - leg.loss) / legDistM) * 100;
                    for (let i = 0; i < numSegments; i++) {
                        segments.push({ len_m: SEGMENT_LENGTH_M, ele: 0, grade }); // ele is not accurate here
                    }
                }
                
                const legTerrainSegments = (leg.terrainSegments && leg.terrainSegments.length > 0) ? leg.terrainSegments : [{ id: 'default', dist: leg.dist, terrain: leg.terrain }];

                segments.forEach(seg => {
                    const currentDistKm = (currentDistM + seg.len_m / 2) / 1000;
                    
                    let segmentTerrain = leg.terrain;
                    const distIntoLegKm = (currentDistM - legStartDistM + (seg.len_m / 2)) / 1000;
                    let accumulatedTerrainDistKm = 0;
                    for (const ts of legTerrainSegments) {
                        accumulatedTerrainDistKm += ts.dist;
                        if (distIntoLegKm <= accumulatedTerrainDistKm) {
                            segmentTerrain = ts.terrain;
                            break;
                        }
                    }

                    const basePaceSpk = 1 / flatSpeedKmps;
                    let paceSpk = basePaceSpk;

                    const terrainFactor = getTerrainFactor(segmentTerrain, profile);
                    const terrainTime = basePaceSpk * (terrainFactor - 1);
                    paceSpk += terrainTime;
                    addedTimes.terrain += terrainTime * seg.len_m / 1000;

                    let grade = seg.grade;
                    let elevationTime = 0;
                    const isHiking = profile.hike && grade > profile.hikeThr;

                    if (isHiking) {
                        const vam_mps = profile.vam / 3600;
                        const verticalTime = (seg.grade/100 * seg.len_m) / vam_mps;
                        
                        const horizontalPaceFactor = 1.5 + (grade-profile.hikeThr)/10 * 0.2; // Slower horizontal speed on steep hikes
                        const horizontalPace = basePaceSpk * terrainFactor * horizontalPaceFactor;
                        const horizontalTime = (seg.len_m / 1000) * horizontalPace;
                        
                        const hikeTime = Math.max(verticalTime, horizontalTime);
                        elevationTime = hikeTime - (basePaceSpk * seg.len_m / 1000);
                        paceSpk = hikeTime / (seg.len_m / 1000);

                    } else if (grade > 0) {
                        elevationTime = (basePaceSpk * (profile.upCostPct / 100) * grade);
                        paceSpk += elevationTime;
                    } else if (grade < 0) {
                        const benefit = -grade * (profile.downBenefitPct / 100) * (grade > -3 ? 1 : 0);
                        const penalty = -grade * (profile.downPenaltyPct / 100) * (grade <= -3 ? 1 : 0);
                        elevationTime = basePaceSpk * (penalty - benefit);
                        paceSpk += elevationTime;
                    }
                    addedTimes.elevation += elevationTime * seg.len_m / 1000;
                    
                    const segTimeS = paceSpk * (seg.len_m / 1000);
                    
                    // --- ADVANCED FATIGUE MODEL ---
                    // 1. Calculate Muscular Damage
                    let damageCoefficient = 0;
                    if (isHiking) {
                        damageCoefficient = 0.2; // Uphill Hike
                    } else if (grade < -10) {
                        damageCoefficient = 3.0; // Steep Downhill Run
                    } else if (grade < -2) {
                        damageCoefficient = 2.0; // Moderate Downhill Run
                    } else if (grade > 2) {
                        damageCoefficient = 1.0; // Uphill Run
                    } else {
                        damageCoefficient = 0.5; // Flat Run
                    }
                    muscularDamageScore += (seg.len_m / 1000) * damageCoefficient;

                    // 2. Calculate Metabolic Effort (with Hiking Economy Bonus)
                    let effortFactor = paceSpk / basePaceSpk;

                    if (segmentTerrain === 'slow') {
                        const terrainSlowFactor = getTerrainFactor(segmentTerrain, profile);
                        if (terrainSlowFactor > 0) {
                            effortFactor /= terrainSlowFactor;
                        }
                    }

                    if (isHiking) {
                        const hikingEconomyFactor = profile.hikingEconomyFactor ?? 0.085;
                        effortFactor *= (1 - hikingEconomyFactor);
                    }
                    effortSeconds += segTimeS * effortFactor;

                    // 3. Calculate Dynamic Fatigue Factor
                    const baseFadeRate = (profile.fadePer10k || 1.0) / 100;
                    const muscularResilience = profile.muscularResilience ?? 0.003;
                    let effectiveFadeRate = baseFadeRate * (1 + (muscularDamageScore * muscularResilience));

                    if (currentDistM > totalDistM * 0.9) {
                        const pullFactor = 1 - (0.25 * ((currentDistM / totalDistM) - 0.9) / 0.1);
                        effectiveFadeRate *= Math.max(0, pullFactor);
                    }
                    
                    fatigueFactor = 1.0 + (effortSeconds / 36000) * effectiveFadeRate * (1 - currentFatigueReset);
                    const fatigueTime = segTimeS * (fatigueFactor - 1);
                    addedTimes.fatigue += fatigueTime;
                    // --- END ADVANCED FATIGUE MODEL ---
                    
                    const realTime = new Date(raceStartDate.getTime() + currentTimeS * 1000);
                    const timePartsStart = nightFrom.split(':').map(Number);
                    const nightStartSecs = timePartsStart[0] * 3600 + timePartsStart[1] * 60;
                    const timePartsEnd = nightTo.split(':').map(Number);
                    const nightEndSecs = timePartsEnd[0] * 3600 + timePartsEnd[1] * 60;
                    const secsIntoDay = realTime.getHours() * 3600 + realTime.getMinutes() * 60 + realTime.getSeconds();
                    
                    const isNight = (nightStartSecs > nightEndSecs && (secsIntoDay >= nightStartSecs || secsIntoDay < nightEndSecs)) || (nightStartSecs < nightEndSecs && secsIntoDay >= nightStartSecs && secsIntoDay < nightEndSecs);
                    const nightFactor = isNight ? getNightFactor(profile.nightConf) : 1.0;
                    const nightTime = segTimeS * (nightFactor - 1);
                    addedTimes.night += nightTime;

                    const currentTemp = tempC - (isNight ? nightTempDrop : 0);
                    const weatherFactor = getWeatherFactor(currentTemp, humPct, sun, profile.heat);
                    const weatherTime = segTimeS * (weatherFactor - 1);
                    addedTimes.weather += weatherTime;
                    
                    const totalFactor = fatigueFactor * nightFactor * weatherFactor;
                    const finalSegTime = segTimeS * totalFactor;
                    
                    chartData.push({ 
                        km: currentDistKm, 
                        elevation: seg.ele, 
                        pace: (paceSpk * totalFactor * terrainFactor), 
                        leg: legIndex + 1, 
                        cumulativeTime: currentTimeS + finalSegTime,
                        terrain: segmentTerrain,
                        grade: seg.grade
                    });
                    
                    currentTimeS += finalSegTime;
                    currentDistM += seg.len_m;
                });

                addedTimes.stops += leg.stop * 60;
                currentTimeS += leg.stop * 60;

                if(leg.sleepMinutes && leg.sleepMinutes > 0){
                    const sleepMins = leg.sleepMinutes;
                    currentTimeS += sleepMins * 60;
                    addedTimes.stops += sleepMins * 60;
                    
                    // Differentiated Sleep Recovery
                    currentFatigueReset += getFatigueReset(sleepMins);
                    currentFatigueReset = Math.min(1, currentFatigueReset);

                    const muscularReset = getMuscularFatigueReset(sleepMins);
                    muscularDamageScore *= (1 - muscularReset);
                }
            });

            const finalTime = currentTimeS;
            return { flatTime: flatTimeSeconds, finalTime, addedTimes, chartData };
        }
        
        return compute(flatTime);
    }, [flatTimeStr, distanceKm, simpleGain, simpleLoss, simpleTerrain, legs, isLegMode, profile, gpxData, startDate, startTime, nightFrom, nightTo, tempC, nightTempDrop, humPct, sun, modelType, goalTimeStr]);

    const legPlan = useMemo((): LegPlanInfo[] | null => {
        if (!isLegMode || !computation || effectiveLegs.length === 0) return null;

        const raceStartMillis = new Date(`${startDate}T${startTime}`).getTime();
        if (isNaN(raceStartMillis)) {
            console.error("Invalid start date/time, cannot generate plan details.");
            return null;
        }

        let cumulativeDist = 0;
        let cumulativeTime = 0;

        return effectiveLegs.map(leg => {
            const startKm = cumulativeDist;
            const endKm = cumulativeDist + leg.dist;
            
            const relevantSegments = computation.chartData.filter(p => p.km > startKm && p.km <= endKm);
            
            const startTime = cumulativeTime;
            const endTime = relevantSegments.length > 0 ? relevantSegments[relevantSegments.length - 1].cumulativeTime! : startTime;
            const legRunningTime = endTime - startTime;
            
            cumulativeTime = endTime;
            const arrivalTime = new Date(raceStartMillis + cumulativeTime * 1000);
            
            const totalStopTimeMins = (leg.stop || 0) + (leg.sleepMinutes || 0);
            cumulativeTime += totalStopTimeMins * 60;
            const departureTime = new Date(raceStartMillis + cumulativeTime * 1000);
            
            cumulativeDist += leg.dist;
            const carbsNeeded = leg.dist > 0 ? Math.round((legRunningTime / 3600) * carbsPerHour) : 0;
            const waterNeeded = leg.dist > 0 ? Math.round((legRunningTime / 3600) * waterPerHour) : 0;
            const adjustedPace = leg.dist > 0 ? legRunningTime / leg.dist : 0;

            const legMarkers = markers.filter(m => m.km > startKm && m.km <= endKm);
            
            let terrainBreakdown = '';
            if (leg.terrainSegments && leg.terrainSegments.length > 0) {
                terrainBreakdown = leg.terrainSegments
                    .filter(seg => seg && typeof seg.dist === 'number' && seg.dist > 0)
                    .map(seg => `${seg.dist.toFixed(1)}km ${seg.terrain}`)
                    .join(' · ');
            } else if (relevantSegments && relevantSegments.length > 0) {
                 const terrainSummary: { [key in Terrain]?: number } = {};
                 const segmentLengthKm = SEGMENT_LENGTH_M / 1000;
                 relevantSegments.forEach(segment => {
                     if (segment && segment.terrain) {
                         terrainSummary[segment.terrain] = (terrainSummary[segment.terrain] || 0) + segmentLengthKm;
                     }
                 });
                 terrainBreakdown = Object.entries(terrainSummary)
                     .sort(([, distA = 0], [, distB = 0]) => distB - distA)
                     .map(([terrain, distKm = 0]) => `${distKm.toFixed(1)}km ${terrain}`)
                     .join(' · ');
            }

            return {
                leg,
                legRunningTime,
                carbsNeeded,
                waterNeeded,
                adjustedPace,
                segments: relevantSegments,
                startKm,
                endKm,
                cumulativeDist,
                arrivalTime,
                departureTime,
                totalStopTimeMins,
                markers: legMarkers,
                terrainSegments: leg.terrainSegments,
                terrainBreakdown,
            };
        });
    }, [isLegMode, computation, effectiveLegs, startDate, startTime, carbsPerHour, waterPerHour, markers]);
    
    const fillLegsFromGpx = useCallback(() => {
        if (!gpxData || legs.length === 0) return;
    
        let cumulativeDistM = 0;
        let lastPointIndex = 0;

        const updatedLegs = legs.map(leg => {
            const legStartDistM = cumulativeDistM;
            const legEndDistM = cumulativeDistM + (leg.dist * 1000);
            let legGain = 0;
            let legLoss = 0;

            if (gpxData.pts.length < 2) return { ...leg, gain: 0, loss: 0 };
            
            let lastEle = getElevationAtDistanceM(legStartDistM, gpxData.pts);
            
            let i = lastPointIndex;
            while(i < gpxData.pts.length && gpxData.pts[i].cum < legEndDistM) {
                if (gpxData.pts[i].cum > legStartDistM) {
                    const eleDiff = gpxData.pts[i].ele - lastEle;
                    if (eleDiff > 0) {
                        legGain += eleDiff;
                    } else {
                        legLoss -= eleDiff;
                    }
                    lastEle = gpxData.pts[i].ele;
                }
                i++;
            }
            
            const endEle = getElevationAtDistanceM(legEndDistM, gpxData.pts);
            const finalEleDiff = endEle - lastEle;
             if (finalEleDiff > 0) {
                legGain += finalEleDiff;
            } else {
                legLoss -= finalEleDiff;
            }

            lastPointIndex = i > 0 ? i - 1 : 0;
            
            cumulativeDistM = legEndDistM;
    
            return { ...leg, gain: Math.round(legGain), loss: Math.round(legLoss) };
        });
    
        setLegs(updatedLegs);
    }, [gpxData, legs]);

    const handleSaveTuning = (legId: string, segments: TerrainSegment[]) => {
        setLegs(currentLegs => currentLegs.map(l => l.id === legId ? { ...l, terrainSegments: segments } : l));
        setTuningLeg(null);
    };

    const handleSaveAidStationTemplates = (checklist: string[], feedback: string[]) => {
        setChecklistItems(checklist);
        setFeedbackItems(feedback);
    };

    const focusOnLeg = (legId: string) => {
        setFocusedLegId(legId);
        const element = document.getElementById(`leg-plan-${legId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setFocusedLegId(null), 2000);
        }
    };
    
    const handleAutoFillNotes = (targets: { runner: boolean; crew: boolean; pacer: boolean; }) => {
        if (!legPlan) return;
        setAutoFilledTargets(targets);

        const totalDist = legPlan[legPlan.length - 1].cumulativeDist;
        let isPacerActive = false;

        const updatedLegs = legPlan.map((info, legIndex) => {
            const leg = { ...info.leg };
            
            if (leg.pacerIn) isPacerActive = true;
            const isPacerOnThisLeg = isPacerActive;
            
            const isNightLeg = info.segments.some(seg => {
                const time = new Date(new Date(`${startDate}T${startTime}`).getTime() + (seg.cumulativeTime || 0) * 1000);
                return isTimeNight(time, nightFrom, nightTo);
            });
            
            const legArrivalTime = info.arrivalTime;
            const isApproachingNight = sunTimes.sunset && !isNightLeg && (sunTimes.sunset.getTime() - legArrivalTime.getTime()) < 3 * 3600 * 1000;


            // Runner Notes
            if (targets.runner) {
                let weightedNotePool: { note: string; weight: number }[] = [];
    
                const context = {
                    distPercentageStart: (info.startKm / totalDist) * 100,
                    isNightLeg,
                    isHotLeg: tempC > 22 && legArrivalTime.getHours() >= 11 && legArrivalTime.getHours() <= 16,
                    segments: info.segments,
                    leg: info.leg,
                    isAfterSleep: legIndex > 0 && (legPlan[legIndex - 1].leg.sleepMinutes ?? 0) > 0,
                    isApproachingNight,
                    arrivalTime: info.arrivalTime
                };
    
                if (selectedNoteModules.includes('pacingPro')) {
                    if (context.distPercentageStart <= 25) {
                        weightedNotePool.push({ note: "This should feel 'too easy'.", weight: 3 });
                        weightedNotePool.push({ note: "Bank patience, not time.", weight: 3 });
                    }
                    if (context.distPercentageStart <= 30 && context.segments.some(s => s.grade < -8)) {
                        weightedNotePool.push({ note: "Easy on the descents. Save the quads.", weight: 3 });
                    }
                    if (context.segments.some(s => s.grade > 10)) {
                        weightedNotePool.push({ note: "Heart rate is your governor. Keep it in the all-day zone.", weight: 2 });
                    }
                    if (context.isHotLeg) {
                        weightedNotePool.push({ note: "The heat will dictate the pace. Listen to it.", weight: 2 });
                    }
                }
    
                if (selectedNoteModules.includes('fuelingGuardian')) {
                    if (context.distPercentageStart > 25 && context.distPercentageStart <= 75) {
                        weightedNotePool.push({ note: "250 calories per hour. Are you on schedule?", weight: 2 });
                    }
                    if (context.isNightLeg) {
                        weightedNotePool.push({ note: "Your brain needs glucose to make good decisions. Feed it.", weight: 3 });
                        weightedNotePool.push({ note: "Eat before you're hungry, drink before you're thirsty.", weight: 3 });
                    }
                    if (context.isHotLeg) {
                        weightedNotePool.push({ note: "Salt is not optional. Take an electrolyte cap now.", weight: 3 });
                    }
                    if (context.isAfterSleep) {
                        weightedNotePool.push({ note: "Wake up and fuel up. Restock the engine.", weight: 3 });
                    }
                }
    
                if (selectedNoteModules.includes('painResilienceCoach')) {
                    if (context.distPercentageStart > 60 && context.distPercentageStart <= 90) {
                         weightedNotePool.push({ note: "This is what you came for.", weight: 3 });
                         weightedNotePool.push({ note: "This is hard, and you do hard things.", weight: 2 });
                    }
                    if (context.isNightLeg && context.arrivalTime.getHours() >= 2 && context.arrivalTime.getHours() < 5) {
                        weightedNotePool.push({ note: "It never always gets worse.", weight: 3 });
                    }
                    if (context.distPercentageStart > 50 && context.segments.some(s => s.grade > 10)) {
                         weightedNotePool.push({ note: "Reframe it: This pain is progress.", weight: 2 });
                    }
                }
    
                if (selectedNoteModules.includes('trailTechnician')) {
                    if (context.segments.some(s => s.grade > 15)) {
                        weightedNotePool.push({ note: "Hike with purpose. Hands on knees, drive up.", weight: 2 });
                    }
                    if (context.segments.some(s => s.grade < -10)) {
                        weightedNotePool.push({ note: "Quick feet, light steps.", weight: 3 });
                        weightedNotePool.push({ note: "Scan ahead, not at your feet. Let your brain map the path.", weight: 2 });
                    }
                    const isTechnical = context.leg.terrain === 'technical' || (context.leg.terrainSegments && context.leg.terrainSegments.some(ts => ts.terrain === 'technical'));
                    if (isTechnical) {
                         weightedNotePool.push({ note: "Flow, don't fight the trail.", weight: 2 });
                         if (context.isNightLeg) {
                             weightedNotePool.push({ note: "Lift your feet. Don't shuffle.", weight: 3 });
                         }
                    }
                }
                
                if (selectedNoteModules.includes('focusMaster')) {
                     if (context.distPercentageStart > 15 && context.distPercentageStart <= 60) {
                         weightedNotePool.push({ note: "Run the mile you're in.", weight: 2 });
                     }
                     if (context.isNightLeg) {
                         weightedNotePool.push({ note: "Plan your next aid station in detail.", weight: 2 });
                     }
                     if ((context.leg.sleepMinutes ?? 0) > 0) {
                         weightedNotePool.push({ note: "Just make it to that next tree/rock/bend.", weight: 3 });
                     }
                }
                
                if (selectedNoteModules.includes('aidStationNinja')) {
                    weightedNotePool.push({ note: "What are your 3 must-do tasks here?", weight: 2 });
                    if (context.isHotLeg) {
                         weightedNotePool.push({ note: "Hot day? Ice in everything: hat, bandana, sleeves.", weight: 3 });
                    }
                    if (context.isApproachingNight) {
                         weightedNotePool.push({ note: "Night coming? Check your headlamp and grab your backup NOW.", weight: 3 });
                    }
                }
    
                if (context.distPercentageStart <= 25) weightedNotePool.push({ note: getRandomNote(MENTAL_NOTES.start), weight: 1 });
                else if (context.distPercentageStart <= 75) weightedNotePool.push({ note: getRandomNote(MENTAL_NOTES.longGrind), weight: 1 });
                else weightedNotePool.push({ note: getRandomNote(MENTAL_NOTES.finalPush), weight: 1 });
    
                const pickedNotes: string[] = [];
                weightedNotePool.sort((a, b) => b.weight - a.weight);
                for (const item of weightedNotePool) {
                    if (pickedNotes.length >= 3) break;
                    if (!pickedNotes.includes(item.note)) {
                        pickedNotes.push(item.note);
                    }
                }
                if (pickedNotes.length < 3) {
                     pickedNotes.push(getRandomNote(Object.values(MENTAL_NOTES).flat(), pickedNotes));
                }
    
                leg.runnerNotes = pickedNotes.slice(0, 3).join('\n');
            }

            // Crew Notes
            if (targets.crew) {
                let contextPool: SupportNote[] = [];

                const isHot = tempC > 24;
                const isCold = tempC < 7;
                const distPct = (info.startKm / totalDist) * 100;
                const netLossPerKm = info.leg.dist > 0 ? (info.leg.loss - info.leg.gain) / info.leg.dist : 0;

                // Pacing Pro Logic
                if (distPct <= 30) {
                    contextPool.push(...COMPREHENSIVE_CREW_NOTES.pacingPro);
                }
                if (distPct <= 40 && netLossPerKm > 38) { // ~200ft/mile descent
                    const downhillNote = COMPREHENSIVE_CREW_NOTES.pacingPro.find(n => n.do.includes('downhill'));
                    if (downhillNote) contextPool.unshift(downhillNote); // Prioritize
                }

                // Fueling Guardian Logic
                if (distPct >= 40 || isNightLeg || isHot || isCold) {
                    contextPool.push(...COMPREHENSIVE_CREW_NOTES.fuelingGuardian);
                }
                
                // Pain & Resilience Coach Logic
                if (distPct >= 60 || (isNightLeg && info.arrivalTime.getHours() >= 2 && info.arrivalTime.getHours() < 5)) {
                    contextPool.push(...COMPREHENSIVE_CREW_NOTES.painResilienceCoach);
                }
                
                let notePool: SupportNote[] = [...new Set(contextPool)]; // Remove duplicates from context
                let pickedNotes: SupportNote[] = [];
            
                // Aim for up to 2 context-specific notes
                const numContextNotes = notePool.length > 0 ? Math.min(notePool.length, 2) : 0;
                
                for (let i = 0; i < numContextNotes; i++) {
                    const note = getRandomSupportNote(notePool, pickedNotes.map(n => n.do));
                    if (note) pickedNotes.push(note);
                }
            
                // Fill up to 2-3 total notes with general advice
                const numGeneralNotes = Math.max(1, 2 - pickedNotes.length);
                for (let i = 0; i < numGeneralNotes; i++) {
                    const note = getRandomSupportNote(COMPREHENSIVE_CREW_NOTES.general, pickedNotes.map(n => n.do));
                    if (note) pickedNotes.push(note);
                }
                
                // If for some reason we still have no notes, grab one general.
                if(pickedNotes.length === 0) {
                    const note = getRandomSupportNote(COMPREHENSIVE_CREW_NOTES.general, []);
                    if (note) pickedNotes.push(note);
                }
            
                leg.notes = pickedNotes
                    .map(note => `DO: ${note.do}\nSAY: ${note.say}`)
                    .join('\n\n');
            }

            // Pacer Notes
            if (targets.pacer) {
                if (isPacerOnThisLeg) {
                    let notePool: SupportNote[] = [];
                    const distPct = (info.startKm / totalDist) * 100;
            
                    // M1: Pacing Pro
                    if (distPct >= 40 && distPct <= 70) notePool.push(...PACER_NOTE_MODULES.pacingPro);
                    if (info.segments.some(s => s.grade < -3)) notePool.push(...PACER_NOTE_MODULES.pacingPro.filter(n => n.do.toLowerCase().includes("rhythm")));
                    if (info.segments.some(s => s.grade > 5)) notePool.push(...PACER_NOTE_MODULES.pacingPro.filter(n => n.do.toLowerCase().includes("heart rate")));

                    // M2: Fueling Guardian
                    if (isNightLeg) notePool.push(...PACER_NOTE_MODULES.fuelingGuardian);
                    if (tempC > 24) notePool.push(...PACER_NOTE_MODULES.fuelingGuardian.filter(n => n.say.toLowerCase().includes("salt") || n.say.toLowerCase().includes("fluid")));
                    if (distPct >= 50) notePool.push(...PACER_NOTE_MODULES.fuelingGuardian);
            
                    // M3: Pain & Resilience
                    if (distPct >= 65) notePool.push(...PACER_NOTE_MODULES.painResilienceCoach);
                    if (isNightLeg && info.arrivalTime.getHours() >= 2 && info.arrivalTime.getHours() < 5) notePool.push(...PACER_NOTE_MODULES.painResilienceCoach);
                    if (distPct > 60 && info.segments.some(s => s.grade > 10)) notePool.push(...PACER_NOTE_MODULES.painResilienceCoach.filter(n => n.say.toLowerCase().includes("hill") || n.say.toLowerCase().includes("earning")));
            
                    // M4: Trail Technician
                    const isTechnical = info.leg.terrain === 'technical' || (info.leg.terrainSegments && info.leg.terrainSegments.some(ts => ts.terrain === 'technical'));
                    if (info.segments.some(s => s.grade > 15)) notePool.push(...PACER_NOTE_MODULES.trailTechnician.filter(n => n.do.toLowerCase().includes('uphill') || n.say.toLowerCase().includes('hike')));
                    if (info.segments.some(s => s.grade < -10) || isTechnical) notePool.push(...PACER_NOTE_MODULES.trailTechnician.filter(n => n.do.toLowerCase().includes('downhill') || n.do.toLowerCase().includes('technical') || n.say.toLowerCase().includes('rocks')));
                    if (isNightLeg && isTechnical) notePool.push(...PACER_NOTE_MODULES.trailTechnician.filter(n => n.say.toLowerCase().includes('light bubble') || n.say.toLowerCase().includes('lift your feet')));
            
                    // M5: Focus Master
                    const avgNetGrade = info.leg.dist > 0 ? (info.leg.gain - info.leg.loss) / (info.leg.dist * 10) : 0;
                    const isMonotonous = !isTechnical && Math.abs(avgNetGrade) < 3;
                    if ((distPct >= 40 && distPct <= 80 && isMonotonous) || (isNightLeg && isMonotonous)) {
                        notePool.push(...PACER_NOTE_MODULES.focusMaster);
                    }
            
                    // M6: Aid Station Ninja
                    notePool.push(...PACER_NOTE_MODULES.aidStationNinja);
                    if (isNightLeg) {
                        notePool.push(...PACER_NOTE_MODULES.aidStationNinja.filter(n => n.do.toLowerCase().includes('headlamp')));
                    }
                    
                    let uniqueContextNotes = [...new Set(notePool)];
                    let pickedNotes: SupportNote[] = [];
            
                    const numNotesToPick = 3;
                    for (let i = 0; i < numNotesToPick; i++) {
                        const pool = uniqueContextNotes.length > 0 ? uniqueContextNotes : GENERAL_PACER_NOTES;
                        const note = getRandomSupportNote(pool, pickedNotes.map(n => n.do));
                        if (note) {
                            pickedNotes.push(note);
                            uniqueContextNotes = uniqueContextNotes.filter(n => n.do !== note.do);
                        }
                    }
                    
                    leg.pacerNotes = pickedNotes
                        .map(note => `DO: ${note.do}\nSAY: ${note.say}`)
                        .join('\n\n');
                } else {
                    leg.pacerNotes = '';
                }
            }
            
            if (leg.pacerOut) isPacerActive = false;
            return leg;
        });
        
        setLegs(updatedLegs);
    };

    const nightPeriods = useMemo((): NightPeriod[] => {
        if (!computation) return [];
        const periods: NightPeriod[] = [];
        let inNight = false;
        let startKm = 0;
        const raceStartDate = new Date(`${startDate}T${startTime}`);
        if(isNaN(raceStartDate.getTime())) return [];

        computation.chartData.forEach(p => {
            const time = new Date(raceStartDate.getTime() + (p.cumulativeTime || 0) * 1000);
            const isCurrentlyNight = isTimeNight(time, nightFrom, nightTo);
            if (isCurrentlyNight && !inNight) {
                inNight = true;
                startKm = p.km;
            } else if (!isCurrentlyNight && inNight) {
                inNight = false;
                periods.push({ x1: startKm, x2: p.km });
            }
        });
        if (inNight) {
            periods.push({ x1: startKm, x2: computation.chartData[computation.chartData.length - 1].km });
        }
        return periods;
    }, [computation, startDate, startTime, nightFrom, nightTo]);
    
    const raceEvents = useMemo((): RaceEvent[] => {
        if (!computation || !sunTimes.sunrise || !sunTimes.sunset) return [];
        const events: RaceEvent[] = [];
        const raceStartDate = new Date(`${startDate}T${startTime}`);
        if(isNaN(raceStartDate.getTime())) return [];
        const sunsetHour = sunTimes.sunset.getHours();
        const sunsetMin = sunTimes.sunset.getMinutes();
        const sunriseHour = sunTimes.sunrise.getHours();
        const sunriseMin = sunTimes.sunrise.getMinutes();

        let day = 0;
        while (true) {
            const currentSunset = new Date(raceStartDate);
            currentSunset.setDate(currentSunset.getDate() + day);
            currentSunset.setHours(sunsetHour, sunsetMin, 0, 0);

            const currentSunrise = new Date(raceStartDate);
            currentSunrise.setDate(currentSunrise.getDate() + day + 1); // Sunrise is next day
            currentSunrise.setHours(sunriseHour, sunriseMin, 0, 0);

            const sunsetPoint = computation.chartData.find(p => (raceStartDate.getTime() + (p.cumulativeTime || 0) * 1000) >= currentSunset.getTime());
            if (sunsetPoint) events.push({ km: sunsetPoint.km, type: 'sunset' });

            const sunrisePoint = computation.chartData.find(p => (raceStartDate.getTime() + (p.cumulativeTime || 0) * 1000) >= currentSunrise.getTime());
            if (sunrisePoint) events.push({ km: sunrisePoint.km, type: 'sunrise' });

            if (!sunsetPoint && !sunrisePoint) break;
            if ((raceStartDate.getTime() + computation.finalTime * 1000) < currentSunrise.getTime()) break;
            
            day++;
        }
        return events;
    }, [computation, sunTimes, startDate, startTime]);

    const handleDownloadManual = () => {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 30;
        const maxW = pageW - margin * 2;
        let y = margin;
    
        const checkPageBreak = (spaceNeeded = 20) => {
            if (y + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
                doc.setFontSize(8).setTextColor(150, 150, 150);
                doc.text(`Page ${doc.getNumberOfPages()}`, pageW - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
                doc.text('Consistent Running Ultra Planner Manual', margin, doc.internal.pageSize.getHeight() - 15);
                y = margin;
            }
        };
    
        const addText = (text: string, size: number, style: 'normal' | 'bold' | 'italic', options?: any, spaceAfter = 5) => {
            checkPageBreak(size * 2);
            doc.setFontSize(size).setFont('helvetica', style);
            const splitText = doc.splitTextToSize(text, maxW);
            doc.text(splitText, margin, y, options);
            y += doc.getTextDimensions(splitText).h + spaceAfter;
        };
    
        const addTitle = (text: string) => { addText(text, 22, 'bold', { align: 'center' }, 20); };
        const addHeading = (text: string) => { checkPageBreak(40); addText(text, 16, 'bold', {}, 10); };
        const addSubHeading = (text: string) => { checkPageBreak(30); addText(text, 12, 'bold', {}, 5); };
        const addListItem = (text: string, indent = 0) => {
            const bullet = '•  ';
            const fullText = bullet + text;
            const parts = doc.splitTextToSize(fullText, maxW - (15 * (indent + 1)));
            checkPageBreak(doc.getTextDimensions(parts).h + 5);
            doc.setFontSize(10).setFont('helvetica', 'normal');
            doc.text(parts, margin + (15 * indent), y);
            y += doc.getTextDimensions(parts).h + 3;
        };
    
        // --- Cover Page ---
        addTitle("Consistent Running Ultra Planner\nUser Manual");
        y += 20;
        addText("Your comprehensive guide to planning, strategizing, and executing your best ultramarathon performance.", 12, 'italic', { align: 'center' });
    
        // --- Section 1: Core Concepts ---
        doc.addPage(); 
        y = margin;
        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageW - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
        doc.text('Consistent Running Ultra Planner Manual', margin, doc.internal.pageSize.getHeight() - 15);
        
        addHeading("1. Introduction: How The Planner Works");
        addText("The planner simulates your race by starting with a baseline of your fitness and then applying various real-world challenges (modifiers) to predict your pace and finish time. It's built on established sports science principles to give you a realistic and actionable plan.", 10, 'normal');
        addListItem("Baseline Fitness: We start with your 'Flat Time'—a theoretical best-case performance for your race distance on a flat, smooth surface, calculated from a recent race result.");
        addListItem("Real-World Modifiers: We then adjust this baseline for every segment of the race, accounting for elevation, terrain, fatigue, weather, night running, and planned stops.");

        addHeading("2. Quick Start Guide");
        addListItem("Enter Race Basics: Provide a recent race result (e.g., a marathon time) to establish your baseline fitness.");
        addListItem("Define the Course: Import a GPX file for the highest accuracy, then use 'By Legs' mode to set up your aid stations.");
        addListItem("Tune Your Runner Profile: Select a preset (e.g., 'Mountain') and fine-tune it to match your unique strengths and weaknesses.");
        addListItem("Automate & Analyze: Use 'Auto-fill Notes' for strategic advice, then analyze the pace chart and time breakdown.");
        addListItem("Print & Go: Generate a full PDF for your crew and handy, pocket-sized cards for yourself and your pacers.");

        // --- Section 3: Detailed Setup ---
        addHeading("3. Detailed Setup: Race & Fitness");
        addSubHeading("3.1 Model Type");
        addListItem("'Predict Time': The standard mode. Forecasts a finish time from a past result.");
        addListItem("'Plan for Goal': Works backwards from a target finish time to show the required fitness level (your 'flat time').");
        
        addSubHeading("3.2 Reference Performance & Flat Time");
        addText("This is the most critical input. The planner uses the Riegel Endurance Model (T2 = T1 * (D2/D1)^1.06) to convert your past result into an equivalent 'flat time' for your ultra distance, accounting for natural performance drop-off.", 10, 'normal');
        
        addSubHeading("3.3 Sleep Planning & Fatigue Reset");
        addText("Enabling 'Plan for sleep stops?' allows you to add sleep time at aid stations. This applies a 'fatigue reset' bonus to the model, differentiating between metabolic and muscular recovery:", 10, 'normal');
        addListItem("Metabolic Recovery: The first 20-30 minutes provide the most significant benefit for mental and cardio revival, with diminishing returns after. Governed by the getFatigueReset() function.", 1);
        addListItem("Muscular Recovery: Deep muscular damage requires longer rest. The model (getMuscularFatigueReset()) applies a smaller, slower reset for this, reflecting that short naps won't fully repair trashed quads.", 1);
        addListItem("Example: A 30-minute nap provides a 20% metabolic fatigue reset but only a 5% muscular reset.", 1);

        doc.addPage(); y = margin;
        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageW - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
        doc.text('Consistent Running Ultra Planner Manual', margin, doc.internal.pageSize.getHeight() - 15);
        y=margin;

        addHeading("4. Detailed Setup: Course Details");
        addSubHeading("4.1 Simple vs. By Legs Mode");
        addText("'By Legs' mode is essential for detailed planning. It allows you to define segments between aid stations, plan stop times, and generate printable guides.", 10, 'normal');
        
        addSubHeading("4.2 Fine-Tuning Terrain");
        addText("If a leg has multiple terrain types, click 'Fine Tune Terrain'. You can break it into sub-segments (e.g., 5km technical, 8km smooth). These colors will appear on the mini-map in the main race plan, giving your crew a quick visual reference.", 10, 'normal');

        addHeading("5. The Runner Profile (The Secret Sauce!)");
        addText("Accessed via the 'Runner Profile' button, this is where you customize the model. Key settings include:", 10, 'normal');
        addListItem("Fatigue Model: 'Base Metabolic Fade' is your general endurance. 'Muscular Resilience' is critical – it models how well your quads handle downhill pounding. A lower value here means you're more resilient.");
        addListItem("Hiking Model: Enabling this is highly recommended! The model will strategically 'power-hike' steep climbs, which conserves energy and reduces muscular fatigue. 'VAM' is your hiking climbing speed in vertical meters per hour.");

        addHeading("6. Strategic Automation");
        addSubHeading("6.1 Mental Strategy & Auto-Fill Notes");
        addText("This feature automates your mental game. First, click 'Mental Strategy' and select 'helpers' that match your weaknesses (e.g., 'The Fueling Guardian'). Then, click 'Auto-fill Notes'. The planner generates context-aware notes based on:", 10, 'normal');
        addListItem("Race Position: Early-race notes focus on conservative pacing; late-race notes are about finishing strong.");
        addListItem("Time of Day & Weather: The plan analyzes your pace against sunrise/sunset and temperature. Night legs get safety notes, while legs in the heat of the day get notes about cooling strategies.");
        addListItem("Your Chosen Strategy: It injects advice from your selected 'helper' modules (e.g., fueling reminders).");


        doc.addPage(); y = margin;
        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageW - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
        doc.text('Consistent Running Ultra Planner Manual', margin, doc.internal.pageSize.getHeight() - 15);
        y=margin;

        addHeading("7. The Output: Using Your Plan");
        addSubHeading("7.1 The Full Race Plan (For Crew)");
        addText("The main plan is a printable timeline for your crew. Here's how to read it:", 10, 'normal');
        addListItem("Header: Shows leg number and start/end points.");
        addListItem("Mini-Map: A visual profile of the leg's elevation. The colors reflect the terrain you've set (or fine-tuned).");
        addListItem("Key Stats: Total distance, gain/loss, and the model's predicted average pace for that leg.");
        addListItem("Aid Station Box: Shows predicted arrival/departure times, total stop time, and calculated nutrition needs (carbs/water) for the leg you just completed.");
        addListItem("Nutrition: Based on your hourly targets and the predicted running time for the previous leg.");
        addListItem("Crew Notes & Checklists: Specific instructions you've written or that were auto-filled, plus your customized checklist.", 1);

        addSubHeading("7.2 Customizing Checklists & Feedback");
        addText("Click 'Edit Aid Station Templates' to customize the default checklist and feedback items that appear on your printed plan. This lets you create a standardized process for every aid station.", 10, 'normal');

        addSubHeading("7.3 Runner & Pacer Cards");
        addText("These are small, foldable cards designed to be carried with you. They show the profile, key markers, and your personal or pacer-specific notes for one leg at a time. Perfect for quick reference on the trail.", 10, 'normal');
    
        doc.save("Ultra_Planner_Manual.pdf");
    };

    return (
        <div className="min-h-screen bg-background text-text font-sans flex flex-col h-screen">
            <header className="w-full bg-panel/80 backdrop-blur-sm p-4 lg:px-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Logo />
                    <h1 className="text-2xl font-bold tracking-tight">Ultra Planner</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsWelcomeModalOpen(true)}>App Guide</Button>
                    <Button onClick={handleDownloadManual}>Download Manual</Button>
                    <Button onClick={() => setIsRunnerCardsModalOpen(true)} disabled={!isLegMode}>Print Cards</Button>
                </div>
            </header>

            <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
                <aside className="w-full lg:w-[450px] lg:max-w-[450px] bg-panel/80 backdrop-blur-sm p-4 lg:p-6 space-y-6 overflow-y-auto border-r border-slate-700/50">
                    <Controls
                        raceName={raceName} setRaceName={setRaceName}
                        flatTimeStr={flatTimeStr}
                        distanceKm={distanceKm} setDistanceKm={setDistanceKm}
                        startDate={startDate} setStartDate={setStartDate}
                        startTime={startTime} setStartTime={setStartTime}
                        nightFrom={nightFrom} setNightFrom={setNightFrom}
                        nightTo={nightTo} setNightTo={setNightTo}
                        tempC={tempC} setTempC={setTempC}
                        nightTempDrop={nightTempDrop} setNightTempDrop={setNightTempDrop}
                        humPct={humPct} setHumPct={setHumPct}
                        sun={sun} setSun={setSun}
                        gpxData={gpxData} setGpxData={setGpxData}
                        gpxFileName={gpxFileName} setGpxFileName={setGpxFileName}
                        onGpxLoad={parseGPX}
                        legs={legs}
                        isLegMode={isLegMode}
                        fillLegsFromGpx={fillLegsFromGpx}
                        openProfileModal={() => setIsProfileModalOpen(true)}
                        openHowModal={() => setIsWhyModalOpen(true)}
                        openSleepInfoModal={() => setIsSleepInfoModalOpen(true)}
                        openNightInfoModal={() => setIsNightInfoModalOpen(true)}
                        openRiegelInfoModal={() => setIsRiegelInfoModalOpen(true)}
                        carbsPerHour={carbsPerHour} setCarbsPerHour={setCarbsPerHour}
                        waterPerHour={waterPerHour} setWaterPerHour={setWaterPerHour}
                        sunTimesAvailable={!!sunTimes.sunrise}
                        modelType={modelType} setModelType={setModelType}
                        goalTimeStr={goalTimeStr} setGoalTimeStr={setGoalTimeStr}
                        computationFlatTime={computation?.flatTime}
                        isSleepPlanned={isSleepPlanned} setIsSleepPlanned={setIsSleepPlanned}
                        referenceDistance={referenceDistance} setReferenceDistance={setReferenceDistance}
                        referenceTimeStr={referenceTimeStr} setReferenceTimeStr={setReferenceTimeStr}
                        showChecklist={showChecklist} setShowChecklist={setShowChecklist}
                        showFeedback={showFeedback} setShowFeedback={setShowFeedback}
                        isGreyscale={isGreyscale} setIsGreyscale={setIsGreyscale}
                    />
                     <div className="space-y-6">
                        <LegsEditor
                            legs={legs} setLegs={setLegs}
                            isLegMode={isLegMode} setIsLegMode={setIsLegMode}
                            simpleGain={simpleGain} setSimpleGain={setSimpleGain}
                            simpleLoss={simpleLoss} setSimpleLoss={setSimpleLoss}
                            simpleTerrain={simpleTerrain} setSimpleTerrain={setSimpleTerrain}
                            distanceKm={distanceKm}
                            isSleepPlanned={isSleepPlanned}
                            openLegsInfoModal={() => setIsLegsInfoModalOpen(true)}
                            openAutoNotesInfoModal={() => setIsAutoNotesInfoModalOpen(true)}
                            openFromDistInfoModal={() => setIsFromDistInfoModalOpen(true)}
                            openAidStationModal={() => setIsAidStationModalOpen(true)}
                            setTuningLeg={setTuningLeg}
                            onFocusLeg={focusOnLeg}
                            onAutoFillNotes={handleAutoFillNotes}
                            onOpenMentalStrategy={() => setIsMentalStrategyModalOpen(true)}
                        />
                         {isLegMode && <MarkersEditor markers={markers} setMarkers={setMarkers} />}
                     </div>
                </aside>
                <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
                    <Visuals
                        computation={computation}
                        smoothM={smoothM} setSmoothM={setSmoothM}
                        legs={legs} isLegMode={isLegMode}
                        nightPeriods={nightPeriods}
                        raceEvents={raceEvents}
                        startDate={startDate} startTime={startTime}
                        nightFrom={nightFrom} nightTo={nightTo}
                        isChartExpanded={isChartExpanded}
                        setIsChartExpanded={setIsChartExpanded}
                        openTimeBreakdownExplanationModal={() => setIsTimeBreakdownExplanationModalOpen(true)}
                    />
                    {isLegMode && legPlan && <div ref={planRef}><RacePlan
                        raceName={raceName}
                        legPlan={legPlan}
                        computation={computation}
                        startDate={startDate}
                        startTime={startTime}
                        focusedLegId={focusedLegId}
                        raceEvents={raceEvents}
                        nightPeriods={nightPeriods}
                        chartData={computation?.chartData}
                        checklistItems={checklistItems}
                        feedbackItems={feedbackItems}
                        showChecklist={showChecklist}
                        showFeedback={showFeedback}
                        onPrint={() => { /* Implement print logic if needed */ }}
                    /></div>}
                </main>
            </div>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={profile}
                setProfile={setProfile}
                setPreset={(p) => setProfile(presets[p])}
                openWhyModal={() => setIsWhyModalOpen(true)}
                openHikeInfoModal={() => setIsHikeInfoModalOpen(true)}
                finalTime={computation?.finalTime}
            />
            <InfoModal isOpen={isWhyModalOpen} onClose={() => setIsWhyModalOpen(false)} title="Why These Numbers?">
                <table className="w-full text-sm text-left">
                    <thead><tr className="border-b border-slate-600"><th className="pb-2">Parameter</th><th className="pb-2">Default</th><th className="pb-2">Description</th></tr></thead>
                    <tbody>{whyRows.map(([param, val, desc]) => (<tr key={param} className="border-b border-slate-700/50"><td className="py-2 pr-4 font-semibold">{param}</td><td className="py-2 pr-4 font-mono">{val}</td><td className="py-2 text-slate-400">{desc}</td></tr>))}</tbody>
                </table>
            </InfoModal>
            <InfoModal isOpen={isRiegelInfoModalOpen} onClose={() => setIsRiegelInfoModalOpen(false)} title="Time Conversion Model">
                <div className="prose prose-invert max-w-none prose-p:text-slate-300">
                    <p>To predict your ultramarathon time from a shorter race (like a marathon), we use the well-regarded <strong>Riegel endurance model</strong>.</p>
                    <p>The formula is: <code>T2 = T1 * (D2 / D1) ^ 1.06</code></p>
                    <ul className="text-sm">
                        <li><strong>T1</strong> is your time for the known distance (<strong>D1</strong>).</li>
                        <li><strong>T2</strong> is the predicted time for the target distance (<strong>D2</strong>).</li>
                        <li>The <strong>^ 1.06</strong> exponent is the key; it's a research-backed factor that accounts for how your pace naturally slows over longer distances due to fatigue.</li>
                    </ul>
                    <p>This gives us a "flat time" - your theoretical best-case time on a perfectly flat course, which becomes the baseline for all other calculations.</p>
                </div>
            </InfoModal>
             <InfoModal isOpen={isLegsInfoModalOpen} onClose={() => setIsLegsInfoModalOpen(false)} title="Simple vs. By Legs Mode">
                 <div className="prose prose-invert max-w-none prose-p:text-slate-300">
                     <p>You have two ways to define your course:</p>
                     <h4>Simple Mode</h4>
                     <p>This is for a quick, high-level estimate. The entire race is treated as one single segment. You input the total distance, gain, loss, and an overall terrain type. It's fast, but not as accurate as "By Legs" mode.</p>
                     <h4>By Legs Mode</h4>
                     <p>This is the recommended mode for detailed race planning. It allows you to break the course into segments (legs) between aid stations. For each leg, you can specify:</p>
                     <ul>
                         <li>Distance, gain, and loss</li>
                         <li>Terrain type</li>
                         <li>Planned stop time at the aid station</li>
                         <li>Crew access, drop bags, and pacer swaps</li>
                         <li>Custom notes for yourself, your crew, and your pacer</li>
                     </ul>
                     <p>Using "By Legs" mode is essential for generating printable race plans and runner/pacer cards.</p>
                 </div>
            </InfoModal>
            <InfoModal isOpen={isFromDistInfoModalOpen} onClose={() => setIsFromDistInfoModalOpen(false)} title="Build Legs From Distances">
                <p>This is a quick way to create your legs. Find the list of distances between aid stations on the official race website, and paste them here, separated by commas, spaces, or new lines. Example: <code>12.6, 13.3, 11.5, 16.4</code>. The tool will automatically create a leg for each distance.</p>
            </InfoModal>
             <InfoModal isOpen={isAutoNotesInfoModalOpen} onClose={() => setIsAutoNotesInfoModalOpen(false)} title="Auto-fill Notes Logic">
                 <p>This feature intelligently generates helpful notes based on your race plan. It considers:</p>
                 <ul className="list-disc list-inside space-y-1 text-sm">
                     <li><strong>Race Position:</strong> Early-race notes focus on conservative pacing, while late-race notes are about finishing strong.</li>
                     <li><strong>Time of Day & Weather:</strong> It analyzes your pace against sunrise/sunset and the day's temperature to provide timely notes about headlamps or cooling strategies.</li>
                     <li><strong>Mental Strategy:</strong> The system will inject notes from the "helper" modules you selected in the Mental Strategy modal, targeting your specific weaknesses.</li>
                 </ul>
            </InfoModal>
            <InfoModal isOpen={isSleepInfoModalOpen} onClose={() => setIsSleepInfoModalOpen(false)} title="Sleep Planning & Fatigue Reset">
                 <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100">
                    <p>Enabling 'Plan for sleep stops?' allows you to add sleep time at aid stations. This applies a 'fatigue reset' bonus to the model, differentiating between metabolic and muscular recovery:</p>
                    <ul className="!my-4 space-y-2">
                        <li>
                            <strong>Metabolic Recovery:</strong> The first 20-30 minutes provide the most significant benefit for mental and cardio revival, with diminishing returns after. Governed by the <code>getFatigueReset()</code> function.
                        </li>
                        <li>
                            <strong>Muscular Recovery:</strong> Deep muscular damage requires longer rest. The model (<code>getMuscularFatigueReset()</code>) applies a smaller, slower reset for this, reflecting that short naps won't fully repair trashed quads.
                        </li>
                        <li>
                            <strong>Example:</strong> A 30-minute nap provides a 20% metabolic fatigue reset but only a 5% muscular reset.
                        </li>
                    </ul>
                 </div>
            </InfoModal>
            <InfoModal isOpen={isNightInfoModalOpen} onClose={() => setIsNightInfoModalOpen(false)} title="Weather & Night Model">
                <p>The model applies pace penalties based on environmental conditions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Heat/Humidity:</strong> A penalty is calculated based on temperature and humidity. Your "Heat Acclimation" profile setting can reduce this penalty.</li>
                    <li><strong>Sun:</strong> "Sunny" adds a small penalty; "Overcast" provides a small bonus.</li>
                    <li><strong>Night Running:</strong> A penalty is applied during night hours (between sunset and sunrise) to account for reduced visibility and navigation challenges. Your "Night Confidence" setting determines the size of this penalty (High=0%, Medium=5%, Low=10%).</li>
                </ul>
            </InfoModal>
             <InfoModal isOpen={isHikeInfoModalOpen} onClose={() => setIsHikeInfoModalOpen(false)} title="Strategic Hiking Model">
                 <div className="prose prose-invert max-w-none prose-p:text-slate-300">
                    <p>When enabled, the model will automatically switch from running to "power-hiking" on climbs steeper than your "Hike Threshold".</p>
                    <h4>Why is this faster overall?</h4>
                    <ol>
                        <li><strong>Metabolic Savings:</strong> Hiking is less aerobically costly than running uphill. The "Hiking Economy Bonus" profile setting models this energy saving, reducing your metabolic fatigue accumulation.</li>
                        <li><strong>Muscular Preservation:</strong> Hiking is significantly less damaging to your muscles than running uphill. This dramatically reduces your "Muscular Damage Score", keeping your legs fresher for later in the race.</li>
                    </ol>
                    <p>For almost all non-elite ultrarunners, strategic hiking on climbs leads to a faster finish time. Your hiking speed is determined by your <strong>VAM (Vertical Ascent in Meters per hour)</strong> setting.</p>
                 </div>
            </InfoModal>
            <TerrainTuningModal
                isOpen={!!tuningLeg}
                onClose={() => setTuningLeg(null)}
                leg={tuningLeg}
                onSave={handleSaveTuning}
            />
            <AidStationTemplateModal
                isOpen={isAidStationModalOpen}
                onClose={() => setIsAidStationModalOpen(false)}
                initialChecklist={checklistItems}
                initialFeedback={feedbackItems}
                onSave={handleSaveAidStationTemplates}
            />
            <RunnerCardsModal 
                isOpen={isRunnerCardsModalOpen} 
                onClose={() => setIsRunnerCardsModalOpen(false)} 
                legPlan={legPlan}
                raceName={raceName}
                raceEvents={raceEvents}
                nightPeriods={nightPeriods}
                isGreyscale={isGreyscale}
            />
            <MentalStrategyModal
                isOpen={isMentalStrategyModalOpen}
                onClose={() => setIsMentalStrategyModalOpen(false)}
                initialSelected={selectedNoteModules}
                onSave={setSelectedNoteModules}
            />
            <TimeBreakdownExplanationModal 
                isOpen={isTimeBreakdownExplanationModalOpen}
                onClose={() => setIsTimeBreakdownExplanationModalOpen(false)}
                computation={computation}
                referenceDistance={referenceDistance}
                referenceTimeStr={referenceTimeStr}
            />
            <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />
        </div>
    );
}

export default App;