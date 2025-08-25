
import React, { useMemo, useState } from 'react';
import { ComputationResult, ChartDataPoint, Leg, NightPeriod, RaceEvent, Terrain } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { fmtTime } from '../utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ReferenceArea, TooltipProps, ReferenceDot } from 'recharts';
import { RangeInput } from './ui/Input';

const PACE_COLOR = '#22c55e'; // A vibrant green
const ELE_COLOR = '#94a3b8';  // Muted grey for elevation

interface VisualsProps {
    computation: ComputationResult | null;
    smoothM: number;
    setSmoothM: (v: number) => void;
    legs: Leg[];
    isLegMode: boolean;
    nightPeriods: NightPeriod[];
    raceEvents: RaceEvent[];
    startDate: string;
    startTime: string;
    nightFrom: string;
    nightTo: string;
    isChartExpanded: boolean;
    setIsChartExpanded: (v: boolean) => void;
    openTimeBreakdownExplanationModal: () => void;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
    startDateTime: Date;
    isLegMode: boolean;
    nightFrom: string;
    nightTo: string;
    payload?: Array<{
        payload: ChartDataPoint;
        value: number;
        name: string;
        color: string;
    }>;
    label?: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, startDateTime, isLegMode, nightFrom, nightTo }) => {
    if (active && payload && payload.length && label != null) {
        const data = payload[0].payload as ChartDataPoint;
        if (!data) return null;

        const raceTime = new Date(startDateTime.getTime() + (data.cumulativeTime || 0) * 1000);

        if (isNaN(raceTime.getTime())) {
            return (
                 <div className="bg-panel/80 backdrop-blur-sm border border-slate-600 rounded-lg p-3 text-sm shadow-lg">
                    <p className="font-bold mb-1">{`Dist: ${label.toFixed(2)} km`}</p>
                    <p className="text-danger">Invalid Date</p>
                </div>
            );
        }

        const paceMin = Math.floor(data.pace / 60);
        const paceSec = Math.round(data.pace % 60).toString().padStart(2, '0');

        const timeOfDay = raceTime.toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });

        const timePartsStart = nightFrom.split(':').map(Number);
        const nightStartSecs = timePartsStart[0] * 3600 + timePartsStart[1] * 60;
        const timePartsEnd = nightTo.split(':').map(Number);
        const nightEndSecs = timePartsEnd[0] * 3600 + timePartsEnd[1] * 60;
        
        const secsIntoDay = raceTime.getHours() * 3600 + raceTime.getMinutes() * 60 + raceTime.getSeconds();
        const isNight = (nightStartSecs > nightEndSecs && (secsIntoDay >= nightStartSecs || secsIntoDay < nightEndSecs)) || (nightStartSecs < nightEndSecs && secsIntoDay >= nightStartSecs && secsIntoDay < nightEndSecs);
        const dayNightIcon = isNight ? '🌙' : '☀️';

        return (
            <div className="bg-panel/80 backdrop-blur-sm border border-slate-600 rounded-lg p-3 text-sm shadow-lg">
                <p className="font-bold mb-1">{`Dist: ${label.toFixed(2)} km`}</p>
                <p style={{ color: ELE_COLOR }}>{`Elevation: ${data.elevation.toFixed(0)} m`}</p>
                <p style={{ color: PACE_COLOR }}>{`Raw Pace: ${paceMin}:${paceSec} /km`}</p>
                {isLegMode && data.leg && <p className="text-muted">{`Leg: ${data.leg}`}</p>}
                 <p className="text-muted">{`Race Time: ${fmtTime(data.cumulativeTime || 0)}`}</p>
                 <p className="text-muted flex items-center gap-2">
                     <span>{`Time of Day: ${timeOfDay}`}</span>
                     <span className="text-base">{dayNightIcon}</span>
                 </p>
            </div>
        );
    }
    return null;
};

const TimeBreakdown: React.FC<{ computation: ComputationResult, openTimeBreakdownExplanationModal: () => void; }> = ({ computation, openTimeBreakdownExplanationModal }) => {
    const { flatTime, finalTime, addedTimes } = computation;
    const { elevation, terrain, stops, night, weather, fatigue } = addedTimes;

    const totalDuration = finalTime;
    if (totalDuration <= 0) return null;

    const breakdownItems = [
        { label: 'Flat Pace', time: flatTime, color: 'bg-sky-500' },
        { label: 'Elevation', time: elevation, color: 'bg-orange-500' },
        { label: 'Terrain', time: terrain, color: 'bg-teal-500' },
        { label: 'Stops', time: stops, color: 'bg-slate-500' },
        { label: 'Fatigue', time: fatigue, color: 'bg-purple-500' },
        { label: 'Weather', time: weather, color: 'bg-amber-400' },
        { label: 'Night', time: night, color: 'bg-indigo-500' },
    ].filter(item => Math.abs(item.time) > 1);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Finish Time Breakdown</h3>
                <button onClick={openTimeBreakdownExplanationModal} type="button" aria-label="More information on how time is calculated" className="text-muted hover:text-accent transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="w-full flex rounded-full overflow-hidden h-6 border border-slate-700">
                {breakdownItems.map(({ label, time, color }) => (
                    <div
                        key={label}
                        className={`${color} transition-all duration-300`}
                        style={{ width: `${(time / totalDuration) * 100}%` }}
                        title={`${label}: ${fmtTime(time)}`}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                {breakdownItems.map(({ label, time, color }) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${color}`} />
                        <span className="text-muted">{label}:</span>
                        <span className="font-mono font-semibold">{fmtTime(time)}</span>
                    </div>
                ))}
            </div>
            <div className="text-right font-bold text-lg pt-2 border-t border-slate-700">
                Total: <span className="font-mono text-accent2">{fmtTime(totalDuration)}</span>
            </div>
        </div>
    );
};

interface PaceElevationChartProps {
    data: (ChartDataPoint & { smoothedPace?: number })[];
    nightPeriods: NightPeriod[];
    raceEvents: RaceEvent[];
    legs: Leg[];
    isLegMode: boolean;
    startDateTime: Date;
    nightFrom: string;
    nightTo: string;
    showRawPace: boolean;
}

const CustomEventShape = (props: any) => {
    const { cx, cy, type } = props;
    if (cx == null || cy == null) return null;
    const symbol = type === 'sunrise' ? '☀️' : '🌙';
    const title = type === 'sunrise' ? 'Sunrise' : 'Sunset';
    return (
        <g transform={`translate(${cx}, ${cy})`}>
            <title>{title}</title>
            <text y={-12} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="18px" paintOrder="stroke" stroke="#0f172a" strokeWidth="3px" strokeLinejoin="round">
                {symbol}
            </text>
        </g>
    );
};


const PaceElevationProfileChart: React.FC<PaceElevationChartProps> = ({ data, nightPeriods, raceEvents, legs, isLegMode, startDateTime, nightFrom, nightTo, showRawPace }) => {
    const paceValues = showRawPace ? data.map(p => p.pace) : data.map(p => p.smoothedPace || p.pace);
    const minPace = Math.min(...paceValues);
    const maxPace = Math.max(...paceValues);
    const pacePadding = (maxPace - minPace) * 0.1;
    const paceDomain = [Math.floor((minPace - pacePadding) / 60) * 60, Math.ceil((maxPace + pacePadding) / 60) * 60];

    const eleValues = data.map(p => p.elevation);
    const minEle = Math.min(...eleValues);
    const maxEle = Math.max(...eleValues);
    const elePadding = (maxEle - minEle) * 0.1;
    const eleDomain = [Math.floor(minEle - elePadding), Math.ceil(maxEle + elePadding)];
    
    const legBoundaries: number[] = useMemo(() => {
        if (!isLegMode) return [];
        let cumulativeDist = 0;
        return legs.map(leg => {
            cumulativeDist += leg.dist;
            return cumulativeDist;
        });
    }, [isLegMode, legs]);

    const eventData = useMemo(() => raceEvents
        .map(event => {
            const point = data.find(p => p.km >= event.km);
            return {
                ...event,
                elevation: point ? point.elevation : eleDomain[0],
            };
        }), [raceEvents, data, eleDomain]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} />
                <XAxis type="number" dataKey="km" stroke="#94a3b8" domain={[0, 'dataMax']} tickFormatter={(km) => Math.round(km).toString()} allowDataOverflow />
                <YAxis yAxisId="ele" stroke={ELE_COLOR} domain={eleDomain} allowDataOverflow={true} />
                <YAxis yAxisId="pace" orientation="right" stroke={PACE_COLOR} domain={paceDomain} allowDataOverflow={true}
                    tickFormatter={(s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`} reversed={true}
                />
                <Tooltip content={<CustomTooltip startDateTime={startDateTime} isLegMode={isLegMode} nightFrom={nightFrom} nightTo={nightTo} />} />
                
                {isLegMode && legBoundaries.map((boundary, i) => i % 2 === 0 && (
                    <ReferenceArea key={`leg-bg-${boundary}`} x1={i === 0 ? 0 : legBoundaries[i-1]} x2={boundary} yAxisId="ele" stroke="none" fill="#475569" fillOpacity={0.15} />
                ))}

                {nightPeriods.map((p, i) => (
                    <ReferenceArea key={`night-${i}`} x1={p.x1} x2={p.x2} yAxisId="ele" stroke="none" fill="#4c1d95" fillOpacity={0.3} />
                ))}

                <Area
                    yAxisId="ele"
                    type="linear"
                    dataKey="elevation"
                    stroke={ELE_COLOR}
                    fill={ELE_COLOR}
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                    name="Elevation"
                />
                
                <Area yAxisId="pace" type="linear" dataKey={showRawPace ? 'pace' : 'smoothedPace'} stroke={PACE_COLOR} strokeWidth={2} fill="none" name="Pace" />


                {isLegMode && legBoundaries.slice(0, -1).map((boundary, i) => (
                    <ReferenceLine key={`leg-line-${boundary}-${i}`} yAxisId="ele" x={boundary} stroke="#94a3b8" strokeDasharray="4 4" />
                ))}

                 {eventData.map((event, index) => (
                    <ReferenceDot
                        key={`plan-event-dot-${index}`}
                        x={event.km}
                        y={event.elevation}
                        yAxisId="ele"
                        ifOverflow="visible"
                        shape={<CustomEventShape type={event.type} />}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
};

const ExpandedChartModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pace & Elevation Profile" size="5xl">
            <div className="h-[75vh] w-full">
                {children}
            </div>
        </Modal>
    );
};

export const Visuals: React.FC<VisualsProps> = ({
    computation, smoothM, setSmoothM, legs, isLegMode,
    nightPeriods, raceEvents, startDate, startTime, nightFrom, nightTo,
    isChartExpanded, setIsChartExpanded, openTimeBreakdownExplanationModal
}) => {
    const [showRawPace, setShowRawPace] = useState(false);

    const processedChartData = useMemo(() => {
        if (!computation) return [];
        
        const data = computation.chartData;

        const windowSize = Math.max(1, Math.round(smoothM / 25)); // Convert meters to number of segments
        
        if (windowSize === 1) {
            return data.map(p => ({ ...p, smoothedPace: p.pace }));
        }

        return data.map((point, i) => {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
            const window = data.slice(start, end);
            const avgPace = window.reduce((acc, p) => acc + p.pace, 0) / window.length;
            return { ...point, smoothedPace: avgPace };
        });
    }, [computation, smoothM]);

    const startDateTime = useMemo(() => new Date(`${startDate}T${startTime}`), [startDate, startTime]);

    const chartComponent = computation && processedChartData.length > 0 ? (
        <PaceElevationProfileChart
            data={processedChartData}
            nightPeriods={nightPeriods}
            raceEvents={raceEvents}
            legs={legs}
            isLegMode={isLegMode}
            startDateTime={startDateTime}
            nightFrom={nightFrom}
            nightTo={nightTo}
            showRawPace={showRawPace}
        />
    ) : (
        <div className="flex items-center justify-center h-full text-muted">
            Configure race parameters to see the plan.
        </div>
    );

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">Pace & Elevation Profile</h3>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer hover:text-text whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={showRawPace}
                                onChange={e => setShowRawPace(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-accent focus:ring-accent focus:ring-offset-background"
                            />
                            Show Raw Pace
                        </label>
                        <div className={`w-full sm:w-56 transition-opacity ${showRawPace ? 'opacity-50' : 'opacity-100'}`}>
                            <RangeInput
                                label="Pace Smoothing"
                                min={25}
                                max={20000}
                                step={100}
                                value={smoothM}
                                onChange={e => setSmoothM(+e.target.value)}
                                disabled={showRawPace}
                            />
                            <p className="text-xs text-muted text-right">Smooth over {(smoothM / 1000).toFixed(1)}km</p>
                        </div>
                    </div>
                </div>
                <div className="relative group cursor-pointer" onClick={() => setIsChartExpanded(true)}>
                    <button 
                        className="absolute top-2 right-2 z-20 p-2 text-white/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:text-white hover:bg-slate-700/50 focus:opacity-100 focus:ring-2 focus:ring-accent"
                        aria-label="Expand chart"
                        title="Expand chart"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                       </svg>
                    </button>
                    <div className="h-96 w-full">
                        {chartComponent}
                    </div>
                </div>
            </Card>

            {computation && (
                <Card>
                    <TimeBreakdown computation={computation} openTimeBreakdownExplanationModal={openTimeBreakdownExplanationModal} />
                </Card>
            )}

            <ExpandedChartModal isOpen={isChartExpanded} onClose={() => setIsChartExpanded(false)}>
                {chartComponent}
            </ExpandedChartModal>
        </div>
    );
};