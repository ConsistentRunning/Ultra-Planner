
import React from 'react';

const baseInputClasses = "w-full bg-input border border-slate-600 text-text p-2 rounded-md outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:bg-slate-800 disabled:cursor-not-allowed";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-muted mb-1">{label}</label>}
        <input id={id} className={`${baseInputClasses} ${className || ''}`} {...props} />
    </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, children, className, ...props }) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-muted mb-1">{label}</label>}
        <select id={id} className={`${baseInputClasses} ${className || ''}`} {...props}>
            {children}
        </select>
    </div>
);

interface RangeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const RangeInput: React.FC<RangeInputProps> = ({ label, id, className, ...props }) => (
    <div className={className}>
        {label && <label htmlFor={id} className="block text-sm font-medium text-muted mb-1">{label}</label>}
        <input 
            type="range" 
            id={id} 
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent disabled:accent-slate-600" 
            {...props} 
        />
    </div>
);

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    onFileSelect: (file: File) => void;
}

export const FileInput: React.FC<FileInputProps> = ({ label, id, onFileSelect, ...props }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-muted mb-1">{label}</label>}
            <input 
              id={id}
              type="file" 
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-text hover:file:bg-slate-600"
              onChange={handleChange}
              {...props} 
            />
        </div>
    );
};