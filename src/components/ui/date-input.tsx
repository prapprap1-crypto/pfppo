import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string; // ISO format yyyy-mm-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Date input that displays dd/mm/yyyy format.
 * Internally stores value as yyyy-mm-dd for compatibility.
 */
export function DateInput({ value, onChange, placeholder = 'dd/mm/yyyy', className = '' }: DateInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const formatDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const displayValue = formatDisplay(value);

  const handleClick = () => {
    hiddenRef.current?.showPicker?.();
    hiddenRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Visible display */}
      <div
        onClick={handleClick}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-muted/50 transition-colors items-center gap-2"
      >
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || placeholder}
        </span>
      </div>
      {/* Hidden native date picker */}
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        tabIndex={-1}
      />
    </div>
  );
}
