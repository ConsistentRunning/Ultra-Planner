

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Leg, Profile, GpxData, Segment, Terrain, ChartDataPoint, SunTimes, Marker, NightPeriod, RaceEvent, TerrainSegment, LegPlanInfo, ComputationResult, GpxPoint, MarkerIcon, markerIcons, SupportNote } from './types';
import { Controls } from './components/Controls';
import { Visuals } from './components/Visuals';
import { ProfileModal } from './components/ProfileModal';
import { InfoModal } from './components/InfoModal';
import { parseGPX as parseGPXUtil, presets, whyRows, clamp, SEGMENT_LENGTH_M, fmtTime, getFatigueReset, getMuscularFatigueReset, getWeatherFactor, getNightFactor, getTerrainFactor, getElevationAtKm, formatMinutes, terrainColors, getElevationAtDistanceM, MENTAL_NOTES, HELPER_NOTE_MODULES, HelperModuleKey, getRandomNote, replaceRandomNote, CREW_NOTE_MODULES, PACER_NOTE_MODULES, getRandomSupportNote } from './utils';
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
import { Modal } from './components/ui/Modal';
import { MentalStrategyModal } from './components/MentalStrategyModal';
import { TimeBreakdownExplanationModal } from './components/TimeBreakdownExplanationModal';


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

const WelcomeModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<'simple' | 'detailed'>('simple');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Welcome to the Ultra Planner!" size="5xl">
            <div className="space-y-4">
                <div className="flex border-b border-slate-700">
                    <button onClick={() => setView('simple')} className={`px-4 py-2 text-sm font-medium border-b-2 ${view === 'simple' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}>
                        Simple Guide
                    </button>
                    <button onClick={() => setView('detailed')} className={`px-4 py-2 text-sm font-medium border-b-2 ${view === 'detailed' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}>
                        The Detailed Science
                    </button>
                </div>

                {view === 'simple' ? (
                    <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-text prose-strong:text-accent2">
                        <h3>Create a realistic race plan in 5 simple steps:</h3>
                        <ol>
                            <li>
                                <strong>Enter Race Basics</strong>:
                                Choose 'Predict Time' or 'Plan for Goal'. Your 'Flat time' is the most important input—use a recent marathon or 50k time on a flat course. Fill in the race name and start date.
                            </li>
                            <li>
                                <strong>Define the Course</strong>:
                                For the best results, click "GPX Import" and load the official race file. Alternatively, use "Simple" mode with total gain/loss, or switch to "By Legs" mode to break the race down by aid stations for detailed planning.
                            </li>
                            <li>
                                <strong>Tune Your Runner Profile</strong>:
                                Click "Runner profile" and start with a preset that sounds like you. Fine-tune key settings like your "Heat Acclimation" and "Muscular Resilience" (how well your quads handle downhills). The defaults are a great starting point.
                            </li>
                            <li>
                                <strong>Analyze Your Plan</strong>:
                                The "Pace & Elevation Chart" shows your predicted pace throughout the race. The "Finish Time Breakdown" shows exactly where your time is going (hills, fatigue, stops, etc.). If you're using "By Legs" mode, a detailed plan appears at the bottom.
                            </li>
                            <li>
                                <strong>Print & Go!</strong>:
                                In "By Legs" mode, you can print a full "Race Plan PDF" for your crew, or handy "Runner Cards" and "Pacer Cards" to carry with you during the race.
                            </li>
                        </ol>
                        <p>That's it! Experiment with the settings to see how different strategies (like hiking more) affect your finish time.</p>
                    </div>
                ) : (
                    <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-text prose-strong:text-accent2 prose-code:text-amber-300 prose-code:before:content-[''] prose-code:after:content-[''] prose-em:text-slate-400">
                        <h3>Under the Hood: The Simulation Engine</h3>
                        <p>This planner models your race by breaking the course into 25-meter segments and calculating your pace for each one based on a sophisticated set of rules.</p>
                        
                        <h4>1. The Core Calculation: Grade Adjusted Pace (GAP)</h4>
                        <p>It starts with your <strong>Flat Pace</strong> and adjusts it for each segment based on Grade, Terrain, and Environment. For steep climbs, it can switch to a VAM-based (Vertical Ascent Meters/hour) hiking model, which is much more efficient.</p>

                        <h4>2. The Secret Sauce: The Dual-Component Fatigue Model</h4>
                        <p>Instead of a single "fatigue" score, it tracks two separate types that interact realistically:</p>
                        <ul>
                            <li>
                                <strong>Metabolic Fatigue (The "Engine")</strong>: This is your cardiovascular and glycogen depletion—"running out of gas." The model tracks this using "Effort-Seconds." The <code>Hiking Economy Bonus</code> reduces this effort, saving your engine for later.
                            </li>
                            <li>
                                <strong>Muscular Damage (The "Chassis")</strong>: This represents physical muscle breakdown. This score is asymmetrical: steep downhill running is by far the most damaging activity. Your personal <code>Muscular Resilience</code> setting determines your sensitivity to this damage.
                            </li>
                        </ul>

                        <h4>3. The Interaction: How Fatigue Spirals</h4>
                        <p>Here’s the key insight: <strong>Muscular damage accelerates metabolic fatigue.</strong> The model uses this formula:</p>
                        <p><code>Effective Fatigue % = Base Metabolic Fade % * (1 + Muscular Damage Score * Muscular Resilience)</code></p>
                        <p>This means as your legs get trashed from downhills, your pace slows down at an ever-increasing rate, even on flats. This accurately models why preserving your legs by hiking uphills early allows you to run faster and feel stronger in the final third of the race.</p>
                        
                        <h4>4. Recovery and Psychology</h4>
                        <ul>
                            <li><strong>Sleep Recovery</strong>: A sleep stop provides a non-linear "reset" to your fatigue scores. It's highly effective at clearing Metabolic Fatigue but much less so at repairing real Muscular Damage.</li>
                            <li><strong>Finish Line Pull</strong>: A small factor is applied in the final 10% of the race, slightly reducing fatigue effects to model a final "kick."</li>
                        </ul>

                        <h4 className="pt-4 border-t border-slate-700">5. Scientific Foundations & Further Reading</h4>
                        <p>This planner is a pragmatic simulation, not a peer-reviewed academic model. However, its core logic is grounded in established principles of exercise physiology. Here’s a brief overview of the science that informs the calculations:</p>
                        <ul>
                            <li>
                                <strong>Grade-Adjusted Pace (GAP):</strong> The pace adjustments for hills are based on extensive research into the metabolic cost of running. The energy required to run uphill is well-documented, as is the complex relationship of braking and propulsive forces on downhills. Our model mirrors concepts seen in research by <em>Minetti et al.</em> and practical applications like Strava's GAP.
                            </li>
                            <li>
                                <strong>Metabolic Fatigue (The "Engine"):</strong> The "Effort-Seconds" concept is an abstraction similar to scientific metrics like <em>TRIMP (Training Impulse)</em> or <em>EPOC (Excess Post-exercise Oxygen Consumption)</em>. It serves as a proxy for cardiovascular strain and the depletion of key energy sources like muscle glycogen, which are primary factors in endurance performance.
                            </li>
                            <li>
                                <strong>Muscular Damage (The "Chassis"):</strong> The model heavily penalizes downhill running because of the well-understood phenomenon of <em>eccentric muscle contractions</em>. These contractions, where the muscle lengthens under load (acting as a brake), are the primary cause of the micro-tears that lead to Delayed Onset Muscle Soreness (DOMS) and significant, lasting muscle damage. This is often the true limiter in long mountain ultras.
                            </li>
                            <li>
                                <strong>The Fatigue Interaction:</strong> The key insight—that muscular damage accelerates metabolic fatigue—is based on the concept of <em>running economy</em>. As your muscle fibers become damaged and your form breaks down, the metabolic cost of running at any given pace increases. Your "engine" has to work harder to produce the same speed, leading to a faster depletion of energy and a necessary reduction in pace.
                            </li>
                        </ul>
                    </div>
                )}
                 <div className="flex justify-end pt-4 border-t border-slate-700">
                    <Button onClick={onClose} variant="primary">Got it, let's start planning!</Button>
                </div>
            </div>
        </Modal>
    );
};


const App: React.FC = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const [raceName, setRaceName] = useState("My Ultra Race");
    const [flatTimeStr, setFlatTimeStr] = useState("4:00:00");
    const [distanceKm, setDistanceKm] = useState(50);
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
    const [isAutoNotesInfoModalOpen, setIsAutoNotesInfoModalOpen] = useState(false);
    const [isSleepInfoModalOpen, setIsSleepInfoModalOpen] = useState(false);
    const [isNightInfoModalOpen, setIsNightInfoModalOpen] = useState(false);
    const [isHikeInfoModalOpen, setIsHikeInfoModalOpen] = useState(false);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
    const [isRunnerCardsModalOpen, setIsRunnerCardsModalOpen] = useState(false);
    const [isMentalStrategyModalOpen, setIsMentalStrategyModalOpen] = useState(false);
    const [isRiegelInfoModalOpen, setIsRiegelInfoModalOpen] = useState(false);
    const [isTimeBreakdownExplanationModalOpen, setIsTimeBreakdownExplanationModalOpen] = useState(false);
    const [selectedNoteModules, setSelectedNoteModules] = useState<HelperModuleKey[]>([]);
    const [carbsPerHour, setCarbsPerHour] = useState(70);
    const [waterPerHour, setWaterPerHour] = useState(500);
    const [modelType, setModelType] = useState<'predict' | 'goal'>('predict');
    const [goalTimeStr, setGoalTimeStr] = useState("13:30:00");
    const [referenceDistance, setReferenceDistance] = useState<'race' | '10k' | 'half' | 'marathon' | '50k'>('marathon');
    const [referenceTimeStr, setReferenceTimeStr] = useState("4:00:00");
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
        const welcomeShown = localStorage.getItem('ultraPlannerWelcomeShown');
        if (!welcomeShown) {
            setIsWelcomeModalOpen(true);
        }
    }, []);

    const handleCloseWelcomeModal = () => {
        setIsWelcomeModalOpen(false);
        localStorage.setItem('ultraPlannerWelcomeShown', 'true');
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
        if (!gpxData) return;
        let cumulativeDistM = 0;
        let lastEle = gpxData.pts[0].ele;
        const updatedLegs = legs.map(leg => {
            const legStartM = cumulativeDistM;
            const legEndM = cumulativeDistM + leg.dist * 1000;
            let gain = 0, loss = 0;
            
            const relevantPoints = gpxData.pts.filter(p => p.cum >= legStartM && p.cum <= legEndM);
            if (relevantPoints.length > 0) {
                 lastEle = getElevationAtDistanceM(legStartM, gpxData.pts);
                 relevantPoints.forEach(pt => {
                    const eleDiff = pt.ele - lastEle;
                    if (eleDiff > 0) gain += eleDiff;
                    else loss -= eleDiff;
                    lastEle = pt.ele;
                });
            }
            
            cumulativeDistM = legEndM;
            return { ...leg, gain: Math.round(gain), loss: Math.round(loss) };
        });
        setLegs(updatedLegs);
    }, [gpxData, legs]);

    const nightPeriods: NightPeriod[] = useMemo(() => {
        if (!computation || !computation.chartData.length) return [];
        
        const raceStartMillis = new Date(`${startDate}T${startTime}`).getTime();
        if (isNaN(raceStartMillis)) return [];

        const periods = [];
        let inNight = false;
        let startKm = 0;

        const timePartsStart = nightFrom.split(':').map(Number);
        const nightStartSecs = timePartsStart[0] * 3600 + timePartsStart[1] * 60;
        const timePartsEnd = nightTo.split(':').map(Number);
        const nightEndSecs = timePartsEnd[0] * 3600 + timePartsEnd[1] * 60;

        for (const pt of computation.chartData) {
            const realTime = new Date(raceStartMillis + (pt.cumulativeTime || 0) * 1000);
            const secsIntoDay = realTime.getHours() * 3600 + realTime.getMinutes() * 60 + realTime.getSeconds();
            const isCurrentlyNight = (nightStartSecs > nightEndSecs && (secsIntoDay >= nightStartSecs || secsIntoDay < nightEndSecs)) || (nightStartSecs < nightEndSecs && secsIntoDay >= nightStartSecs && secsIntoDay < nightEndSecs);

            if (isCurrentlyNight && !inNight) {
                inNight = true;
                startKm = pt.km;
            } else if (!isCurrentlyNight && inNight) {
                inNight = false;
                periods.push({ x1: startKm, x2: pt.km });
            }
        }

        if (inNight) {
            periods.push({ x1: startKm, x2: computation.chartData[computation.chartData.length - 1].km });
        }

        return periods;
    }, [computation, startDate, startTime, nightFrom, nightTo]);

    const raceEvents: RaceEvent[] = useMemo(() => {
        if (!sunTimes.sunrise || !sunTimes.sunset || !computation || !computation.chartData.length) return [];

        const raceStartMillis = new Date(`${startDate}T${startTime}`).getTime();
        const events: RaceEvent[] = [];
        let sunriseFound = false, sunsetFound = false;

        const sunriseTime = sunTimes.sunrise.getTime();
        const sunsetTime = sunTimes.sunset.getTime();
        
        for (const pt of computation.chartData) {
            const pointTime = raceStartMillis + (pt.cumulativeTime || 0) * 1000;
            if (!sunriseFound && pointTime >= sunriseTime) {
                events.push({ km: pt.km, type: 'sunrise' });
                sunriseFound = true;
            }
            if (!sunsetFound && pointTime >= sunsetTime) {
                events.push({ km: pt.km, type: 'sunset' });
                sunsetFound = true;
            }
            if (sunriseFound && sunsetFound) break;
        }

        return events;
    }, [sunTimes, computation, startDate, startTime]);

    const handleFocusLeg = (legId: string) => {
        setFocusedLegId(legId);
        const element = document.getElementById(`leg-plan-${legId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setFocusedLegId(null), 1500);
    };

    const handleTuningSave = (legId: string, segments: TerrainSegment[]) => {
        setLegs(currentLegs => currentLegs.map(l => l.id === legId ? { ...l, terrainSegments: segments } : l));
        setTuningLeg(null);
    };
    
    const handlePrintPlan = () => {
        if (!legPlan || !computation) return;

        const GREYSCALE_PALETTE = {
            BG: '#FFFFFF', BORDER: '#AAAAAA', TEXT: '#000000', MUTED: '#555555', ACCENT: '#333333', ACCENT2: '#000000', CHIP_BG: '#EEEEEE',
            NIGHT_FILL: '#DDDDDD', MARKER_BG: '#999999', MARKER_ICON: '#FFFFFF', SUN_BG: '#999999', MOON_BG: '#555555',
            TERRAIN_STROKE: { road: '#999', smooth: '#777', mixed: '#555', technical: '#333', sandy: '#bbb' },
            TERRAIN_FILL: { road: '#f0f0f0', smooth: '#e0e0e0', mixed: '#d0d0d0', technical: '#c0c0c0', sandy: '#fafafa' }
        };

        const COLOR_PALETTE = {
            BG: '#f8fafc', BORDER: '#cbd5e1', TEXT: '#1e293b', MUTED: '#64748b', ACCENT: '#2563eb', ACCENT2: '#10b981', CHIP_BG: '#e2e8f0',
            NIGHT_FILL: '#f3e8ff', MARKER_BG: '#f59e0b', MARKER_ICON: '#000000', SUN_BG: '#fcd34d', MOON_BG: '#94a3b8',
            TERRAIN_STROKE: terrainColors,
            TERRAIN_FILL: { road: '#dcfce7', smooth: '#dbeafe', mixed: '#ffedd5', technical: '#fee2e2', sandy: '#fef9c3' }
        };

        const PALETTE = isGreyscale ? GREYSCALE_PALETTE : COLOR_PALETTE;
        const pdfIconMap: { [key in MarkerIcon]: string } = { 'water': 'W', 'creek': '~', 'hut': 'H', 'first-aid': '+', 'food': 'F', 'toilet': 'T', 'general': 'i', 'photo': 'P' };


        const doc = new jsPDF({ unit: 'pt' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 30;
        const boxW = pageW - margin * 2;
        let currentY = margin;

        const addHeader = (pageNumber: number) => {
            doc.setFontSize(10);
            doc.setTextColor(PALETTE.MUTED);
            doc.text(`${raceName} - Race Plan`, margin, 20);
            doc.text(`Page ${pageNumber}`, pageW - margin, 20, { align: 'right' });
        };
        
        let pageNumber = 1;
        addHeader(pageNumber);

        doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.setTextColor(PALETTE.TEXT);
        doc.text(raceName, pageW / 2, currentY, { align: 'center' });
        currentY += 20;

        doc.setFontSize(14); doc.setFont('helvetica', 'normal');
        doc.setTextColor(PALETTE.ACCENT2);
        doc.text(`Predicted Finish: ${fmtTime(computation.finalTime)}`, pageW / 2, currentY, { align: 'center' });
        currentY += 30;
        
        const addPageIfNeeded = (requiredHeight: number) => {
            if (currentY + requiredHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                pageNumber++;
                addHeader(pageNumber);
                currentY = margin;
                return true;
            }
            return false;
        };

        // Start
        const raceStartDate = new Date(`${startDate}T${startTime}`);
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.setTextColor(PALETTE.TEXT);
        doc.text('Start', margin, currentY);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`${raceStartDate.toLocaleDateString([], { weekday: 'short' })} ${raceStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pageW - margin, currentY, { align: 'right' });
        currentY += 25;

        for (const [i, info] of legPlan.entries()) {
            const { leg, arrivalTime, departureTime, totalStopTimeMins, legRunningTime, cumulativeDist, segments, markers } = info;
            const isFinish = i === legPlan.length - 1;
            const startName = i === 0 ? 'Start' : (legPlan[i - 1].leg.name || `Aid ${i}`);
            const endName = isFinish ? 'Finish' : (leg.name || `Aid ${i + 1}`);

            // Estimate block height to check for page break
            let blockHeight = 150; // Base height for leg info + chart
            if (leg.notes) blockHeight += 30;
            if (showChecklist) blockHeight += checklistItems.length * 15;
            if (showFeedback) blockHeight += feedbackItems.length * 20;
            addPageIfNeeded(blockHeight);

            doc.setDrawColor(PALETTE.BORDER);
            doc.setLineWidth(1);
            doc.line(margin, currentY, pageW - margin, currentY);
            currentY += 15;

            doc.setFontSize(12); doc.setFont('helvetica', 'bold');
            doc.setTextColor(PALETTE.TEXT);
            doc.text(`Leg ${i + 1}: ${startName} to ${endName}`, margin, currentY);
            doc.setFontSize(11);
            doc.text(fmtTime(legRunningTime), pageW - margin, currentY, { align: 'right' });
            currentY += 15;

            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.setTextColor(PALETTE.MUTED);
            const legDetails = `${leg.dist.toFixed(1)} km · +${leg.gain}/-${leg.loss}m · Avg Pace: ${Math.floor(info.adjustedPace / 60)}:${(Math.round(info.adjustedPace % 60)).toString().padStart(2, '0')} /km`;
            doc.text(legDetails, margin, currentY);
            currentY += 12;

            if (info.terrainBreakdown) {
                doc.setFontSize(8);
                const terrainDetails = `Terrain: ${info.terrainBreakdown}`;
                const terrainLines = doc.splitTextToSize(terrainDetails, boxW);
                doc.text(terrainLines, margin, currentY);
                currentY += doc.getTextDimensions(terrainLines).h + 8;
            } else {
                 currentY += 8;
            }

            // Chart
            const chartBox = { x: margin, y: currentY, w: boxW, h: 70 };
            if (segments && segments.length > 1) {
                const eleValues = segments.map(s => s.elevation);
                const minEle = Math.min(...eleValues);
                const maxEle = Math.max(...eleValues);
                const eleRange = Math.max(1, maxEle - minEle);
                const yPadding = eleRange * 0.1;

                const scaleX = (km: number) => chartBox.x + ((km - info.startKm) / leg.dist) * chartBox.w;
                const scaleY = (ele: number) => chartBox.y + chartBox.h - ((ele - (minEle - yPadding)) / (eleRange + yPadding * 2)) * chartBox.h;
                
                const nightSegs = nightPeriods?.map(p => ({ x1: Math.max(p.x1, info.startKm), x2: Math.min(p.x2, info.endKm) })).filter(p => p.x1 < p.x2) || [];
                doc.setFillColor(PALETTE.NIGHT_FILL);
                nightSegs.forEach(seg => {
                    doc.rect(scaleX(seg.x1), chartBox.y, scaleX(seg.x2) - scaleX(seg.x1), chartBox.h, 'F');
                });
                
                 for (let segIdx = 0; segIdx < segments.length - 1; segIdx++) {
                    const p1 = segments[segIdx];
                    const p2 = segments[segIdx + 1];
                    doc.setFillColor(PALETTE.TERRAIN_FILL[p1.terrain]);
                    doc.setDrawColor(PALETTE.TERRAIN_STROKE[p1.terrain]);
                    doc.triangle(scaleX(p1.km), scaleY(p1.elevation), scaleX(p2.km), scaleY(p2.elevation), scaleX(p1.km), chartBox.y + chartBox.h, 'F');
                    doc.triangle(scaleX(p2.km), scaleY(p2.elevation), scaleX(p1.km), chartBox.y + chartBox.h, scaleX(p2.km), chartBox.y + chartBox.h, 'F');
                    doc.setLineWidth(1);
                    doc.line(scaleX(p1.km), scaleY(p1.elevation), scaleX(p2.km), scaleY(p2.elevation));
                }
                
                doc.setDrawColor(PALETTE.BORDER);
                doc.rect(chartBox.x, chartBox.y, chartBox.w, chartBox.h);
                
                // X-axis ticks and labels
                const tickY = chartBox.y + chartBox.h;
                doc.setFontSize(8);
                doc.setTextColor(PALETTE.MUTED);

                const legDist = info.endKm - info.startKm;
                const tickIntervals = [50, 20, 10, 5, 2, 1, 0.5];
                let interval = tickIntervals[0];
                for (const i of tickIntervals) {
                    if (legDist / i >= 3 && legDist / i <= 8) { // Aim for 3-8 ticks
                        interval = i;
                        break;
                    }
                     if (legDist / i < 3) {
                        interval = i;
                     }
                }
                
                const startTick = Math.ceil(info.startKm / interval) * interval;

                // Draw start and end labels always
                doc.text(info.startKm.toFixed(1), chartBox.x, tickY + 10, { align: 'left' });
                doc.text(info.endKm.toFixed(1), chartBox.x + chartBox.w, tickY + 10, { align: 'right' });
                
                for (let tickKm = startTick; tickKm < info.endKm; tickKm += interval) {
                    if (tickKm > info.startKm) {
                        const tickX = scaleX(tickKm);
                        doc.text(String(tickKm.toFixed(tickKm % 1 === 0 ? 0 : 1)), tickX, tickY + 10, { align: 'center' });
                    }
                }

                markers.forEach(marker => {
                    const mx = scaleX(marker.km);
                    const my = scaleY(getElevationAtKm(marker.km, segments));
                    doc.setFillColor(PALETTE.MARKER_BG);
                    doc.circle(mx, my, 5, 'F');
                    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(PALETTE.MARKER_ICON);
                    doc.text(pdfIconMap[marker.icon] || '?', mx, my + 3, { align: 'center' });
                });
            }
            currentY += chartBox.h + 25;

            // Aid Station Card
            const cardY = currentY;
            doc.setFillColor(PALETTE.BG);
            doc.setDrawColor(PALETTE.BORDER);
            let cardHeight = 30;
            if (!isFinish) {
                 if (leg.notes) cardHeight += doc.getTextDimensions(leg.notes, { maxWidth: boxW * 0.5 - 10 }).h + 20;
                 if (showChecklist) cardHeight += checklistItems.length * 12 + 20;
                 if (showFeedback) cardHeight += feedbackItems.length * 20 + 20;
                 cardHeight = Math.max(80, cardHeight);
            }
            doc.roundedRect(margin, currentY, boxW, cardHeight, 5, 5, 'FD');
            currentY += 15;

            doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            doc.setTextColor(PALETTE.TEXT);
            doc.text(isFinish ? 'Finish Line' : `At ${endName}`, margin + 10, currentY);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text(`Arrival: ${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pageW - margin - 10, currentY, { align: 'right' });
            currentY += 12;
            doc.setTextColor(PALETTE.MUTED);
            doc.text(`${cumulativeDist.toFixed(1)} km total`, pageW - margin - 10, currentY, { align: 'right' });
            currentY += 15;

            if (!isFinish) {
                const itemGap = 14;
                const leftColW = boxW * 0.6;
                const rightColW = boxW * 0.4 - 20;
                const colGap = 20;
                let leftColY = currentY;
                let rightColY = currentY;

                doc.setFontSize(9);
                doc.setTextColor(PALETTE.TEXT);

                doc.setFont('helvetica', 'bold');
                doc.text('Nutrition:', margin + 10, leftColY);
                doc.setFont('helvetica', 'normal');
                doc.text(`Carbs: ~${info.carbsNeeded}g · Water: ~${info.waterNeeded}ml`, margin + 70, leftColY);
                leftColY += itemGap;

                doc.setFont('helvetica', 'bold');
                doc.text('Plan:', margin + 10, leftColY);
                doc.setFont('helvetica', 'normal');
                doc.text(`Stop for ${formatMinutes(totalStopTimeMins)} · Depart at ${departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, margin + 70, leftColY);
                leftColY += itemGap;

                if (leg.notes) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Crew Notes:', margin + 10, leftColY);
                    doc.setFont('helvetica', 'normal');
                    const notes = doc.splitTextToSize(leg.notes, leftColW - 70);
                    doc.text(notes, margin + 70, leftColY);
                    leftColY += doc.getTextDimensions(notes).h + 5;
                }

                if (showChecklist && checklistItems.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(PALETTE.MUTED);
                    doc.text('Checklist:', margin + leftColW + colGap, rightColY);
                    rightColY += itemGap;

                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(PALETTE.TEXT);
                    const checkboxSize = 8;
                    checklistItems.forEach(item => {
                        doc.setDrawColor(PALETTE.MUTED);
                        doc.rect(margin + leftColW + colGap, rightColY - checkboxSize, checkboxSize, checkboxSize, 'S');
                        const textLines = doc.splitTextToSize(item, rightColW - checkboxSize - 4);
                        doc.text(textLines, margin + leftColW + colGap + checkboxSize + 4, rightColY);
                        rightColY += doc.getTextDimensions(textLines).h + 4;
                    });
                }
                
                currentY = Math.max(leftColY, rightColY) + 10;
                
                if (showFeedback && feedbackItems.length > 0) {
                    currentY += 10;
                    doc.setDrawColor(PALETTE.BORDER);
                    doc.setLineDashPattern([3,3], 0);
                    doc.line(margin + 10, currentY - 5, pageW - margin - 10, currentY - 5);
                    doc.setLineDashPattern([], 0);
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(PALETTE.MUTED);
                    doc.text('Post-Leg Feedback:', margin + 10, currentY);
                    currentY += itemGap;

                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(PALETTE.TEXT);
                    feedbackItems.forEach(item => {
                        if (currentY + 15 > cardY + cardHeight) return;
                        const fullText = '• ' + item + ':';
                        doc.text(fullText, margin + 10, currentY);
                        const textW = doc.getTextWidth(fullText);
                        const lineY = currentY + doc.getLineHeight() * 0.25;
                        doc.setLineDashPattern([2, 2], 0);
                        doc.setDrawColor(PALETTE.MUTED);
                        doc.line(margin + 10 + textW + 5, lineY, pageW - margin - 10, lineY);
                        doc.setLineDashPattern([], 0);
                        currentY += itemGap * 1.2;
                    });
                }
            }
            currentY = cardY + cardHeight + 15;
        }

        doc.save(`${raceName.replace(/ /g, '_')}_RacePlan.pdf`);
    };


    const handleSaveTemplates = (checklist: string[], feedback: string[]) => {
        setChecklistItems(checklist);
        setFeedbackItems(feedback);
    }
    
    const handleAutoFillNotes = useCallback((fillTargets: { runner: boolean; crew: boolean; pacer: boolean; }) => {
        if (!isLegMode || !legPlan || legs.length === 0) {
            alert("Cannot auto-fill notes. Ensure you are in 'By Legs' mode and a plan has been calculated.");
            return;
        }

        const totalRaceDistance = legPlan[legPlan.length - 1].cumulativeDist;
        
        let isPacerActive = false;
        const updatedLegs = legs.map(leg => {
            const legInfo = legPlan.find(lp => lp.leg.id === leg.id);
            if (!legInfo) return leg;

            let finalRunnerNotes = leg.runnerNotes;
            let finalPacerNotes = leg.pacerNotes;
            let finalCrewNotes = leg.notes;
            const { startKm, endKm, segments, cumulativeDist, arrivalTime } = legInfo;

            if (leg.pacerIn) isPacerActive = true;

            // --- 1. Runner Notes ---
            if (fillTargets.runner) {
                let baseNoteGroupKey: keyof typeof MENTAL_NOTES;
                const isNight = nightPeriods.some(p => startKm < p.x2 && endKm > p.x1);
                if (isNight) baseNoteGroupKey = 'night';
                else if (endKm > totalRaceDistance * 0.9) baseNoteGroupKey = 'finalPush';
                else if (startKm >= totalRaceDistance * 0.6) baseNoteGroupKey = 'painCave';
                else if (startKm <= totalRaceDistance * 0.15) baseNoteGroupKey = 'start';
                else baseNoteGroupKey = 'longGrind';
                
                let finalNotes = [...MENTAL_NOTES[baseNoteGroupKey]];
                const injectNote = (notePool: readonly string[]) => { finalNotes = replaceRandomNote(finalNotes, getRandomNote(notePool as string[], finalNotes)); };
                
                if (selectedNoteModules.includes('pacingPro') && startKm < totalRaceDistance * 0.25) {
                    injectNote(HELPER_NOTE_MODULES.pacingPro.notes);
                    if (segments.some(seg => seg.grade < -5)) finalNotes = replaceRandomNote(finalNotes, "Go easy on the descents. Soft knees.");
                }
                if (selectedNoteModules.includes('fuelingGuardian') && startKm >= totalRaceDistance * 0.25) injectNote(HELPER_NOTE_MODULES.fuelingGuardian.notes);
                if (selectedNoteModules.includes('painResilienceCoach') && startKm >= totalRaceDistance * 0.60) injectNote(HELPER_NOTE_MODULES.painResilienceCoach.notes);
                if (selectedNoteModules.includes('trailTechnician') && (leg.terrain === 'technical' || (leg.terrainSegments && leg.terrainSegments.some(ts => ts.terrain === 'technical')))) injectNote(HELPER_NOTE_MODULES.trailTechnician.notes);
                if (selectedNoteModules.includes('focusMaster') && startKm > totalRaceDistance * 0.25 && (leg.terrain === 'road' || leg.terrain === 'smooth')) injectNote(HELPER_NOTE_MODULES.focusMaster.notes);
                if (selectedNoteModules.includes('aidStationNinja')) finalNotes = replaceRandomNote(finalNotes, `Approaching Aid Station: ${getRandomNote(HELPER_NOTE_MODULES.aidStationNinja.notes, finalNotes)}`);
                
                finalRunnerNotes = [...new Set(finalNotes)].slice(0, 5).join('\n');
            }
            
            // --- 2. Pacer Notes ---
            if (fillTargets.pacer && isPacerActive) {
                const legMidTime = new Date(arrivalTime.getTime() - (legInfo.legRunningTime / 2) * 1000);
                const legIsNight = isTimeNight(legMidTime, nightFrom, nightTo);
                let pacerNote: SupportNote;
                if (legIsNight) {
                    pacerNote = getRandomSupportNote(PACER_NOTE_MODULES.guardian);
                } else if (startKm >= totalRaceDistance * 0.75) {
                    pacerNote = getRandomSupportNote(PACER_NOTE_MODULES.closer);
                } else {
                    pacerNote = getRandomSupportNote(PACER_NOTE_MODULES.strategist);
                }
                finalPacerNotes = `DO: ${pacerNote.do}\nSAY: ${pacerNote.say}`;
            }

            if (leg.pacerOut) isPacerActive = false;

            // --- 3. Crew Notes ---
            if (fillTargets.crew && leg.crewAccess) {
                const aidStationIsNight = isTimeNight(arrivalTime, nightFrom, nightTo);
                let crewNote: SupportNote;
                if (aidStationIsNight) {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.night);
                } else if (cumulativeDist >= totalRaceDistance * 0.85) {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.finalPush);
                } else if (cumulativeDist > totalRaceDistance * 0.30) {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.midRace);
                } else {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.early);
                }
                finalCrewNotes = `DO: ${crewNote.do}\nSAY: ${crewNote.say}`;
            }

            return { ...leg, runnerNotes: finalRunnerNotes, pacerNotes: finalPacerNotes, notes: finalCrewNotes };
        });

        setLegs(updatedLegs);
        setAutoFilledTargets(prev => ({
            runner: prev.runner || fillTargets.runner,
            crew: prev.crew || fillTargets.crew,
            pacer: prev.pacer || fillTargets.pacer,
        }));
    }, [isLegMode, legs, legPlan, nightPeriods, selectedNoteModules, nightFrom, nightTo]);

    useEffect(() => {
        // This effect handles dynamically filling notes when crew/pacer status changes,
        // if the user has previously used the main auto-fill feature.
        if (!legPlan || !isLegMode || (!autoFilledTargets.crew && !autoFilledTargets.pacer)) {
            prevLegsRef.current = legs;
            return;
        }

        const prevLegs = prevLegsRef.current;
        if (legs === prevLegs || legs.length !== prevLegs.length) {
            prevLegsRef.current = legs;
            return;
        }

        const getPacerStatusMap = (legsToCheck: Leg[]): Map<string, boolean> => {
            const statusMap = new Map<string, boolean>();
            let isPacerActive = false;
            for (const leg of legsToCheck) {
                if (leg.pacerIn) isPacerActive = true;
                statusMap.set(leg.id, isPacerActive);
                if (leg.pacerOut) isPacerActive = false;
            }
            return statusMap;
        };

        const currentPacerStatus = getPacerStatusMap(legs);
        const prevPacerStatus = getPacerStatusMap(prevLegs);
        
        let needsUpdate = false;
        const updatedLegs = [...legs];
        const totalRaceDistance = legPlan.length > 0 ? legPlan[legPlan.length - 1].cumulativeDist : 0;
        
        for (let i = 0; i < legs.length; i++) {
            const leg = legs[i];
            const prevLeg = prevLegs[i];
            if (!prevLeg || leg.id !== prevLeg.id) continue;

            const legInfo = legPlan.find(lp => lp.leg.id === leg.id);
            if (!legInfo) continue;

            // 1. Check for crew access change (from false to true) and fill if notes are empty
            if (autoFilledTargets.crew && leg.crewAccess && !prevLeg.crewAccess && !leg.notes) {
                const aidStationIsNight = isTimeNight(legInfo.arrivalTime, nightFrom, nightTo);
                let crewNote: SupportNote;
                if (aidStationIsNight) {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.night);
                } else if (legInfo.cumulativeDist >= totalRaceDistance * 0.85) {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.finalPush);
                } else if (legInfo.cumulativeDist > totalRaceDistance * 0.30) {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.midRace);
                } else {
                    crewNote = getRandomSupportNote(CREW_NOTE_MODULES.early);
                }
                updatedLegs[i] = { ...updatedLegs[i], notes: `DO: ${crewNote.do}\nSAY: ${crewNote.say}` };
                needsUpdate = true;
            }

            // 2. Check for pacer status change (from false to true) and fill if pacer notes are empty
            const isPacerOnThisLeg = currentPacerStatus.get(leg.id) || false;
            const wasPacerOnThisLeg = prevPacerStatus.get(leg.id) || false;

            if (autoFilledTargets.pacer && isPacerOnThisLeg && !wasPacerOnThisLeg && !leg.pacerNotes) {
                const legMidTime = new Date(legInfo.arrivalTime.getTime() - (legInfo.legRunningTime / 2) * 1000);
                const legIsNight = isTimeNight(legMidTime, nightFrom, nightTo);
                let pacerNote: SupportNote;
                if (legIsNight) {
                    pacerNote = getRandomSupportNote(PACER_NOTE_MODULES.guardian);
                } else if (legInfo.startKm >= totalRaceDistance * 0.75) {
                    pacerNote = getRandomSupportNote(PACER_NOTE_MODULES.closer);
                } else {
                    pacerNote = getRandomSupportNote(PACER_NOTE_MODULES.strategist);
                }
                updatedLegs[i] = { ...updatedLegs[i], pacerNotes: `DO: ${pacerNote.do}\nSAY: ${pacerNote.say}` };
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            setLegs(updatedLegs);
        }

        prevLegsRef.current = legs;
    }, [legs, legPlan, isLegMode, autoFilledTargets, nightFrom, nightTo]);


    return (
        <div className="min-h-screen bg-background text-text font-sans p-4 lg:p-6">
            <main className="max-w-7xl mx-auto space-y-6">
                 <header className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-b-2 border-slate-700/50">
                    <div className="flex items-center gap-4">
                        <Logo />
                        <div>
                            <h1 className="text-3xl font-bold text-text">Consistent Running</h1>
                            <h2 className="text-xl text-muted">Ultra Planner</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => setIsWelcomeModalOpen(true)} variant="secondary">
                            App Guide
                        </Button>
                        <Button onClick={() => setIsRunnerCardsModalOpen(true)} variant="primary" disabled={!isLegMode || legs.length === 0}>
                            Print Cards
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
                        <Controls
                            raceName={raceName} setRaceName={setRaceName}
                            flatTimeStr={flatTimeStr}
                            referenceDistance={referenceDistance} setReferenceDistance={setReferenceDistance}
                            referenceTimeStr={referenceTimeStr} setReferenceTimeStr={setReferenceTimeStr}
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
                            showChecklist={showChecklist} setShowChecklist={setShowChecklist}
                            showFeedback={showFeedback} setShowFeedback={setShowFeedback}
                            isGreyscale={isGreyscale} setIsGreyscale={setIsGreyscale}
                        />
                         <Card>
                            <LegsEditor
                                legs={legs}
                                setLegs={setLegs}
                                isLegMode={isLegMode}
                                setIsLegMode={setIsLegMode}
                                simpleGain={simpleGain} setSimpleGain={setSimpleGain}
                                simpleLoss={simpleLoss} setSimpleLoss={setSimpleLoss}
                                simpleTerrain={simpleTerrain} setSimpleTerrain={setSimpleTerrain}
                                distanceKm={distanceKm}
                                isSleepPlanned={isSleepPlanned}
                                openLegsInfoModal={() => setIsLegsInfoModalOpen(true)}
                                openAutoNotesInfoModal={() => setIsAutoNotesInfoModalOpen(true)}
                                openAidStationModal={() => setIsAidStationModalOpen(true)}
                                setTuningLeg={setTuningLeg}
                                onFocusLeg={handleFocusLeg}
                                onAutoFillNotes={handleAutoFillNotes}
                                onOpenMentalStrategy={() => setIsMentalStrategyModalOpen(true)}
                            />
                        </Card>
                        <MarkersEditor markers={markers} setMarkers={setMarkers} />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Visuals
                            computation={computation}
                            smoothM={smoothM}
                            setSmoothM={setSmoothM}
                            legs={legs}
                            isLegMode={isLegMode}
                            nightPeriods={nightPeriods}
                            raceEvents={raceEvents}
                            startDate={startDate}
                            startTime={startTime}
                            nightFrom={nightFrom}
                            nightTo={nightTo}
                            isChartExpanded={isChartExpanded}
                            setIsChartExpanded={setIsChartExpanded}
                            openTimeBreakdownExplanationModal={() => setIsTimeBreakdownExplanationModalOpen(true)}
                        />
                        {isLegMode && legPlan && (
                          <div ref={planRef}>
                            <RacePlan 
                                raceName={raceName}
                                legPlan={legPlan}
                                computation={computation}
                                startDate={startDate}
                                startTime={startTime}
                                focusedLegId={focusedLegId}
                                raceEvents={raceEvents}
                                nightPeriods={nightPeriods}
                                chartData={computation.chartData}
                                checklistItems={checklistItems}
                                feedbackItems={feedbackItems}
                                showChecklist={showChecklist}
                                showFeedback={showFeedback}
                                onPrint={handlePrintPlan}
                            />
                           </div>
                        )}
                    </div>
                </div>
            </main>
            <WelcomeModal isOpen={isWelcomeModalOpen} onClose={handleCloseWelcomeModal} />
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
             <MentalStrategyModal
                isOpen={isMentalStrategyModalOpen}
                onClose={() => setIsMentalStrategyModalOpen(false)}
                initialSelected={selectedNoteModules}
                onSave={setSelectedNoteModules}
            />
            <InfoModal isOpen={isWhyModalOpen} onClose={() => setIsWhyModalOpen(false)} title="Understanding the Runner Profile" size="4xl">
                 <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-700">
                        <tr>
                            <th scope="col" className="px-4 py-2">Parameter</th>
                            <th scope="col" className="px-4 py-2">Default Value</th>
                            <th scope="col" className="px-4 py-2">What it Means</th>
                        </tr>
                    </thead>
                    <tbody>
                        {whyRows.map(([param, val, desc]) => (
                             <tr key={param} className="border-b border-slate-700">
                                <th scope="row" className="px-4 py-3 font-medium text-text whitespace-nowrap">{param}</th>
                                <td className="px-4 py-3 font-mono">{val}</td>
                                <td className="px-4 py-3">{desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </InfoModal>
             <InfoModal isOpen={isLegsInfoModalOpen} onClose={() => setIsLegsInfoModalOpen(false)} title="Simple vs. By Legs Mode" size="3xl">
                <div className="space-y-4 text-slate-300">
                    <div>
                        <h3 className="font-semibold text-lg text-accent">Simple Mode</h3>
                        <p>Best for quick estimates and races with consistent terrain where you don't need a detailed aid station plan. You provide the total distance, gain, and loss, and the model treats the entire race as a single effort.</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg text-accent">By Legs Mode</h3>
                        <p>This is the full-featured planner. It allows you to break the race down into segments between aid stations. Each "leg" can have its own distance, elevation, terrain profile, and planned stop time. This provides a much more accurate prediction and generates a detailed, printable race plan.</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Use the "Create Legs" tools to quickly generate legs from a list of distances or by splitting the total distance evenly.</li>
                            <li>Click "Fill Leg Elevation" after importing a GPX file to automatically calculate the gain and loss for each leg based on the course data.</li>
                            <li>Use the "Fine Tune Terrain" button for any leg where the surface varies significantly (e.g., a mix of road, trail, and technical sections).</li>
                        </ul>
                    </div>
                </div>
            </InfoModal>
            <InfoModal isOpen={isAutoNotesInfoModalOpen} onClose={() => setIsAutoNotesInfoModalOpen(false)} title="Automatic Strategy Notes Logic" size="3xl">
                <div className="space-y-4 text-slate-300">
                    <p>
                        This feature automatically populates the notes fields with context-aware advice for the runner, crew, and pacers. It uses a hierarchical logic based on your race plan to provide the right support when it's needed most.
                    </p>
                    
                    <div className="space-y-3 p-3 bg-slate-800 rounded-lg">
                        <h4 className="font-bold text-lg text-accent2">1. For the Runner (Personal Notes)</h4>
                        <p className="text-sm">Analyzes each leg and assigns mental cues based on race position. You can customize the focus by selecting a "Mental Strategy".</p>
                        <ul className="list-disc list-inside text-sm space-y-1 pl-4">
                            <li><strong>Night Legs:</strong> Focus on safety and reaching sunrise.</li>
                            <li><strong>Final 10%:</strong> Cues to "empty the tank" and finish strong.</li>
                            <li><strong>After 60%:</strong> Notes on resilience for the "pain cave".</li>
                            <li><strong>First 15%:</strong> Reminders to stay conservative and patient.</li>
                            <li><strong>Mid-Race:</strong> Process-oriented notes for "the long grind".</li>
                        </ul>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-800 rounded-lg">
                        <h4 className="font-bold text-lg text-accent2">2. For the Crew (Aid Station Notes)</h4>
                        <p className="text-sm">For crew-accessible aid stations, it generates a "DO/SAY" script based on the runner's ETA and race position.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 pl-4">
                            <li><strong>Night Stations:</strong> Focus on warmth, safety, and simple questions.</li>
                            <li><strong>Final 15%:</strong> Urgent motivation and efficiency. Get them out fast!</li>
                            <li><strong>Mid-Race (30%-85%):</strong> Proactive problem-solving (nutrition, feet, gear).</li>
                            <li><strong>Early Stations (&lt;30%):</strong> Be an "F1 Pit Crew". Fast, efficient, positive.</li>
                        </ul>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-800 rounded-lg">
                        <h4 className="font-bold text-lg text-accent2">3. For the Pacer (Pacer Cards)</h4>
                        <p className="text-sm">For legs with a pacer, it populates a dedicated "Pacer Notes" field, which is used to generate a separate set of printable cards.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 pl-4">
                            <li><strong>Night Pacing:</strong> Be a "Guardian". Focus on safety, light, and direct commands.</li>
                            <li><strong>Final Pacing (&gt;75%):</strong> Be a "Closer". Break down distance and provide strong motivation.</li>
                            <li><strong>Default Pacing:</strong> Be a "Strategist". Take over the mental load of nutrition, timing, and upcoming terrain.</li>
                        </ul>
                    </div>
                </div>
            </InfoModal>
             <InfoModal isOpen={isSleepInfoModalOpen} onClose={() => setIsSleepInfoModalOpen(false)} title="Sleep Strategy Model" size="3xl">
                <div className="space-y-4 text-slate-300">
                     <p>Planning for sleep is critical in multi-day ultras. Enabling this feature adds a sleep duration slider to each aid station in the "By Legs" editor.</p>
                     <p>When you add a sleep stop, the model does two things:</p>
                     <ul className="list-disc list-inside mt-2 space-y-2">
                        <li>Adds the sleep duration to your total stop time at that aid station.</li>
                        <li>Reduces your accumulated fatigue, which slows you down over the course of the race. This simulates the restorative effect of sleep.</li>
                     </ul>
                      <div className="p-3 bg-slate-800 rounded-lg">
                        <h4 className="font-semibold text-accent2">How Fatigue Reset Works:</h4>
                        <p className="text-sm">The amount of fatigue "reset" is non-linear. Short naps provide a significant boost, but with diminishing returns for longer stops. Our new advanced model provides separate recovery for metabolic and muscular fatigue.</p>
                        <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                            <li><strong>30 minutes:</strong> ~20% metabolic reset / 5% muscular reset</li>
                            <li><strong>90 minutes:</strong> ~50% metabolic reset / 20% muscular reset</li>
                            <li><strong>3 hours:</strong> ~80% metabolic reset / 30% muscular reset</li>
                        </ul>
                         <p className="text-xs text-muted mt-2">This feature allows you to strategically plan short naps to maintain a stronger pace in the later stages of a long race, and see the impact on your overall finish time.</p>
                      </div>
                </div>
            </InfoModal>
             <InfoModal isOpen={isNightInfoModalOpen} onClose={() => setIsNightInfoModalOpen(false)} title="Weather & Night Model" size="3xl">
                <div className="space-y-4 text-slate-300">
                     <p>Environmental factors can have a huge impact on your pace. The model accounts for them in several ways:</p>
                     <ul className="list-disc list-inside mt-2 space-y-2">
                        <li><strong className="text-accent">Temperature:</strong> Pace is penalized for every 10°C above a baseline of 15°C. Your "Heat Acclimation" profile setting can reduce this penalty.</li>
                         <li><strong className="text-accent">Humidity:</strong> A smaller penalty is applied for humidity over 60%.</li>
                         <li><strong className="text-accent">Sun:</strong> A small penalty is applied for direct sun, and a small bonus for overcast conditions.</li>
                         <li><strong className="text-accent">Night Running:</strong> When running between the specified sunset and sunrise times, a pace penalty is applied based on your "Night Confidence" profile setting. This accounts for challenges with visibility and navigation in the dark. If you load a GPX file, the sunset/sunrise times will be automatically calculated for the race date and location.</li>
                         <li><strong className="text-accent">Night Temperature Drop:</strong> The model will use the lower "night drop" temperature when calculating heat penalties during night hours.</li>
                     </ul>
                </div>
            </InfoModal>
             <InfoModal isOpen={isHikeInfoModalOpen} onClose={() => setIsHikeInfoModalOpen(false)} title="The Strategic Hiking Model" size="3xl">
                <div className="space-y-4 text-slate-300">
                    <p>
                        It can seem counterintuitive, but strategically hiking steep uphills often leads to a faster overall finish time in an ultramarathon. Our model captures this by simulating two distinct types of fatigue:
                    </p>
                    <div className="p-4 bg-slate-800 rounded-lg space-y-3">
                        <div>
                            <h4 className="font-semibold text-accent2">1. Metabolic Conservation (The "Engine")</h4>
                            <p className="text-sm">
                                On steep grades, running becomes very inefficient. Your heart rate spikes, and you burn through energy reserves (glycogen) at a high rate. Power-hiking the same section at a similar vertical speed is metabolically cheaper.
                            </p>
                            <ul className="list-disc list-inside text-sm mt-1 ml-2">
                                <li>The <strong className="text-text">Hiking Economy Bonus</strong> setting models this, reducing your "Metabolic Fatigue" accumulation on climbs.</li>
                                <li>This means you conserve fuel and cardiovascular capacity for later in the race.</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-accent2">2. Muscular Damage Prevention (The "Chassis")</h4>
                            <p className="text-sm">
                                This is the most critical factor. Ultramarathon fatigue is often decided by muscular breakdown, not just running out of energy. Different activities stress your muscles differently:
                            </p>
                             <ul className="list-disc list-inside text-sm mt-1 ml-2">
                                <li><strong>Downhill Running:</strong> Extremely damaging due to eccentric muscle contractions. This is the primary driver of late-race quad failure.</li>
                                <li><strong>Uphill Running:</strong> Metabolically costly and still causes some muscular fatigue.</li>
                                <li><strong>Power-Hiking:</strong> Very low impact and causes minimal muscular damage.</li>
                            </ul>
                            <p className="text-sm mt-2">
                                By hiking uphills, you arrive at the top with fresher legs. This makes you significantly better at handling the punishing, muscle-trashing forces of the next descent.
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-accent">The Payoff: Why It's Faster</h4>
                        <p>
                            The model simulates this trade-off. The small amount of time you "lose" by hiking is more than compensated for later on. Because your <strong className="text-text">Muscular Damage Score</strong> is lower, your overall pace degrades far less in the second half of the race. You maintain the ability to run the flats and downhills effectively, leading to a much stronger finish and a faster overall time.
                        </p>
                    </div>
                </div>
            </InfoModal>
             <InfoModal isOpen={isRiegelInfoModalOpen} onClose={() => setIsRiegelInfoModalOpen(false)} title="Time Conversion Model" size="2xl">
                <div className="space-y-4 text-slate-300 prose prose-invert max-w-none prose-p:text-slate-300 prose-strong:text-accent2">
                    <p>
                        To predict your race time, the planner first needs a baseline: an estimate of how fast you could run your race distance on a perfectly flat course.
                    </p>
                    <p>
                        When you provide a time for a different distance (like a marathon), we use the well-regarded <strong>Riegel Endurance Model</strong> to calculate this baseline. The formula is:
                    </p>
                    <p className="text-center font-mono bg-slate-800 p-2 rounded">
                        T2 = T1 * (D2 / D1) ^ 1.06
                    </p>
                    <p>
                        This model accurately predicts how pace naturally fades over longer distances. The calculated time represents a <strong>best-case scenario</strong>, assuming you have adequately trained for the specific distance and demands of your target race (e.g., you've done the long runs).
                    </p>
                    <p>
                        For a more realistic prediction, you should fine-tune your <strong>Runner Profile</strong> to match your current training status, especially your muscular resilience to downhills.
                    </p>
                </div>
            </InfoModal>
            <TimeBreakdownExplanationModal
                isOpen={isTimeBreakdownExplanationModalOpen}
                onClose={() => setIsTimeBreakdownExplanationModalOpen(false)}
                computation={computation}
                referenceDistance={referenceDistance}
                referenceTimeStr={referenceTimeStr}
            />
            <TerrainTuningModal 
                isOpen={!!tuningLeg}
                onClose={() => setTuningLeg(null)}
                leg={tuningLeg}
                onSave={handleTuningSave}
            />
            <AidStationTemplateModal 
                isOpen={isAidStationModalOpen}
                onClose={() => setIsAidStationModalOpen(false)}
                initialChecklist={checklistItems}
                initialFeedback={feedbackItems}
                onSave={handleSaveTemplates}
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
        </div>
    );
};

export default App;