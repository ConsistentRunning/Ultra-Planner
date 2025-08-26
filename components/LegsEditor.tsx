
import React, { useState, useRef, useEffect } from 'react';
import { Leg, Terrain, TerrainSegment } from '../types';
import { Button } from './ui/Button';
import { Input, Select, RangeInput } from './ui/Input';
import { formatMinutes, getFatigueReset, getMuscularFatigueReset } from '../utils';

interface LegsEditorProps {
    legs: Leg[];
    setLegs: (legs: Leg[]) => void;
    isLegMode: boolean;
    setIsLegMode: (isLegMode: boolean) => void;
    simpleGain: number; setSimpleGain: (v: number) => void;
    simpleLoss: number; setSimpleLoss: (v: number) => void;
    simpleTerrain: Terrain; setSimpleTerrain: (v: Terrain) => void;
    distanceKm: number;
    isSleepPlanned: boolean;
    openLegsInfoModal: () => void;
    openAutoNotesInfoModal: () => void;
    openFromDistInfoModal: () => void;
    openAidStationModal: () => void;
    setTuningLeg: (leg: Leg | null) => void;
    onFocusLeg: (legId: string) => void;
    onAutoFillNotes: (targets: { runner: boolean; crew: boolean; pacer: boolean; }) => void;
    onOpenMentalStrategy: () => void;
}

const terrains: Terrain[] = ["road", "smooth", "mixed", "technical", "sandy", "slow"];

const Checkbox: React.FC<{ leg: Leg, field: keyof Leg, label: string, updateLeg: (id: string, key: keyof Leg, value: any) => void; }> = ({ leg, field, label, updateLeg }) => (
    <label className="flex items-center gap-2 text-sm text-muted cursor-pointer hover:text-text">
        <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-accent focus:ring-accent focus:ring-offset-0"
            checked={!!leg[field]}
            onChange={e => updateLeg(leg.id, field, e.target.checked)}
        />
        <span>{label}</span>
    </label>
);

export const LegsEditor: React.FC<LegsEditorProps> = ({
    legs, setLegs, isLegMode, setIsLegMode,
    simpleGain, setSimpleGain, simpleLoss, setSimpleLoss, simpleTerrain, setSimpleTerrain,
    distanceKm, isSleepPlanned, openLegsInfoModal, openAutoNotesInfoModal, openFromDistInfoModal, openAidStationModal, setTuningLeg, onFocusLeg,
    onAutoFillNotes, onOpenMentalStrategy
}) => {
    const [pasteText, setPasteText] = useState("12.6, 13.3, 11.5, 16.4, 12.3");
    const [splitCount, setSplitCount] = useState(6);
    const [defaultTerrain, setDefaultTerrain] = useState<Terrain>('mixed');
    const [isAutoFillOpen, setIsAutoFillOpen] = useState(false);
    const [autoFillTargets, setAutoFillTargets] = useState({ runner: true, crew: true, pacer: true });
    const autoFillRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (autoFillRef.current && !autoFillRef.current.contains(event.target as Node)) {
                setIsAutoFillOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [autoFillRef]);

    const handleApplyAutoFill = () => {
        onAutoFillNotes(autoFillTargets);
        setIsAutoFillOpen(false);
    };

    const handleAutoFillTargetChange = (target: 'runner' | 'crew' | 'pacer') => {
        setAutoFillTargets(prev => ({ ...prev, [target]: !prev[target] }));
    };

    const updateLeg = (id: string, key: keyof Leg, value: any) => {
        setLegs(legs.map(leg => {
            if (leg.id === id) {
                const updatedLeg = { ...leg, [key]: value };

                if (key === 'sleepMinutes') {
                    const sleepNote = "Prepare for sleeping";
                    let notes = updatedLeg.notes || '';
                    const hasSleepNote = notes.includes(sleepNote);
                    const sleepMinutes = Number(value) || 0;
                    
                    if (sleepMinutes > 0 && !hasSleepNote) {
                        notes = notes ? `${notes.trim()}\n${sleepNote}` : sleepNote;
                    } else if (sleepMinutes <= 0 && hasSleepNote) {
                        notes = notes.split('\n').filter(line => line.trim() !== sleepNote).join('\n').trim();
                    }
                    updatedLeg.notes = notes;
                }
                return updatedLeg;
            }
            return leg;
        }));
    };

    const addLeg = () => {
        setLegs([...legs, { id: Date.now().toString(), name: '', dist: 10, gain: 0, loss: 0, terrain: 'mixed', stop: 0, sleepMinutes: 0, notes: '', runnerNotes: '', pacerNotes: '', cutoff: '', crewAccess: false, pacerIn: false, pacerOut: false, dropBag: false }]);
    };

    const deleteLeg = (id: string) => {
        setLegs(legs.filter(leg => leg.id !== id));
    };
    
    const buildFromPaste = () => {
        const newLegs = pasteText.split(/[, \n]+/).map(x => +x).filter(x => x > 0).map(dist => ({
            id: Math.random().toString(36).substring(2, 9),
            name: '',
            dist, gain: 0, loss: 0, terrain: defaultTerrain, stop: 0, sleepMinutes: 0, notes: '', runnerNotes: '', pacerNotes: '', cutoff: '', crewAccess: false, pacerIn: false, pacerOut: false, dropBag: false
        }));
        if (newLegs.length > 0) setLegs(newLegs);
    };

    const splitEvenly = () => {
        if (splitCount > 0 && distanceKm > 0) {
            const km = +(distanceKm / splitCount).toFixed(2);
            const newLegs = Array.from({ length: splitCount }, () => ({
                id: Math.random().toString(36).substring(2, 9),
                name: '',
                dist: km, gain: 0, loss: 0, terrain: defaultTerrain, stop: 0, sleepMinutes: 0, notes: '', runnerNotes: '', pacerNotes: '', cutoff: '', crewAccess: false, pacerIn: false, pacerOut: false, dropBag: false
            }));
            setLegs(newLegs);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between items-center">
                 <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">Course Details</h3>
                    <button onClick={openLegsInfoModal} type="button" aria-label="More information on course details and race plans" className="text-muted hover:text-accent transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </button>
                 </div>
                <div className="flex items-center gap-4">
                     <Button onClick={openAidStationModal} variant="secondary" className="!text-xs !py-1.5 !px-3">Edit Aid Station Templates</Button>
                    <div className="inline-flex rounded-md shadow-sm">
                        <button onClick={() => setIsLegMode(false)} className={`px-4 py-2 text-sm font-medium border border-slate-600 rounded-l-lg ${!isLegMode ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            Simple
                        </button>
                        <button onClick={() => setIsLegMode(true)} className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-slate-600 rounded-r-lg ${isLegMode ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            By Legs
                        </button>
                    </div>
                </div>
            </div>
            
            {!isLegMode && (
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Total gain (m)" type="number" value={simpleGain} onChange={e => setSimpleGain(+e.target.value)} />
                    <Input label="Total loss (m)" type="number" value={simpleLoss} onChange={e => setSimpleLoss(+e.target.value)} />
                    <Select label="Default terrain" value={simpleTerrain} onChange={e => setSimpleTerrain(e.target.value as Terrain)}>
                        {terrains.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </Select>
                 </div>
            )}

            {isLegMode && (
                <>
                    <div className="border border-slate-700 rounded-lg p-3 space-y-4 bg-slate-900/30">
                        <h3 className="text-base font-semibold text-accent">Create Legs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-2 flex flex-col">
                                 <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-muted">From Distances List</label>
                                    <button onClick={openFromDistInfoModal} type="button" aria-label="More information on creating legs from a list" className="text-muted hover:text-accent transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <Input placeholder="e.g. 12.6, 13.3, 11.5..." value={pasteText} onChange={e => setPasteText(e.target.value)}/>
                                <Button onClick={buildFromPaste} className="w-full sm:w-auto">Build Legs from List</Button>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium text-muted">Split Total Distance Evenly</label>
                                <Input type="number" min="1" placeholder="e.g. 6" value={splitCount} onChange={e => setSplitCount(+e.target.value)} />
                                <Button onClick={splitEvenly} className="w-full sm:w-auto">Split into {splitCount} Legs</Button>
                            </div>
                        </div>
                        <div className="pt-2">
                             <Select label="Default terrain for new legs" value={defaultTerrain} onChange={e => setDefaultTerrain(e.target.value as Terrain)}>
                                {terrains.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                        <h3 className="text-base font-semibold text-text">
                            {legs.length > 0 
                                ? `Edit Legs (${legs.length})` 
                                : <span className="text-muted font-normal">No legs defined. Use tools above or add one manually.</span>
                            }
                        </h3>
                        <div className="flex flex-shrink-0 gap-2 items-center">
                            <Button onClick={addLeg}>Add Leg</Button>
                            {legs.length > 0 && <Button onClick={() => setLegs([])} variant="danger">Clear All</Button>}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <Button onClick={onOpenMentalStrategy} variant="secondary">Mental Strategy</Button>
                        <div className="relative inline-block text-left" ref={autoFillRef}>
                            <div>
                                <Button
                                    onClick={() => setIsAutoFillOpen(prev => !prev)}
                                    disabled={legs.length === 0}
                                    className="inline-flex justify-center w-full items-center"
                                >
                                    Auto-fill Notes
                                    <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </Button>
                            </div>
                            {isAutoFillOpen && (
                                <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 p-4 space-y-3">
                                    <div className="text-sm font-semibold text-text">Select note types to fill:</div>
                                    <label className="flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white">
                                        <input type="checkbox" checked={autoFillTargets.runner} onChange={() => handleAutoFillTargetChange('runner')} className="h-4 w-4 rounded accent-accent bg-slate-800 border-slate-600"/>
                                        <span>Runner Notes</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white">
                                        <input type="checkbox" checked={autoFillTargets.crew} onChange={() => handleAutoFillTargetChange('crew')} className="h-4 w-4 rounded accent-accent bg-slate-800 border-slate-600"/>
                                        <span>Crew Notes</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white">
                                        <input type="checkbox" checked={autoFillTargets.pacer} onChange={() => handleAutoFillTargetChange('pacer')} className="h-4 w-4 rounded accent-accent bg-slate-800 border-slate-600"/>
                                        <span>Pacer Cards</span>
                                    </label>
                                    <Button onClick={handleApplyAutoFill} variant="primary" className="w-full mt-2">
                                        Apply
                                    </Button>
                                </div>
                            )}
                        </div>
                        <button onClick={openAutoNotesInfoModal} type="button" aria-label="More information on auto-fill notes logic" className="text-muted hover:text-accent transition-colors p-1 rounded-full hover:bg-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {legs.length > 0 && (
                         <div className="space-y-3">
                            {(() => {
                                let isPacerActive = false;
                                return legs.map((leg, idx) => {
                                    if (leg.pacerIn) isPacerActive = true;
                                    const pacerIsOnThisLeg = isPacerActive;
                                    
                                    const pacerNotesElement = pacerIsOnThisLeg ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start">
                                                <label className="text-xs text-muted pt-1">Pacer Notes (for pacer cards)</label>
                                                <div className="text-xs text-slate-500 text-right">
                                                    <div>{(leg.pacerNotes || '').length} / 250 chars</div>
                                                    <div>{(leg.pacerNotes || '').split('\n').length} / 6 lines</div>
                                                </div>
                                            </div>
                                            <textarea
                                                value={leg.pacerNotes || ''}
                                                onChange={e => {
                                                    let value = e.target.value;
                                                    const lines = value.split('\n');
                                                    if (lines.length > 6) {
                                                        value = lines.slice(0, 6).join('\n');
                                                    }
                                                    updateLeg(leg.id, 'pacerNotes', value);
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && (e.target as HTMLTextAreaElement).value.split('\n').length >= 6) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="w-full h-24 bg-input border border-slate-600 rounded-md p-2 text-sm focus:ring-accent focus:border-accent"
                                                maxLength={250}
                                            />
                                        </div>
                                    ) : null;
                                    
                                    if (leg.pacerOut) isPacerActive = false;

                                    return (
                                        <div key={leg.id} className="bg-panel/50 border border-slate-700 rounded-lg p-3 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => onFocusLeg(leg.id)} title="Focus on this leg in the plan" className="text-muted hover:text-accent transition-colors p-1 rounded-full hover:bg-slate-700">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                    </button>
                                                    <h4 className="font-semibold text-lg">Leg {idx + 1}</h4>
                                                </div>
                                                <Button onClick={() => deleteLeg(leg.id)} variant="danger" className="!px-2 !py-1 !text-xs !rounded-md">Delete</Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                                <Input label="Leg Name (e.g., Hope Pass)" value={leg.name || ''} onChange={e => updateLeg(leg.id, 'name', e.target.value)} />
                                                <Input label="Distance (km)" type="number" step="0.1" value={leg.dist} onChange={e => updateLeg(leg.id, 'dist', +e.target.value)} />
                                                <Input label="Gain (m)" type="number" value={leg.gain} onChange={e => updateLeg(leg.id, 'gain', +e.target.value)} />
                                                <Input label="Loss (m)" type="number" value={leg.loss} onChange={e => updateLeg(leg.id, 'loss', +e.target.value)} />
                                                <Select label="Terrain" value={leg.terrain} onChange={e => updateLeg(leg.id, 'terrain', e.target.value as Terrain)}>
                                                    {terrains.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                                                </Select>
                                                <div>
                                                    <label className="text-sm font-medium text-muted block mb-1">Stop (mins)</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input type="number" min="0" value={leg.stop} onChange={e => updateLeg(leg.id, 'stop', +e.target.value)} />
                                                        {isSleepPlanned && (
                                                            <div className="relative">
                                                                <Input type="number" min="0" step="5" value={leg.sleepMinutes || 0} onChange={e => updateLeg(leg.id, 'sleepMinutes', +e.target.value)} />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">sleep</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <Button onClick={() => setTuningLeg(leg)} variant="secondary" className="!text-xs !py-1.5 !px-3">Fine Tune Terrain</Button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/50">
                                                <Checkbox leg={leg} field="crewAccess" label="Crew" updateLeg={updateLeg} />
                                                <Checkbox leg={leg} field="dropBag" label="Drop Bag" updateLeg={updateLeg} />
                                                <Checkbox leg={leg} field="pacerIn" label="Pacer In" updateLeg={updateLeg} />
                                                <Checkbox leg={leg} field="pacerOut" label="Pacer Out" updateLeg={updateLeg} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted">Runner Notes (for runner cards)</label>
                                                    <textarea value={leg.runnerNotes || ''} onChange={e => updateLeg(leg.id, 'runnerNotes', e.target.value)} className="w-full h-16 bg-input border border-slate-600 rounded-md p-2 text-sm focus:ring-accent focus:border-accent" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted">Crew Notes (for full plan)</label>
                                                    <textarea value={leg.notes || ''} onChange={e => updateLeg(leg.id, 'notes', e.target.value)} className="w-full h-24 bg-input border border-slate-600 rounded-md p-2 text-sm focus:ring-accent focus:border-accent" />
                                                </div>
                                                {pacerNotesElement}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
