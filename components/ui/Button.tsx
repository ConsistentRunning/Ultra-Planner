
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'secondary', ...props }) => {
    const baseClasses = "px-4 py-2 text-sm font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";

    const variantClasses = {
        primary: "bg-accent hover:bg-blue-500 text-white focus:ring-accent",
        secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 focus:ring-slate-500",
        danger: "bg-danger hover:bg-red-500 text-white focus:ring-danger",
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};
