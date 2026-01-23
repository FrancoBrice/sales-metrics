"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface TooltipContentProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function TooltipContent({ title, children, className = "" }: TooltipContentProps) {
  return (
    <div className={`ui-tooltip-content ${className}`}>
      {title && <div className="ui-tooltip-header">{title}</div>}
      <div className="ui-tooltip-body">
        {children}
      </div>
    </div>
  );
}

interface TooltipRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  valueColor?: string;
  className?: string;
}

export function TooltipRow({ label, value, valueColor, className = "" }: TooltipRowProps) {
  return (
    <div className={`ui-tooltip-row ${className}`}>
      <span className="ui-tooltip-label">{label}</span>
      <span
        className="ui-tooltip-value"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({
      top: e.clientY - 10,
      left: e.clientX
    });

    if (!isVisible) setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const tooltipElement = isVisible && mounted ? createPortal(
    <div
      className={`tooltip-portal visible`}
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -100%) translateY(-10px)',
      }}
    >
      <div className={className}>
        {content}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </div>
      {tooltipElement}
    </>
  );
}
