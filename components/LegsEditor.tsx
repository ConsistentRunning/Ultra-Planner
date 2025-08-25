

import React, { useState, useRef, useEffect } from 'react';
import { Leg, Terrain, TerrainSegment } from '../types';
import { Button } from './ui/Button';
import { Input, Select, RangeInput } from './ui/Input';
import { formatMinutes, getFatigueReset } from '../utils';

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
    openAidStationModal: () => void;
    setTuningLeg: (leg: Leg | null) => void;
    onFocusLeg: (legId: string) => void;
    onAutoFillNotes: (targets: { runner: boolean; crew: boolean; pacer: boolean; }) => void;
    onOpenMentalStrategy: () => void;
}

const terrains: Terrain[] = ["road", "smooth", "mixed", "technical", "sandy"];

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
    distanceKm, isSleepPlanned, openLegsInfoModal, openAutoNotesInfoModal, openAidStationModal, setTuningLeg, onFocusLeg,
    onAutoFillNotes, onOpenMentalStrategy
}) => {
    const [pasteText, setPasteText] = useState("12.6, 13.3, 11.5, 16.4, 12.3");
    const [splitCount, setSplitCount] = useState(6);
    const [defaultTerrain, setDefaultTerrain] = useState<Terrain>('mixed');
    const [isAutoFillOpen, setIsAutoFillOpen] = useState(false);
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

    const handleAutoFill = (targets: { runner: boolean; crew: boolean; pacer: boolean; }) => {
        onAutoFillNotes(targets);
        setIsAutoFillOpen(false);
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
        const newLegs = pasteText.split(/[, ]+/).map(x => +x).filter(x => x > 0).map(dist => ({
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
                        {terrains.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                 </div>
            )}

            {isLegMode && (
                <>
                    <div className="border border-slate-700 rounded-lg p-3 space-y-4 bg-slate-900/30">
                        <h3 className="text-base font-semibold text-accent">Create Legs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium text-muted">From Distances List</label>
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
                                {terrains.map(t => <option key={t} value={t}>{t}</option>)}
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
                                <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleAutoFill({ runner: true, crew: true, pacer: true }); }} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600 rounded-t-md">Fill All Notes</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleAutoFill({ runner: true, crew: false, pacer: false }); }} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600">Fill Runner Notes</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleAutoFill({ runner: false, crew: true, pacer: false }); }} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600">Fill Crew Notes</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleAutoFill({ runner: false, crew: false, pacer: true }); }} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600 rounded-b-md">Fill Pacer Cards</a>
                                    </div>
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
                                        <div key={leg.id} className="bg-slate-800 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-text">Leg {idx + 1}</h4>
                                                <div className="flex items-center">
                                                    <Button onClick={() => onFocusLeg(leg.id)} title="View on plan" variant="secondary" className="!w-7 !h-7 !p-0 flex items-center justify-center !rounded-full mr-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </Button>
                                                    <Button onClick={() => deleteLeg(leg.id)} variant="danger" className="!w-7 !h-7 !p-0 flex items-center justify-center !rounded-full">✕</Button>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end">
                                                <Input label="Aid Station Name (at end of leg)" placeholder={`Aid ${idx + 1}`} value={leg.name || ''} onChange={e => updateLeg(leg.id, 'name', e.target.value)} />
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 pb-1">
                                                    <Checkbox leg={leg} field="crewAccess" label="Crew" updateLeg={updateLeg} />
                                                    <Checkbox leg={leg} field="pacerIn" label="Pacer In" updateLeg={updateLeg} />
                                                    <Checkbox leg={leg} field="pacerOut" label="Pacer Out" updateLeg={updateLeg} />
                                                    <Checkbox leg={leg} field="dropBag" label="Drop Bag" updateLeg={updateLeg} />
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-6 gap-4">
                                                <div className="col-span-6 sm:col-span-2"><Input label="Dist (km)" type="number" step="0.1" value={leg.dist} onChange={e => updateLeg(leg.id, 'dist', +e.target.value)} /></div>
                                                <div className="col-span-3 sm:col-span-2"><Input label="Gain (m)" type="number" value={leg.gain} onChange={e => updateLeg(leg.id, 'gain', +e.target.value)} /></div>
                                                <div className="col-span-3 sm:col-span-2"><Input label="Loss (m)" type="number" value={leg.loss} onChange={e => updateLeg(leg.id, 'loss', +e.target.value)} /></div>
                                                <div className="col-span-6 sm:col-span-3">
                                                    <Select label="Terrain" value={leg.terrain} onChange={e => updateLeg(leg.id, 'terrain', e.target.value as Terrain)}>
                                                        {terrains.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </Select>
                                                </div>
                                                <div className="col-span-6 sm:col-span-3"><Input label="Stop (min)" type="number" value={leg.stop} onChange={e => updateLeg(leg.id, 'stop', +e.target.value)} /></div>
                                            </div>
                                            
                                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                                                <Button 
                                                    onClick={() => setTuningLeg(leg)}
                                                    variant={leg.terrainSegments && leg.terrainSegments.length > 0 ? 'primary' : 'secondary'}
                                                    className={`!text-xs !py-1.5 !px-3 ${leg.terrainSegments && leg.terrainSegments.length > 0 ? '!bg-ok !hover:bg-green-600' : ''}`}
                                                >
                                                    {leg.terrainSegments && leg.terrainSegments.length > 0 ? '✓ Terrain Tuned' : 'Fine Tune Terrain'}
                                                </Button>
                                            </div>

                                            {isSleepPlanned && (
                                            <div className="mt-4 pt-3 border-t border-slate-700">
                                                <label className="block text-sm font-medium text-muted">Sleep Strategy (at end of leg)</label>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <RangeInput 
                                                        min="0" max="270" step="15" 
                                                        value={leg.sleepMinutes || 0} 
                                                        onChange={e => updateLeg(leg.id, 'sleepMinutes', +e.target.value)} 
                                                        className="flex-grow"
                                                    />
                                                    <div className="w-40 text-right">
                                                        <span className="font-mono font-semibold text-accent">{formatMinutes(leg.sleepMinutes || 0)}</span>
                                                        {(leg.sleepMinutes || 0) > 0 && (
                                                            <span className="block text-xs text-green-400">
                                                                Fatigue Reset: {(getFatigueReset(leg.sleepMinutes || 0) * 100).toFixed(0)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            )}
                                            
                                            <div className="mt-3 space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted">Crew Notes (for full plan PDF)</label>
                                                    <textarea value={leg.notes || ''} onChange={e => updateLeg(leg.id, 'notes', e.target.value)} className="w-full h-24 bg-input border border-slate-600 rounded-md p-2 text-sm focus:ring-accent focus:border-accent" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <label className="text-xs text-muted pt-1">Personal Notes (for runner cards)</label>
                                                        <div className="text-xs text-slate-500 text-right">
                                                            <div>{(leg.runnerNotes || '').length} / 250 chars</div>
                                                            <div>{(leg.runnerNotes || '').split('\n').length} / 6 lines</div>
                                                        </div>
                                                    </div>
                                                    <textarea 
                                                        value={leg.runnerNotes || ''} 
                                                        onChange={e => {
                                                            let value = e.target.value;
                                                            const lines = value.split('\n');
                                                            if (lines.length > 6) {
                                                                value = lines.slice(0, 6).join('\n');
                                                            }
                                                            updateLeg(leg.id, 'runnerNotes', value);
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