import React from 'react';
import { LegPlanInfo, ComputationResult, RaceEvent, NightPeriod, ChartDataPoint, Terrain, markerIcons } from '../types';
import { fmtTime, terrainColors, getElevationAtKm, formatMinutes } from '../utils';
import { ResponsiveContainer, AreaChart, Area, YAxis, XAxis, ReferenceArea, ReferenceDot, CartesianGrid } from 'recharts';
import { Button } from './ui/Button';

interface RacePlanProps {
    raceName: string;
    legPlan: LegPlanInfo[] | null;
    computation: ComputationResult | null;
    startDate: string;
    startTime: string;
    focusedLegId?: string | null;
    raceEvents?: RaceEvent[];
    nightPeriods?: NightPeriod[];
    chartData?: ChartDataPoint[];
    checklistItems: string[];
    feedbackItems: string[];
    showChecklist: boolean;
    showFeedback: boolean;
    onPrint: () => void;
}

const formatPace = (s_per_km: number) => {
    if (isNaN(s_per_km) || s_per_km <= 0) return 'N/A';
    const min = Math.floor(s_per_km / 60);
    const sec = Math.round(s_per_km % 60).toString().padStart(2, '0');
    return `${min}:${sec} /km`;
};

const PlanMarkerDot: React.FC<any> = ({ cx, cy, payload }) => {
    if (cx == null || cy == null) return null;
    const iconDetails = markerIcons.find(i => i.value === payload.icon);
    const icon = iconDetails ? iconDetails.label.split(' ')[0] : '?';
    return (
        <g transform={`translate(${cx}, ${cy})`}>
            <title>{`${payload.km.toFixed(1)}km: ${payload.note}`}</title>
            <circle r="7" fill="#f59e0b" stroke="white" strokeWidth="2" />
            <text textAnchor="middle" dominantBaseline="central" y={1} fill="black" fontSize="9px" fontWeight="bold">{icon}</text>
        </g>
    );
};

export const RacePlan: React.FC<RacePlanProps> = (props) => {
    const { legPlan, computation, raceName, startDate, startTime, checklistItems, feedbackItems, showChecklist, showFeedback, onPrint, nightPeriods, focusedLegId } = props;

    if (!legPlan || !computation) {
        return (
            <div className="bg-panel/70 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-lg">
                <div className="text-center text-muted p-8">No plan generated. Select "By Legs" mode and add legs to the course.</div>
            </div>
        )
    }

    const raceStartDate = new Date(`${startDate}T${startTime}`);

    return (
        <div className="bg-white text-slate-900 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">{raceName}</h2>
                    <p className="text-xl text-green-600 font-semibold">Predicted Finish: <span className="font-mono">{fmtTime(computation.finalTime)}</span></p>
                </div>
                <Button onClick={onPrint} className="bg-blue-600 hover:bg-blue-700 text-white !rounded-lg">Print Full Plan</Button>
            </div>

            <div className="relative pl-8">
                <div className="absolute top-2.5 bottom-0 left-2 w-0.5 bg-slate-200" aria-hidden="true"></div>

                <div className="relative mb-8">
                    <div className="absolute -left-[30px] top-0 flex items-center" aria-hidden="true">
                        <div className="h-5 w-5 rounded-full bg-blue-500 border-4 border-white"></div>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-xl font-bold">Start</h3>
                        <p className="text-sm font-medium text-slate-500">
                            {raceStartDate.toLocaleDateString([], { weekday: 'short' })} {raceStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                    </div>
                </div>

                {legPlan.map((info, i) => {
                    const { leg, arrivalTime, departureTime, totalStopTimeMins, legRunningTime, cumulativeDist, segments } = info;
                    const isFinish = i === legPlan.length - 1;
                    const startName = i === 0 ? 'Start' : (legPlan[i - 1].leg.name || `Aid ${i}`);
                    const endName = isFinish ? 'Finish' : (leg.name || `Aid ${i + 1}`);
                    const isFocused = focusedLegId === leg.id;

                    const eventsInLeg = props.raceEvents?.filter(e => e.km > info.startKm && e.km <= info.endKm) || [];

                    const legChartData = React.useMemo(() => {
                        if (!segments) return [];
                        return segments.map(p => {
                            const point: any = { ...p };
                            for (const terrain of Object.keys(terrainColors) as Terrain[]) {
                                point[`elevation_${terrain}`] = p.terrain === terrain ? p.elevation : null;
                            }
                            return point;
                        });
                    }, [segments]);

                    const nightSegmentsForLeg = nightPeriods
                        ? nightPeriods.map(p => ({
                              x1: Math.max(p.x1, info.startKm),
                              x2: Math.min(p.x2, info.endKm),
                          })).filter(p => p.x1 < p.x2)
                        : [];
                    
                    const terrainFills: { [key in Terrain]: string } = { road: '#dcfce7', smooth: '#dbeafe', mixed: '#ffedd5', technical: '#fee2e2', sandy: '#fef9c3' };

                    return (
                        <div key={leg.id} id={`leg-plan-${leg.id}`} className={`mb-8 transition-all duration-1000 ${isFocused ? 'highlight' : ''}`}>
                            <div className="relative mb-8">
                                <div className="flex justify-between items-baseline mb-3">
                                    <h4 className="text-lg font-semibold text-slate-700">Leg {i + 1}: {startName} to {endName}</h4>
                                    <p className="font-mono text-slate-600">{fmtTime(legRunningTime)}</p>
                                </div>
                                
                                {eventsInLeg.length > 0 && (
                                    <div className="space-y-1 mb-2">
                                        {eventsInLeg.map(event => (
                                            <div key={event.type} className={`flex items-center gap-2 p-2 rounded-md text-sm ${event.type === 'sunset' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                <span className="text-lg">{event.type === 'sunset' ? '🌅' : '☀️'}</span>
                                                <div>
                                                    <span className="font-bold">{event.type === 'sunset' ? 'Sunset' : 'Sunrise'}</span>
                                                    <span className="text-xs font-normal"> at ~{(event.km).toFixed(1)} km</span>
                                                </div>
                                                <div className="ml-auto text-xs font-medium text-right">
                                                    {event.type === 'sunset' ? 'Prepare headtorch & high-vis gear.' : 'Stow night gear soon.'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="w-full h-32 bg-slate-50 rounded-md p-2 border border-slate-200">
                                    {legChartData.length > 1 && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={legChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                                                 <XAxis 
                                                    type="number" dataKey="km" 
                                                    domain={[info.startKm, info.endKm]} 
                                                    stroke="#94a3b8" fontSize={10} 
                                                    tickFormatter={(km) => km.toFixed(1)} 
                                                    interval="preserveStartEnd" 
                                                />
                                                <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                                                
                                                {nightSegmentsForLeg.map((p, nightIdx) => (
                                                    <ReferenceArea key={nightIdx} x1={p.x1} x2={p.x2} stroke="none" fill="#d8b4fe" fillOpacity={0.4} ifOverflow="visible" />
                                                ))}

                                                {Object.keys(terrainFills).map((terrain) => (
                                                     <Area
                                                        key={terrain} type="monotone"
                                                        dataKey={`elevation_${terrain}`}
                                                        stroke={terrainColors[terrain as Terrain]}
                                                        fill={terrainFills[terrain as Terrain]}
                                                        strokeWidth={1.5} connectNulls
                                                    />
                                                ))}
                                                {info.markers.map(marker => (
                                                    <ReferenceDot
                                                        key={`marker-${marker.id}`}
                                                        x={marker.km}
                                                        y={getElevationAtKm(marker.km, info.segments)}
                                                        ifOverflow="visible"
                                                        shape={<PlanMarkerDot payload={marker} />}
                                                        yAxisId={0}
                                                    />
                                                ))}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                
                                <div className="mt-2 text-sm text-slate-500 leading-tight">
                                    <span>{leg.dist.toFixed(2)} km</span>
                                    <span className="mx-2">·</span>
                                    <span>+{leg.gain}/-{leg.loss}m</span>
                                    <span className="mx-2">·</span>
                                    <span>Avg Pace: {formatPace(info.adjustedPace)}</span>
                                    {info.terrainBreakdown && <div className="text-xs">Terrain: {info.terrainBreakdown}</div>}
                                </div>
                            </div>
                            
                            <div className="relative">
                                 <div className="absolute -left-[30px] top-0 flex items-center" aria-hidden="true">
                                    <div className="h-5 w-5 rounded-full bg-slate-400 border-4 border-white"></div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-2 mb-4">
                                        <div className="flex items-baseline gap-3 flex-wrap">
                                            <h3 className="text-lg font-bold">{isFinish ? 'Finish Line' : `At ${endName}`}</h3>
                                            {(!isFinish && (leg.crewAccess || leg.dropBag || leg.pacerIn || leg.pacerOut)) && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {leg.crewAccess && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">Crew</span>}
                                                    {leg.dropBag && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">Drop Bag</span>}
                                                    {leg.pacerIn && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">Pacer In</span>}
                                                    {leg.pacerOut && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">Pacer Out</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className="font-bold">Arrival: {arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                            <p className="text-xs text-slate-500">{cumulativeDist.toFixed(1)} km total</p>
                                        </div>
                                    </div>

                                    {!isFinish && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                                <div className="md:col-span-3">
                                                    <div className="grid grid-cols-4 text-center">
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Stop Time</p>
                                                            {(leg.sleepMinutes || 0) > 0 ? (
                                                                <div className="leading-tight">
                                                                    <p className="text-xl font-bold">{formatMinutes(totalStopTimeMins)}</p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {`Sleep: ${formatMinutes(leg.sleepMinutes || 0)} / Stop: ${formatMinutes(leg.stop || 0)}`}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-2xl font-bold">{formatMinutes(totalStopTimeMins)}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Carbs Needed</p>
                                                            <p className="text-2xl font-bold">{info.carbsNeeded} g</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Water Needed</p>
                                                            <p className="text-2xl font-bold">{info.waterNeeded} ml</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Departure</p>
                                                            <p className="text-2xl font-bold">{departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {showChecklist && checklistItems.length > 0 && (
                                                    <div className="md:col-span-2">
                                                        <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Checklist</h5>
                                                        <ul className="space-y-1 text-sm">
                                                            {checklistItems.map((item, idx) => (
                                                                <li key={idx} className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 border border-slate-400 rounded-sm flex-shrink-0" aria-hidden="true"></div>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {leg.notes && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Crew Notes</h5>
                                                    <p className="text-sm whitespace-pre-wrap">{leg.notes}</p>
                                                </div>
                                            )}

                                            {showFeedback && feedbackItems.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Post-Leg Feedback</h5>
                                                    <ul className="space-y-3 text-sm">
                                                        {feedbackItems.map((item, idx) => (
                                                            <li key={idx} className="flex items-baseline gap-2">
                                                                <span className="whitespace-nowrap">• {item}:</span>
                                                                <div className="w-full border-b border-dotted border-slate-400 -mb-1"></div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};