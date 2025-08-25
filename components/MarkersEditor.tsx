import React, { useState } from 'react';
import { Marker, MarkerIcon, markerIcons } from '../types';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Card } from './ui/Card';

interface MarkersEditorProps {
    markers: Marker[];
    setMarkers: (markers: Marker[]) => void;
}

export const MarkersEditor: React.FC<MarkersEditorProps> = ({ markers, setMarkers }) => {
    const [km, setKm] = useState('');
    const [note, setNote] = useState('');
    const [icon, setIcon] = useState<MarkerIcon>('water');

    const addMarker = (e: React.FormEvent) => {
        e.preventDefault();
        const kmNum = parseFloat(km);
        if (!kmNum || kmNum < 0 || !note) {
            alert('Please enter a valid distance and note.');
            return;
        }
        const newMarker: Marker = {
            id: Date.now().toString(),
            km: kmNum,
            note,
            icon
        };
        setMarkers([...markers, newMarker].sort((a, b) => a.km - b.km));
        setKm('');
        setNote('');
    };

    const deleteMarker = (id: string) => {
        setMarkers(markers.filter(marker => marker.id !== id));
    };

    return (
        <Card>
            <div className="space-y-4">
                <h3 className="text-xl font-bold">Course Markers</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Add Marker Form */}
                    <form onSubmit={addMarker} className="space-y-3 border border-slate-700 rounded-lg p-4 bg-slate-900/30">
                        <h4 className="font-semibold text-accent">Add a New Marker</h4>
                        <div className="grid grid-cols-2 gap-4">
                             <Input 
                                label="Distance (km)" 
                                type="number" 
                                step="0.1"
                                placeholder="e.g., 21.1"
                                value={km} 
                                onChange={e => setKm(e.target.value)}
                                required
                            />
                            <Select label="Icon" value={icon} onChange={e => setIcon(e.target.value as MarkerIcon)}>
                                {markerIcons.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </Select>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <label htmlFor="marker-note" className="text-sm font-medium text-muted">Note</label>
                                <span className="text-xs text-slate-500">{note.length} / 15</span>
                            </div>
                            <input
                                id="marker-note"
                                className="w-full bg-input border border-slate-600 text-text p-2 rounded-md outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                                type="text"
                                placeholder="e.g., 'Last water'"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                required
                                maxLength={15}
                            />
                        </div>
                        <Button type="submit" variant="primary" className="w-full">Add Marker</Button>
                    </form>

                    {/* Existing Markers List */}
                    <div className="space-y-2">
                         <h4 className="font-semibold text-text">
                            {markers.length > 0 ? `Current Markers (${markers.length})` : 'No markers added yet.'}
                         </h4>
                        {markers.length > 0 && (
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 -mr-2 rounded-lg border border-slate-700 p-3">
                                {markers.map(marker => (
                                    <div key={marker.id} className="flex items-center justify-between bg-slate-800 p-2 rounded-md text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-accent w-16 text-right">{marker.km.toFixed(1)} km</span>
                                            <span className="text-2xl">{markerIcons.find(i => i.value === marker.icon)?.label.split(' ')[0]}</span>
                                            <span className="text-slate-300 truncate" title={marker.note}>{marker.note}</span>
                                        </div>
                                        <Button onClick={() => deleteMarker(marker.id)} variant="danger" className="!px-2 !py-1 !text-xs !rounded-md">✕</Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};