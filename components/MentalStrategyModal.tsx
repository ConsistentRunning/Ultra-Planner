import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { HELPER_NOTE_MODULES, HelperModuleKey } from '../utils';

interface MentalStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selected: HelperModuleKey[]) => void;
    initialSelected: HelperModuleKey[];
}

export const MentalStrategyModal: React.FC<MentalStrategyModalProps> = ({ isOpen, onClose, onSave, initialSelected }) => {
    const [selected, setSelected] = useState<HelperModuleKey[]>(initialSelected);

    useEffect(() => {
        if (isOpen) {
            setSelected(initialSelected);
        }
    }, [isOpen, initialSelected]);
    
    const handleToggle = (module: HelperModuleKey) => {
        setSelected(prev => 
            prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
        );
    };

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Mental Strategy Helpers" size="3xl">
            <div className="space-y-4">
                <p className="text-sm text-muted">
                    Select one or more "helper" modules. When you use the "Auto-fill Notes" feature, it will intelligently replace some of the default mental cues with targeted notes based on your selections.
                </p>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-4">
                    {Object.entries(HELPER_NOTE_MODULES).map(([key, module]) => (
                        <div key={key} className="flex items-start gap-4 p-3 bg-slate-800 rounded-lg">
                            <input
                                type="checkbox"
                                id={`module-${key}`}
                                checked={selected.includes(key as HelperModuleKey)}
                                onChange={() => handleToggle(key as HelperModuleKey)}
                                className="h-5 w-5 rounded border-slate-500 bg-slate-700 text-accent focus:ring-accent mt-1 flex-shrink-0"
                            />
                            <div>
                                <label htmlFor={`module-${key}`} className="font-semibold text-accent2 cursor-pointer">{module.name}</label>
                                <p className="text-sm text-slate-400">{module.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} variant="primary">Save Strategy</Button>
                </div>
            </div>
        </Modal>
    );
};
