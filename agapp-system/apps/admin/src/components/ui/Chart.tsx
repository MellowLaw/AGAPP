'use client';

import React, { useRef, useState } from 'react';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  className?: string;
  valueFormatter?: (n: number) => string;
  maxValue?: number; // optional normalization cap
  sort?: 'asc' | 'desc' | 'none';
  showAxis?: boolean; // show 0/25/50/75/100 ticks
  onBarClick?: (label: string, value: number) => void;
  selectedLabel?: string;
  axisOnHover?: boolean;
  labelPosition?: 'side' | 'top';
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  className = '', 
  valueFormatter, 
  maxValue, 
  sort = 'none', 
  showAxis = false, 
  onBarClick, 
  selectedLabel, 
  axisOnHover = false,
  labelPosition = 'top' // default to top to prevent truncation
}) => {
  const sorted = sort === 'none' ? data : [...data].sort((a, b) => sort === 'asc' ? a.value - b.value : b.value - a.value);
  const maxRef = typeof maxValue === 'number' ? Math.max(1, maxValue) : Math.max(1, ...sorted.map(d => d.value));
  const [hovered, setHovered] = useState(false);
  const axisVisible = showAxis || (axisOnHover && hovered);
  
  return (
    <div className={`w-full ${className} relative`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {title && <p className="text-sm font-medium text-[#737373] mb-4">{title}</p>}
      {axisVisible && (
        <div
          className="relative h-5 mb-2"
          style={{
            marginLeft: labelPosition === 'side' ? 108 : 0, 
            marginRight: labelPosition === 'side' ? 48 : 0, 
          }}
        >
          {[0,25,50,75,100].map((t) => (
            <div key={t} className="absolute top-0 -translate-x-1/2 text-[10px] text-[#a3a3a3]" style={{ left: `${t}%` }}>
              <div className="w-px h-2 bg-[#e5e5e5] mx-auto" />
              <div>{t}%</div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-4">
        {sorted.map((item, index) => {
          if (labelPosition === 'top') {
            return (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#1a1a1a] truncate pr-4">{item.label}</span>
                  <span className="font-bold text-[#1a1a1a]">
                    {valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString()}
                  </span>
                </div>
                <div 
                  className={`w-full h-3.5 bg-[#f5f5f5] rounded-full overflow-hidden transition-all duration-300 ${onBarClick ? 'cursor-pointer hover:opacity-90' : ''} ${selectedLabel===item.label ? 'ring-2 ring-[#1a1a1a]' : ''}`}
                  onClick={onBarClick ? () => onBarClick(item.label, item.value) : undefined}
                  role={onBarClick ? 'button' : undefined}
                  aria-pressed={selectedLabel===item.label}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${(item.value / maxRef) * 100}%`,
                      backgroundColor: item.color || '#2563eb'
                    }}
                    title={`${item.label}: ${valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString()} (${Math.round((item.value / maxRef) * 100)}%)`}
                  />
                </div>
              </div>
            );
          }
          
          return (
            <div key={index} className="flex items-center gap-3">
              <span className="w-24 text-xs text-[#737373] truncate" title={item.label}>{item.label}</span>
              <div 
                className={`flex-1 h-6 bg-[#f5f5f5] rounded-full overflow-hidden transition-all duration-300 ${onBarClick ? 'cursor-pointer' : ''} ${selectedLabel===item.label ? 'ring-2 ring-[#1a1a1a]' : ''}`}
                onClick={onBarClick ? () => onBarClick(item.label, item.value) : undefined}
                role={onBarClick ? 'button' : undefined}
                aria-pressed={selectedLabel===item.label}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(item.value / maxRef) * 100}%`,
                    backgroundColor: item.color || '#2563eb'
                  }}
                  title={`${item.label}: ${valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString()} (${Math.round((item.value / maxRef) * 100)}%)`}
                />
              </div>
              <span className="w-12 text-xs text-[#1a1a1a] font-medium text-right">{valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface LineChartProps {
  data: { month: string; reports: number; requests: number }[];
  className?: string;
  height?: number;
  showAxes?: boolean;
  showTooltip?: boolean;
  smooth?: boolean;
  area?: boolean;
  yTicks?: number; // how many horizontal grid bands (default 4 => 0,25,50,75,100)
}

export const LineChart: React.FC<LineChartProps> = ({ data, className = '', height = 220, showAxes = true, showTooltip = true, smooth = true, area = true, yTicks = 4 }) => {
  const maxValue = Math.max(1, ...data.map(d => Math.max(d.reports, d.requests)));
  const padding = 24;
  // Use a wide internal coordinate system so we can stretch to container width cleanly
  const chartWidth = 1000;
  const chartHeight = height - padding * 2;
  const xPadding = 80; // horizontal padding so first/last labels aren't cut
  const innerWidth = chartWidth - xPadding * 2;
  
  const getX = (index: number) => xPadding + (index / (data.length - 1)) * innerWidth;
  const getY = (value: number) => chartHeight - ((value / maxValue) * chartHeight) + padding;
  
  const reportsPoints = data.map((d, i) => `${getX(i)},${getY(d.reports)}`).join(' ');
  const requestsPoints = data.map((d, i) => `${getX(i)},${getY(d.requests)}`).join(' ');

  // Smooth path helpers
  type Pt = { x: number; y: number };
  const ptsReports: Pt[] = data.map((d, i) => ({ x: getX(i), y: getY(d.reports) }));
  const ptsRequests: Pt[] = data.map((d, i) => ({ x: getX(i), y: getY(d.requests) }));
  const line = (p: Pt) => `${p.x},${p.y}`;
  const controlPoint = (current: Pt, previous?: Pt, next?: Pt, reverse = false, t = 0.2): Pt => {
    const p = previous || current;
    const n = next || current;
    const dx = n.x - p.x;
    const dy = n.y - p.y;
    const angle = Math.atan2(dy, dx) + (reverse ? Math.PI : 0);
    const length = Math.hypot(dx, dy) * t;
    return { x: current.x + Math.cos(angle) * length, y: current.y + Math.sin(angle) * length };
  };
  const bezierCommand = (point: Pt, i: number, a: Pt[]) => {
    const cps = controlPoint(a[i - 1], a[i - 2], point);
    const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
    return `C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
  };
  const toPath = (points: Pt[]) => points.reduce((acc, p, i, a) => i === 0 ? `M ${line(p)}` : `${acc} ${bezierCommand(p, i, a)}`, '');
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Nearest-point snapping rather than ratio rounding
    const xs = data.map((_, i) => getX(i));
    let idx = 0;
    let best = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const d = Math.abs(xs[i] - x);
      if (d < best) { best = d; idx = i; }
    }
    setHoverIndex(idx);
  };
  const onLeave = () => setHoverIndex(null);
  
  return (
    <div ref={containerRef} className={`w-full ${className} relative`}>
      <svg 
        viewBox={`0 0 ${chartWidth} ${height}`} 
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {/* Premium filter for drop shadow */}
        <defs>
          <linearGradient id="reportsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
          </linearGradient>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => i / yTicks).map((ratio, i) => (
          <line
            key={i}
            x1={xPadding}
            y1={padding + ratio * chartHeight}
            x2={chartWidth - xPadding}
            y2={padding + ratio * chartHeight}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {showAxes && (
          <>
            <line x1={xPadding} y1={height - padding} x2={chartWidth - xPadding} y2={height - padding} stroke="#e5e5e5" strokeWidth="1" />
            <line x1={xPadding} y1={padding} x2={xPadding} y2={height - padding} stroke="#e5e5e5" strokeWidth="1" />
          </>
        )}
        {/* Area under curves */}
        {area && (
          <>
            <path d={`${smooth ? toPath(ptsRequests) : `M ${requestsPoints.replace(/ /g, ' L ')}`} L ${getX(data.length-1)},${height - padding} L ${getX(0)},${height - padding} Z`} fill="url(#requestsGrad)" />
            <path d={`${smooth ? toPath(ptsReports) : `M ${reportsPoints.replace(/ /g, ' L ')}`} L ${getX(data.length-1)},${height - padding} L ${getX(0)},${height - padding} Z`} fill="url(#reportsGrad)" />
          </>
        )}
        {/* Reports line */}
        {smooth ? (
          <path d={toPath(ptsReports)} fill="none" stroke="#2563eb" strokeWidth="3" filter="url(#shadow)" strokeLinecap="round" />
        ) : (
          <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={reportsPoints} filter="url(#shadow)" strokeLinecap="round" />
        )}
        {data.map((d, i) => (
          <circle
            key={`r-${i}`}
            cx={getX(i)}
            cy={getY(d.reports)}
            r="4"
            fill="#2563eb"
            stroke="white"
            strokeWidth="2"
            className="transition-all duration-200"
          />
        ))}
        
        {/* Requests line */}
        {smooth ? (
          <path d={toPath(ptsRequests)} fill="none" stroke="#16a34a" strokeWidth="3" filter="url(#shadow)" strokeLinecap="round" />
        ) : (
          <polyline fill="none" stroke="#16a34a" strokeWidth="3" points={requestsPoints} filter="url(#shadow)" strokeLinecap="round" />
        )}
        {data.map((d, i) => (
          <circle
            key={`q-${i}`}
            cx={getX(i)}
            cy={getY(d.requests)}
            r="4"
            fill="#16a34a"
            stroke="white"
            strokeWidth="2"
            className="transition-all duration-200"
          />
        ))}
        {/* Hover guide */}
        {hoverIndex !== null && (
          <>
            <line x1={getX(hoverIndex)} y1={padding} x2={getX(hoverIndex)} y2={height - padding} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
          </>
        )}
        
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={height - 2}
            fontSize="12"
            fontWeight="500"
            fill="#737373"
            textAnchor="middle"
          >
            {d.month}
          </text>
        ))}
        {/* Y-axis labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => i / yTicks).map((ratio, i) => (
          <text
            key={`yt-${i}`}
            x={xPadding - 12}
            y={padding + ratio * chartHeight + 4}
            fontSize="10"
            fontWeight="500"
            fill="#a3a3a3"
            textAnchor="end"
          >
            {Math.round((1 - ratio) * maxValue)}
          </text>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#2563eb] shadow-sm" />
          <span className="text-xs font-semibold text-[#525252]">Reports</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#16a34a] shadow-sm" />
          <span className="text-xs font-semibold text-[#525252]">Requests</span>
        </div>
      </div>
      {showTooltip && hoverIndex !== null && (
        <div
          className="absolute -translate-x-1/2 top-0 bg-white border border-[#e5e5e5] text-xs text-[#1a1a1a] rounded-lg p-2.5 shadow-lg z-10 transition-all duration-150"
          style={{ left: `${(getX(hoverIndex) / chartWidth) * 100}%` }}
        >
          <div className="font-bold border-b border-gray-100 pb-1 mb-1">{data[hoverIndex].month}</div>
          <div className="flex justify-between gap-4 text-[#2563eb] font-semibold">
            <span>Reports:</span>
            <span>{data[hoverIndex].reports}</span>
          </div>
          <div className="flex justify-between gap-4 text-[#16a34a] font-semibold">
            <span>Requests:</span>
            <span>{data[hoverIndex].requests}</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  className?: string;
  size?: number; // px
}

export const PieChart: React.FC<PieChartProps> = ({ data, className = '', size = 160 }) => {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  let currentAngle = 0;
  
  return (
    <div className={`flex items-center gap-8 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {data.map((item, index) => {
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = ((startAngle + angle) * Math.PI) / 180;
            
            const x1 = 50 + 42 * Math.cos(startRad);
            const y1 = 50 + 42 * Math.sin(startRad);
            const x2 = 50 + 42 * Math.cos(endRad);
            const y2 = 50 + 42 * Math.sin(endRad);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            if (item.value === 0) return null;
            
            // Draw slice
            return (
              <path
                key={index}
                d={`M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color}
                stroke="white"
                strokeWidth="1.5"
                className="transition-all duration-300 hover:opacity-90"
              />
            );
          })}
          {/* Centered white mask circle for Donut effect */}
          <circle cx="50" cy="50" r="26" fill="white" />
        </svg>
        {/* Text inside Donut Hole */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-[#1a1a1a]">{total === 1 && data.every(d => d.value === 0) ? 0 : total}</span>
          <span className="text-[10px] text-[#737373] uppercase tracking-wider font-semibold">Total</span>
        </div>
      </div>
      
      <div className="space-y-2.5">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-xs">
            <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[#525252] font-medium min-w-[80px]">{item.label}</span>
            <span className="text-[#1a1a1a] font-bold">{item.value}</span>
            <span className="text-[#a3a3a3] text-[10px]">({total > 0 ? Math.round((item.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
