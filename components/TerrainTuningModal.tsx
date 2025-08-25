import React, { useState, useMemo, useEffect } from 'react';
import { Leg, Terrain, TerrainSegment } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';

interface TerrainTuningModalProps {
    isOpen: boolean;
    onClose: () => void;
    leg: Leg | null;
    onSave: (legId: string, segments: TerrainSegment[]) => void;
}

const terrains: Terrain[] = ["road", "smooth", "mixed", "technical", "sandy"];

export const TerrainTuningModal: React.FC<TerrainTuningModalProps> = ({ isOpen, onClose, leg, onSave }) => {
    const [segments, setSegments] = useState<TerrainSegment[]>([]);

    useEffect(() => {
        if (leg) {
            // Initialize with existing segments, or create a single default one
            if (leg.terrainSegments && leg.terrainSegments.length > 0) {
                setSegments(leg.terrainSegments);
            } else {
                setSegments([{ id: Date.now().toString(), dist: leg.dist, terrain: leg.terrain }]);
            }
        }
    }, [leg]);

    const totalSegmentDistance = useMemo(() => {
        return segments.reduce((total, seg) => total + (seg.dist || 0), 0);
    }, [segments]);

    const distanceMatch = useMemo(() => {
        if (!leg) return false;
        // Use a small tolerance for floating point comparisons
        return Math.abs(totalSegmentDistance - leg.dist) < 0.01;
    }, [totalSegmentDistance, leg]);

    const handleSegmentChange = (id: string, key: 'dist' | 'terrain', value: string | number) => {
        setSegments(currentSegments => currentSegments.map(seg => {
            if (seg.id === id) {
                return { ...seg, [key]: key === 'dist' ? +value : value };
            }
            return seg;
        }));
    };

    const addSegment = () => {
        setSegments(currentSegments => [...currentSegments, {
            id: Date.now().toString(),
            dist: 0,
            terrain: leg?.terrain || 'mixed'
        }]);
    };

    const deleteSegment = (id: string) => {
        setSegments(currentSegments => currentSegments.filter(seg => seg.id !== id));
    };

    const handleSave = () => {
        if (leg && distanceMatch) {
            onSave(leg.id, segments);
        }
    };

    if (!leg) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Fine Tune Terrain for Leg (Total: ${leg.dist.toFixed(2)} km)`} size="3xl">
            <div className="space-y-4">
                <p className="text-sm text-muted">Break this leg into smaller sections with different terrain types. The total distance of all sections must match the leg's total distance.</p>
                <div className="max-h-80 overflow-y-auto pr-2 -mr-2 space-y-3">
                    {segments.map((segment, index) => (
                        <div key={segment.id} className="flex items-end gap-3 p-3 bg-slate-800 rounded-lg">
                            <span className="font-bold text-muted w-12 pt-8">#{index + 1}</span>
                            <div className="flex-grow">
                                <Input
                                    label="Distance (km)"
                                    type="number"
                                    step="0.1"
                                    value={segment.dist}
                                    onChange={e => handleSegmentChange(segment.id, 'dist', e.target.value)}
                                />
                            </div>
                            <div className="flex-grow">
                                <Select
                                    label="Terrain"
                                    value={segment.terrain}
                                    onChange={e => handleSegmentChange(segment.id, 'terrain', e.target.value as Terrain)}
                                >
                                    {terrains.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                            </div>
                            <Button onClick={() => deleteSegment(segment.id)} variant="danger" className="!px-3 !py-2 !text-sm !rounded-md h-10 mb-px flex-shrink-0">
                                ✕
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                    <div>
                        <Button onClick={addSegment}>Add Segment</Button>
                    </div>
                    <div className="text-right">
                        <p className={`font-mono font-semibold ${distanceMatch ? 'text-ok' : 'text-danger'}`}>
                            Segment Total: {totalSegmentDistance.toFixed(2)} / {leg.dist.toFixed(2)} km
                        </p>
                        {!distanceMatch && (
                            <p className="text-xs text-danger">Total segment distance must match the leg distance.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} variant="primary" disabled={!distanceMatch}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
};
