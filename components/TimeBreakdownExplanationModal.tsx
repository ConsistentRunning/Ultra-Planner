import React from 'react';
import { Modal } from './ui/Modal';
import { ComputationResult } from '../types';
import { fmtTime } from '../utils';

interface TimeBreakdownExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    computation: ComputationResult | null;
    referenceDistance: 'race' | '10k' | 'half' | 'marathon' | '50k';
    referenceTimeStr: string;
}

const breakdownDescriptions: { [key: string]: string } = {
    elevation: 'Time lost to climbing and the muscular impact of descents.',
    terrain: 'Extra time from running on non-road surfaces.',
    fatigue: 'Compounding slowdown from cumulative muscular and metabolic effort.',
    weather: 'Physiological cost of running in the specified conditions.',
    night: 'Slowdown from reduced visibility and navigation challenges in the dark.',
    stops: 'Total planned time spent stationary at aid stations.',
};

export const TimeBreakdownExplanationModal: React.FC<TimeBreakdownExplanationModalProps> = ({ isOpen, onClose, computation, referenceDistance, referenceTimeStr }) => {
    if (!computation) return null;

    const { flatTime, finalTime, addedTimes } = computation;
    
    const breakdownItems = [
        { key: 'elevation', label: 'Elevation', time: addedTimes.elevation },
        { key: 'terrain', label: 'Terrain', time: addedTimes.terrain },
        { key: 'fatigue', label: 'Fatigue', time: addedTimes.fatigue },
        { key: 'weather', label: 'Weather', time: addedTimes.weather },
        { key: 'night', label: 'Night', time: addedTimes.night },
        { key: 'stops', label: 'Stops', time: addedTimes.stops },
    ].filter(item => Math.abs(item.time) > 1).sort((a,b) => b.time - a.time);

    const totalPenalties = breakdownItems.reduce((sum, item) => sum + item.time, 0);

    const getRefDistLabel = (dist: string) => {
        switch (dist) {
            case 'race': return 'Race Distance';
            case '10k': return '10k';
            case 'half': return 'Half Marathon';
            case 'marathon': return 'Marathon';
            case '50k': return '50k';
            default: return '';
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="How Your Time is Calculated" size="3xl">
            <div className="space-y-6 text-slate-300 prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-text prose-strong:text-accent2">
                <div>
                    <h3>1. The Baseline: Your Flat-Ground Fitness</h3>
                    <p>
                        The calculation starts with your reference performance: a <strong>{referenceTimeStr} {getRefDistLabel(referenceDistance)}</strong>. We use the Riegel endurance model to translate this into a theoretical "best-case" time for this specific race distance, assuming a perfectly flat course.
                    </p>
                    <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg mt-2">
                        <span className="font-semibold">Calculated Flat Time for Race</span>
                        <span className="font-mono text-lg font-bold text-sky-400">{fmtTime(flatTime)}</span>
                    </div>
                </div>

                <div>
                    <h3>2. The Real World: Adding Time Penalties</h3>
                    <p>
                        Next, the simulation adds time based on the specific challenges of your course and race plan. Here are the major factors slowing you down:
                    </p>
                    <div className="space-y-2 mt-3">
                        {breakdownItems.map(item => (
                            <div key={item.key} className="flex justify-between items-start gap-4">
                                <div className="flex-shrink-0">
                                    <strong className="text-slate-200">{item.label}</strong>
                                    <p className="text-xs text-muted">{breakdownDescriptions[item.key]}</p>
                                </div>
                                <span className="font-mono text-lg font-semibold text-orange-400 whitespace-nowrap pt-1">+ {fmtTime(item.time)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3>3. The Final Calculation</h3>
                    <p>
                        By combining your flat-ground fitness with the calculated time penalties, we arrive at your final predicted finish time.
                    </p>
                    <div className="bg-slate-800 p-4 rounded-lg mt-2 space-y-2 text-base">
                        <div className="flex justify-between items-center">
                            <span>Baseline Flat Time</span>
                            <span className="font-mono">{fmtTime(flatTime)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Total Time Penalties</span>
                            <span className="font-mono">+ {fmtTime(totalPenalties)}</span>
                        </div>
                        <hr className="border-slate-600 my-2" />
                        <div className="flex justify-between items-center text-xl">
                            <strong className="text-accent2">Predicted Finish Time</strong>
                            <strong className="font-mono text-accent2">{fmtTime(finalTime)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
