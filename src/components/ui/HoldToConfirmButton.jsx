import React, { useState, useRef, useEffect, useCallback } from 'react';
import './HoldToConfirmButton.css';

/**
 * Emil Kowalski Signature Hold-to-Confirm Pattern
 * Replaces accidental destructive clicks with a tactile physical hold gesture.
 * Features clip-path fill animation and instant snap-back on release.
 */
export const HoldToConfirmButton = ({
  onConfirm,
  duration = 1800,
  label = 'Hold to Delete',
  holdingLabel = 'Keep holding...',
  confirmedLabel = 'Confirmed!',
  icon = null,
  className = '',
  variant = 'danger',
  disabled = false,
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const timerRef = useRef(null);

  const startHold = useCallback(() => {
    if (disabled || isConfirmed) return;
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      setIsHolding(false);
      setIsConfirmed(true);
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
      setTimeout(() => {
        setIsConfirmed(false);
      }, 1200);
    }, duration);
  }, [disabled, isConfirmed, duration, onConfirm]);

  const cancelHold = useCallback(() => {
    if (isConfirmed) return;
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isConfirmed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={`htc-btn htc-${variant} ${isHolding ? 'is-holding' : ''} ${isConfirmed ? 'is-confirmed' : ''} ${className}`}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          if (!isHolding) startHold();
        }
      }}
      onKeyUp={cancelHold}
      disabled={disabled}
      title={`${label} (Press and hold for 1.8s)`}
      style={{ '--hold-duration': `${duration}ms` }}
    >
      {/* Background fill track using clip-path */}
      <span className="htc-fill" aria-hidden="true" />

      {/* Button content label */}
      <span className="htc-content">
        {icon && <span className="htc-icon">{icon}</span>}
        <span className="htc-label">
          {isConfirmed ? confirmedLabel : isHolding ? holdingLabel : label}
        </span>
      </span>
    </button>
  );
};

export default HoldToConfirmButton;
