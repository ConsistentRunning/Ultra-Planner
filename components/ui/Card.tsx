
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-panel/70 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-lg ${className}`}>
            {children}
        </div>
    );
};
