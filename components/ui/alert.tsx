import React from 'react';

export interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'error', title, message }) => {
  const typeStyles = {
    error: 'bg-rose-950/50 border-rose-800/80 text-rose-300',
    success: 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300',
    warning: 'bg-amber-950/50 border-amber-800/80 text-amber-300',
    info: 'bg-blue-950/50 border-blue-800/80 text-blue-300',
  };

  return (
    <div className={`p-4 rounded-lg border text-sm font-medium ${typeStyles[type]} shadow-sm`}>
      {title && <h4 className="font-semibold mb-1 text-base">{title}</h4>}
      <p>{message}</p>
    </div>
  );
};
