

import React, { useCallback, useMemo } from 'react';
import { GpxData, Leg, Terrain } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Select, FileInput } from './ui/Input';
import { fmtTime } from '../utils';

interface ControlsProps {
  raceName: string; setRaceName: (v: string) => void;
  flatTimeStr: string;
  referenceDistance: 'race' | '10k' | 'half' | 'marathon' | '50k';
  setReferenceDistance: (v: 'race' | '10k' | 'half' | 'marathon' | '50k') => void;
  referenceTimeStr: string;
  setReferenceTimeStr: (v: string) => void;
  distanceKm: number; setDistanceKm: (v: number) => void;
  startDate: string; setStartDate: (v: string) => void;
  startTime: string; setStartTime: (v: string) => void;
  nightFrom: string; setNightFrom: (v: string) => void;
  nightTo: string; setNightTo: (v: string) => void;
  tempC: number; setTempC: (v: number) => void;
  nightTempDrop: number; setNightTempDrop: (v: number) => void;
  humPct: number; setHumPct: (v: number) => void;
  sun: 'Partly Cloudy' | 'Sunny' | 'Overcast'; setSun: (v: 'Partly Cloudy' | 'Sunny' | 'Overcast') => void;
  gpxData: GpxData | null; setGpxData: (v: GpxData | null) => void;
  gpxFileName: string; setGpxFileName: (v: string) => void;
  onGpxLoad: (file: File) => void;
  legs: Leg[];
  isLegMode: boolean;
  fillLegsFromGpx: () => void;
  openProfileModal: () => void;
  openHowModal: () => void;
  openSleepInfoModal: () => void;
  openNightInfoModal: () => void;
  openRiegelInfoModal: () => void;
  carbsPerHour: number; setCarbsPerHour: (v: number) => void;
  waterPerHour: number; setWaterPerHour: (v: number) => void;
  sunTimesAvailable: boolean;
  modelType: 'predict' | 'goal'; setModelType: (v: 'predict' | 'goal') => void;
  goalTimeStr: string; setGoalTimeStr: (v: string) => void;
  computationFlatTime?: number;
  isSleepPlanned: boolean;
  setIsSleepPlanned: (v: boolean) => void;
  showChecklist: boolean; setShowChecklist: (v: boolean) => void;
  showFeedback: boolean; setShowFeedback: (v: boolean) => void;
  isGreyscale: boolean; setIsGreyscale: (v: boolean) => void;
}

export const Controls: React.FC<ControlsProps> = (props) => {
    const flatTimeDisplayValue = useMemo(() => {
        if (props.modelType === 'goal' && props.computationFlatTime) {
          return fmtTime(props.computationFlatTime);
        }
        return props.flatTimeStr;
    }, [props.modelType, props.computationFlatTime, props.flatTimeStr]);

    const [refHours, refMinutes, refSeconds] = useMemo(() => {
        const parts = props.referenceTimeStr.split(':').map(v => parseInt(v, 10) || 0);
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    }, [props.referenceTimeStr]);

    const handleReferenceTimeChange = (part: 'h' | 'm' | 's', value: number) => {
        const newH = part === 'h' ? value : refHours;
        const newM = part === 'm' ? value : refMinutes;
        const newS = part === 's' ? value : refSeconds;
        const newTimeStr = `${newH}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
        props.setReferenceTimeStr(newTimeStr);
    };

    const [goalHours, goalMinutes, goalSeconds] = useMemo(() => {
        const parts = props.goalTimeStr.split(':').map(v => parseInt(v, 10) || 0);
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    }, [props.goalTimeStr]);

    const handleGoalTimeChange = (part: 'h' | 'm' | 's', value: number) => {
        const newH = part === 'h' ? value : goalHours;
        const newM = part === 'm' ? value : goalMinutes;
        const newS = part === 's' ? value : goalSeconds;
        const newTimeStr = `${newH}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
        props.setGoalTimeStr(newTimeStr);
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={props.openHowModal}>How it works</Button>
                        <Button onClick={props.openProfileModal}>Runner profile</Button>
                    </div>
                </div>

                <div className="space-y-4 mt-4">
                    {/* Model Type */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">Model Type</label>
                        <div className="inline-flex rounded-md shadow-sm w-full">
                            <button onClick={() => props.setModelType('predict')} className={`px-4 py-2 text-sm font-medium border border-slate-600 rounded-l-lg w-1/2 ${props.modelType === 'predict' ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                Predict Time
                            </button>
                            <button onClick={() => props.setModelType('goal')} className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-slate-600 rounded-r-lg w-1/2 ${props.modelType === 'goal' ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                Plan for Goal
                            </button>
                        </div>
                    </div>

                    <Input label="Race name" value={props.raceName} onChange={e => props.setRaceName(e.target.value)} />
                    
                    {props.modelType === 'predict' ? (
                        <div className="border border-dashed border-slate-600 rounded-lg p-3 space-y-3">
                            <h4 className="text-sm font-medium text-muted">Reference Performance</h4>
                            <div className="grid grid-cols-2 gap-4 items-end">
                                <Select label="Distance" value={props.referenceDistance} onChange={e => props.setReferenceDistance(e.target.value as any)}>
                                    <option value="race">Race Distance</option>
                                    <option value="marathon">Marathon</option>
                                    <option value="50k">50k</option>
                                    <option value="half">Half Marathon</option>
                                    <option value="10k">10k</option>
                                </Select>
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1">Time</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        <Select aria-label="Hours" value={refHours} onChange={e => handleReferenceTimeChange('h', +e.target.value)} className="text-center">
                                            {[...Array(101).keys()].map(h => <option key={h} value={h}>{h}</option>)}
                                        </Select>
                                        <Select aria-label="Minutes" value={refMinutes} onChange={e => handleReferenceTimeChange('m', +e.target.value)} className="text-center">
                                            {[...Array(60).keys()].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                                        </Select>
                                        <Select aria-label="Seconds" value={refSeconds} onChange={e => handleReferenceTimeChange('s', +e.target.value)} className="text-center">
                                            {[...Array(60).keys()].map(s => <option key={s} value={s}>{String(s).padStart(2, '0')}</option>)}
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            {props.referenceDistance !== 'race' && (
                                <p className="text-xs text-amber-400">
                                    Note: Predictions are most accurate when using a time for your actual race distance.
                                </p>
                            )}
                            <div className="pt-2 border-t border-slate-700/50">
                                <div className="flex items-center gap-2">
                                     <p className="text-sm text-muted">Calculated Flat Time for Race:</p>
                                     {props.referenceDistance !== 'race' && (
                                        <button onClick={props.openRiegelInfoModal} type="button" aria-label="More information on time conversion" className="text-muted hover:text-accent transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                     )}
                                </div>
                                <p className="font-mono text-lg text-accent2">{props.flatTimeStr}</p>
                            </div>
                        </div>
                    ) : ( // goal mode
                        <div className="grid grid-cols-2 gap-x-4">
                            <div>
                                <Input 
                                    label="Required Flat Time" 
                                    value={flatTimeDisplayValue}
                                    disabled={true}
                                />
                                <p className="text-xs text-muted mt-1">Calculated time to meet goal.</p>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-muted mb-1">Goal Finish Time</label>
                                <div className="grid grid-cols-3 gap-1">
                                    <Select aria-label="Goal Hours" value={goalHours} onChange={e => handleGoalTimeChange('h', +e.target.value)} className="text-center">
                                        {[...Array(101).keys()].map(h => <option key={h} value={h}>{h}</option>)}
                                    </Select>
                                    <Select aria-label="Goal Minutes" value={goalMinutes} onChange={e => handleGoalTimeChange('m', +e.target.value)} className="text-center">
                                        {[...Array(60).keys()].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                                    </Select>
                                    <Select aria-label="Goal Seconds" value={goalSeconds} onChange={e => handleGoalTimeChange('s', +e.target.value)} className="text-center">
                                        {[...Array(60).keys()].map(s => <option key={s} value={s}>{String(s).padStart(2, '0')}</option>)}
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Start & Night */}
                    <div className="grid grid-cols-2 gap-x-4 items-start">
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="date" label="Start date" value={props.startDate} onChange={e => props.setStartDate(e.target.value)} />
                            <Input type="time" label="Start time" value={props.startTime} onChange={e => props.setStartTime(e.target.value)} />
                        </div>
                        <div className="border border-dashed border-slate-600 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1">Sunset</label>
                                    <Input 
                                        type="time" 
                                        value={props.nightFrom}
                                        onChange={e => props.setNightFrom(e.target.value)}
                                        disabled={props.sunTimesAvailable}
                                        className="text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1">Sunrise</label>
                                    <Input 
                                        type="time" 
                                        value={props.nightTo}
                                        onChange={e => props.setNightTo(e.target.value)}
                                        disabled={props.sunTimesAvailable}
                                        className="text-center"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted text-center mt-2">
                                {props.sunTimesAvailable
                                    ? "Auto-filled from GPX location."
                                    : "Navigation penalty applies between these times."}
                            </p>
                        </div>
                    </div>

                    {/* Distance, Temp, etc. */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input type="number" label="Distance (km)" value={props.distanceKm} onChange={e => props.setDistanceKm(+e.target.value)} step="0.1" disabled={props.gpxData !== null || props.isLegMode}/>
                         <Select label="Sun" value={props.sun} onChange={e => props.setSun(e.target.value as any)}>
                            <option>Partly Cloudy</option>
                            <option>Sunny</option>
                            <option>Overcast</option>
                        </Select>
                    </div>
                    <div className="border border-dashed border-slate-600 rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-muted">Weather Conditions</h4>
                            <button onClick={props.openNightInfoModal} type="button" aria-label="More information on night running model" className="text-muted hover:text-accent transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input type="number" label="Daytime Temp (°C)" value={props.tempC} onChange={e => props.setTempC(+e.target.value)} step="0.5"/>
                            <Input type="number" label="Night Drop (°C)" value={props.nightTempDrop} onChange={e => props.setNightTempDrop(+e.target.value)} step="0.5"/>
                            <Input type="number" label="Humidity (%)" value={props.humPct} onChange={e => props.setHumPct(+e.target.value)} />
                        </div>
                    </div>


                    {/* Nutrition & Sleep */}
                    <div className="border border-dashed border-slate-600 rounded-lg p-3 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="number" label="Carbs per hour (g)" value={props.carbsPerHour} onChange={e => props.setCarbsPerHour(+e.target.value)} />
                            <Input type="number" label="Water per hour (ml)" value={props.waterPerHour} onChange={e => props.setWaterPerHour(+e.target.value)} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="sleep-plan-toggle" className="flex items-center gap-3 text-sm text-muted cursor-pointer">
                                    <input
                                        id="sleep-plan-toggle"
                                        type="checkbox"
                                        checked={props.isSleepPlanned}
                                        onChange={e => props.setIsSleepPlanned(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-accent focus:ring-accent"
                                    />
                                    <span>Plan for sleep stops?</span>
                                </label>
                                <button onClick={props.openSleepInfoModal} type="button" aria-label="More information on sleep strategy" className="text-muted hover:text-accent transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 ml-7">Adds sleep options to aid stations to model fatigue reset.</p>
                        </div>
                        <div className="border-t border-slate-700 pt-3">
                             <h4 className="text-sm font-medium text-muted mb-2">Plan Display Options</h4>
                             <div className="grid grid-cols-3 gap-4">
                                <label htmlFor="show-checklist-toggle" className="flex items-center gap-3 text-sm text-muted cursor-pointer">
                                     <input id="show-checklist-toggle" type="checkbox" checked={props.showChecklist} onChange={e => props.setShowChecklist(e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-accent focus:ring-accent" />
                                     <span>Show Checklist</span>
                                 </label>
                                 <label htmlFor="show-feedback-toggle" className="flex items-center gap-3 text-sm text-muted cursor-pointer">
                                     <input id="show-feedback-toggle" type="checkbox" checked={props.showFeedback} onChange={e => props.setShowFeedback(e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-accent focus:ring-accent" />
                                     <span>Show Feedback Form</span>
                                 </label>
                                 <label htmlFor="greyscale-toggle" className="flex items-center gap-3 text-sm text-muted cursor-pointer">
                                     <input id="greyscale-toggle" type="checkbox" checked={props.isGreyscale} onChange={e => props.setIsGreyscale(e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-accent focus:ring-accent" />
                                     <span>Greyscale PDF</span>
                                 </label>
                             </div>
                        </div>
                    </div>

                    {/* GPX */}
                    <div className="border border-dashed border-slate-600 rounded-lg p-3 space-y-2">
                        <FileInput label="GPX import" accept=".gpx" onFileSelect={props.onGpxLoad}/>
                        {props.gpxData && (
                            <div className="text-xs text-muted mt-2 space-y-1">
                                <p className="font-semibold truncate" title={props.gpxFileName}>{props.gpxFileName}</p>
                                <p>Loaded: {(props.gpxData.dist_m / 1000).toFixed(2)} km, +{Math.round(props.gpxData.gain_m)}m / -{Math.round(props.gpxData.loss_m)}m</p>
                            </div>
                        )}
                        <div className="flex gap-2 pt-1">
                            <Button onClick={() => { props.setGpxData(null); props.setGpxFileName(''); }} disabled={!props.gpxData}>Clear GPX</Button>
                            <Button onClick={props.fillLegsFromGpx} disabled={!props.gpxData || !props.isLegMode || props.legs.length === 0}>Fill Leg Elevation</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}