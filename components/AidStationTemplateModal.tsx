
import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface AidStationTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (checklist: string[], feedback: string[]) => void;
    initialChecklist: string[];
    initialFeedback: string[];
}

const TemplateEditor: React.FC<{ title: string; items: string[]; setItems: (items: string[]) => void; }> = ({ title, items, setItems }) => {
    const text = items.join('\n');
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setItems(e.target.value.split('\n'));
    };
    return (
        <div className="space-y-2">
            <label className="font-semibold text-lg text-accent">{title}</label>
            <p className="text-sm text-muted">Enter one item per line.</p>
            <textarea
                value={text}
                onChange={handleChange}
                rows={5}
                className="w-full bg-input border border-slate-600 rounded-md p-2 text-sm focus:ring-accent focus:border-accent"
            />
        </div>
    );
};

export const AidStationTemplateModal: React.FC<AidStationTemplateModalProps> = ({ isOpen, onClose, onSave, initialChecklist, initialFeedback }) => {
    const [checklist, setChecklist] = useState(initialChecklist);
    const [feedback, setFeedback] = useState(initialFeedback);

    useEffect(() => {
        if (isOpen) {
            setChecklist(initialChecklist);
            setFeedback(initialFeedback);
        }
    }, [isOpen, initialChecklist, initialFeedback]);

    const handleSave = () => {
        onSave(
            checklist.filter(item => item.trim() !== ''),
            feedback.filter(item => item.trim() !== '')
        );
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Aid Station Templates" size="3xl">
            <div className="space-y-6">
                <TemplateEditor title="Aid Station Checklist" items={checklist} setItems={setChecklist} />
                <TemplateEditor title="Post-Leg Feedback Form" items={feedback} setItems={setFeedback} />
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} variant="primary">Save Templates</Button>
                </div>
            </div>
        </Modal>
    );
};