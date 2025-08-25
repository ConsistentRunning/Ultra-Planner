

import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { LegPlanInfo, RaceEvent, NightPeriod, markerIcons, Terrain, MarkerIcon } from '../types';
import { getElevationAtKm, terrainColors, SEGMENT_LENGTH_M } from '../utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ResponsiveContainer, AreaChart, Area, YAxis, XAxis, ReferenceArea, ReferenceDot } from 'recharts';

interface RunnerCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    legPlan: LegPlanInfo[] | null;
    raceName: string;
    raceEvents?: RaceEvent[];
    nightPeriods?: NightPeriod[];
    isGreyscale: boolean;
}

const MarkerDot: React.FC<any> = ({ cx, cy, payload }) => {
    if (cx == null || cy == null) return null;
    const icon = markerIcons.find(i => i.value === payload.icon)?.label.split(' ')[0];
    return (
        <g transform={`translate(${cx}, ${cy})`}>
            <title>{payload.note}</title>
            <circle r="6" fill="#f59e0b" stroke="#1e293b" strokeWidth="1" />
            <text textAnchor="middle" dominantBaseline="central" fill="black" fontSize="8px" fontWeight="bold">{icon}</text>
        </g>
    );
};

const CustomEventShape: React.FC<any> = ({ cx, cy, payload }) => {
    if (cx == null || cy == null) return null;
    const symbol = payload.type === 'sunrise' ? '☀️' : '🌙';
    const title = payload.type === 'sunrise' ? 'Sunrise' : 'Sunset';
    return (
        <g transform={`translate(${cx}, ${cy})`}>
            <title>{title}</title>
            <text textAnchor="middle" dominantBaseline="middle" y={-6} fill="#e2e8f0" fontSize="14px" paintOrder="stroke" stroke="#1e293b" strokeWidth="2px" strokeLinejoin="round">
                {symbol}
            </text>
        </g>
    );
};

const CardPreview: React.FC<{
    legInfo: LegPlanInfo;
    legNumber: number;
    prevLegName: string;
    isFinish: boolean;
    raceEvents?: RaceEvent[];
    nightPeriods?: NightPeriod[];
    notes?: string;
    notesTitle: string;
}> = (props) => {
    const { legInfo, legNumber, prevLegName, isFinish, raceEvents, nightPeriods, notes, notesTitle } = props;
    const { leg } = legInfo;
    const endName = isFinish ? 'Finish' : (leg.name || `Aid ${legNumber}`);

    const eventsInLeg = useMemo(() => raceEvents?.filter(e => e.km >= legInfo.startKm && e.km <= legInfo.endKm) || [], [raceEvents, legInfo]);
    const nightSegmentsForLeg = useMemo(() => nightPeriods?.map(p => ({
        x1: Math.max(p.x1, legInfo.startKm),
        x2: Math.min(p.x2, legInfo.endKm),
    })).filter(p => p.x1 < p.x2) || [], [nightPeriods, legInfo]);
    
    const legChartData = useMemo(() => {
        if (!legInfo.segments) return [];
        return legInfo.segments.map(p => {
            const point: any = { ...p };
            for (const terrain of Object.keys(terrainColors) as Terrain[]) {
                point[`elevation_${terrain}`] = p.terrain === terrain ? p.elevation : null;
            }
            return point;
        });
    }, [legInfo.segments]);

    const terrainBreakdown = useMemo(() => {
        try {
            if (legInfo.terrainBreakdown) return legInfo.terrainBreakdown;
            return "No terrain data";
        } catch (e) {
            console.error("Error calculating terrain breakdown for runner card:", e);
            return "Terrain data error";
        }
    }, [legInfo]);

    const tickValues = React.useMemo(() => {
        if (!leg || leg.dist <= 0) return [legInfo.startKm, legInfo.endKm];
        const interval = leg.dist <= 2 ? 0.5 : leg.dist <= 5 ? 1 : leg.dist <= 15 ? 2 : 5;
        const numTicks = Math.floor(leg.dist / interval);
        const ticks = [legInfo.startKm];
        for (let i = 1; i <= numTicks; i++) {
            ticks.push(legInfo.startKm + i * interval);
        }
        ticks.push(legInfo.endKm);
        return ticks;
    }, [leg.dist, legInfo.startKm, legInfo.endKm]);


    return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg text-sm text-text break-inside-avoid w-80">
            {/* Top Half */}
            <div className="p-2">
                 <h3 className="font-bold text-base border-b border-slate-600 pb-1 mb-2 text-center">
                    Leg {legNumber}: {prevLegName} to {endName}
                </h3>
                 <div className="grid grid-cols-2 gap-x-2 text-center text-xs mb-1">
                    <div><span className="text-muted">Dist:</span> {leg.dist.toFixed(1)} km</div>
                    <div><span className="text-muted">Gain/Loss:</span> +{leg.gain}/-{leg.loss}m</div>
                </div>
                <div className="w-full h-24 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={legChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                             <XAxis 
                                type="number" 
                                dataKey="km" 
                                domain={['dataMin', 'dataMax']} 
                                ticks={tickValues}
                                tickFormatter={(km) => {
                                    const distInLeg = km - legInfo.startKm;
                                    if (Math.abs(distInLeg - leg.dist) < 0.01) return distInLeg.toFixed(1);
                                    if (distInLeg % 1 !== 0) return distInLeg.toFixed(1);
                                    return distInLeg.toFixed(0);
                                }}
                                fontSize={8} 
                                stroke="#94a3b8" 
                                interval={0}
                            />
                             <defs>
                                {Object.entries(terrainColors).map(([terrain, color]) => (
                                    <linearGradient key={`gradient-card-${terrain}`} id={`gradient-card-${terrain}-${legInfo.leg.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <YAxis yAxisId="ele" hide domain={['dataMin - 20', 'dataMax + 20']} />
                             {nightSegmentsForLeg.map((p, nightIdx) => (
                                <ReferenceArea key={nightIdx} x1={p.x1} x2={p.x2} yAxisId="ele" stroke="none" fill="#4c1d95" fillOpacity={1} ifOverflow="visible" />
                             ))}
                             {Object.entries(terrainColors).map(([terrain, color]) => (
                                <Area key={terrain} yAxisId="ele" type="monotone" connectNulls dataKey={`elevation_${terrain}`} stroke={color} fill={`url(#gradient-card-${terrain}-${legInfo.leg.id})`} strokeWidth={1} />
                             ))}
                             {legInfo.markers.map(marker => (
                                 <ReferenceDot key={marker.id} x={marker.km} y={getElevationAtKm(marker.km, legInfo.segments)} yAxisId="ele" ifOverflow="visible" shape={<MarkerDot payload={marker} />} />
                             ))}
                             {eventsInLeg.map(event => (
                                <ReferenceDot key={event.km} x={event.km} y={getElevationAtKm(event.km, legInfo.segments)} yAxisId="ele" ifOverflow="visible" shape={<CustomEventShape payload={event} />} />
                             ))}
                         </AreaChart>
                     </ResponsiveContainer>
                </div>
                 {terrainBreakdown && (
                    <p className="text-center text-xs text-muted mt-2 px-2">
                        {terrainBreakdown}
                    </p>
                )}
                 <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-muted mt-1">
                    {leg.crewAccess && <span className="bg-chip border border-chipBorder px-1.5 py-0.5 rounded-full">Crew</span>}
                    {leg.dropBag && <span className="bg-chip border border-chipBorder px-1.5 py-0.5 rounded-full">Drop Bag</span>}
                    {leg.pacerIn && <span className="bg-chip border border-chipBorder px-1.5 py-0.5 rounded-full">Pacer In</span>}
                    {leg.pacerOut && <span className="bg-chip border border-chipBorder px-1.5 py-0.5 rounded-full">Pacer Out</span>}
                </div>
            </div>
            
            {/* Dotted Line */}
            <div className="border-t-2 border-dashed border-slate-600 my-1"></div>

            {/* Bottom Half */}
            <div className="p-2 grid grid-cols-2 gap-x-2">
                 <div className="col-span-1">
                    <p className="text-xs text-muted mb-1">{notesTitle}:</p>
                    <p className="text-xs whitespace-pre-wrap text-slate-300 prose prose-invert prose-xs">
                        {(notes || '—').split('\n').slice(0, 6).join('\n')}
                    </p>
                </div>
                <div className="col-span-1">
                    <p className="text-xs text-muted mb-1">Course Markers:</p>
                    {legInfo.markers.slice(0, 6).length > 0 ? (
                        <div className="space-y-1">
                            {legInfo.markers.slice(0, 6).map(marker => (
                                <div key={marker.id} className="flex items-center gap-1 text-xs">
                                    <span className="font-mono text-accent w-8 text-right text-[10px]">{marker.km.toFixed(1)}</span>
                                    <span className="text-sm w-3 text-center">{markerIcons.find(i => i.value === marker.icon)?.label.split(' ')[0]}</span>
                                    <span className="text-slate-300 truncate">{marker.note}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-xs text-slate-400 italic">—</p>}
                </div>
            </div>
        </div>
    );
};

export const RunnerCardsModal: React.FC<RunnerCardsModalProps> = ({ isOpen, onClose, legPlan, raceName, raceEvents, nightPeriods, isGreyscale }) => {
    const [cardType, setCardType] = useState<'runner' | 'pacer'>('runner');
    
    const pacerLegPlan = useMemo((): LegPlanInfo[] => {
        if (!legPlan) return [];
        const activePacerLegs: LegPlanInfo[] = [];
        let isPacerActive = false;
        for (const legInfo of legPlan) {
            if (legInfo.leg.pacerIn) isPacerActive = true;
            if (isPacerActive) {
                activePacerLegs.push(legInfo);
            }
            if (legInfo.leg.pacerOut) isPacerActive = false;
        }
        return activePacerLegs;
    }, [legPlan]);

    const hasPacerLegs = pacerLegPlan.length > 0;
    const legPlanToDisplay = cardType === 'runner' ? legPlan : pacerLegPlan;

    const handlePrint = (type: 'runner' | 'pacer') => {
        const isPacer = type === 'pacer';
        const planToPrint = isPacer ? pacerLegPlan : legPlan;
        
        if (!planToPrint || planToPrint.length === 0) return;
        
        const GREYSCALE_PALETTE = {
            CARD_BG: '#FFFFFF', BORDER: '#AAAAAA', TEXT: '#000000', MUTED: '#555555', CHIP_BG: '#EEEEEE',
            NIGHT_FILL: '#DDDDDD', MARKER_BG: '#999999', MARKER_ICON: '#FFFFFF', SUN_BG: '#999999', MOON_BG: '#555555',
            TERRAIN_STROKE: { road: '#999', smooth: '#777', mixed: '#555', technical: '#333', sandy: '#bbb' },
            TERRAIN_FILL: { road: '#f0f0f0', smooth: '#e0e0e0', mixed: '#d0d0d0', technical: '#c0c0c0', sandy: '#fafafa' }
        };

        const COLOR_PALETTE = {
            CARD_BG: '#f8fafc', BORDER: '#cbd5e1', TEXT: '#1e293b', MUTED: '#64748b', CHIP_BG: '#e2e8f0',
            NIGHT_FILL: '#f3e8ff', MARKER_BG: '#f59e0b', MARKER_ICON: '#000000', SUN_BG: '#fcd34d', MOON_BG: '#94a3b8',
            TERRAIN_STROKE: terrainColors,
            TERRAIN_FILL: { road: '#dcfce7', smooth: '#dbeafe', mixed: '#ffedd5', technical: '#fee2e2', sandy: '#fef9c3' }
        };

        const PALETTE = isGreyscale ? GREYSCALE_PALETTE : COLOR_PALETTE;
        const pdfIconMap: { [key in MarkerIcon]: string } = { 'water': 'W', 'creek': '~', 'hut': 'H', 'first-aid': '+', 'food': 'F', 'toilet': 'T', 'general': 'i', 'photo': 'P' };

        const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 30;
        const gap = 15;

        const CARDS_PER_ROW = 3;
        const CARDS_PER_PAGE = 6;
        const cardW = (pageW - margin * 2 - gap * (CARDS_PER_ROW - 1)) / CARDS_PER_ROW;
        const cardH = (pageH - margin * 2 - gap) / 2;

        planToPrint.forEach((info, i) => {
            const cardIndexOnPage = i % CARDS_PER_PAGE;
            if (cardIndexOnPage === 0 && i > 0) {
                doc.addPage();
            }
            
            const col = cardIndexOnPage % CARDS_PER_ROW;
            const row = Math.floor(cardIndexOnPage / CARDS_PER_ROW);

            const x = margin + col * (cardW + gap);
            const y = margin + row * (cardH + gap);
            
            const { leg, segments, markers, terrainBreakdown } = info;
            const legNumber = (legPlan || []).findIndex(lp => lp.leg.id === info.leg.id) + 1;
            const isFinish = legNumber === (legPlan || []).length;
            const prevLegName = legNumber === 1 ? 'Start' : (legPlan?.[legNumber - 2]?.leg.name || `Aid ${legNumber - 1}`);
            const endName = isFinish ? 'Finish' : (leg.name || `Aid ${legNumber}`);
            
            doc.setFillColor(PALETTE.CARD_BG);
            doc.setDrawColor(PALETTE.BORDER);
            doc.roundedRect(x, y, cardW, cardH, 5, 5, 'FD');

            // --- Top Half ---
            const topBox = { x: x + 8, y: y + 8, w: cardW - 16, h: cardH / 2 - 12 };
            let currentY = topBox.y;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(PALETTE.TEXT);
            doc.text(`Leg ${legNumber}: ${prevLegName} to ${endName}`, x + cardW / 2, currentY + 7, { align: 'center', maxWidth: topBox.w });
            const titleHeight = doc.getTextDimensions(`Leg ${legNumber}: ...`).h * 2;
            currentY += titleHeight + 2;
            doc.setDrawColor(PALETTE.BORDER);
            doc.line(topBox.x, currentY, topBox.x + topBox.w, currentY);
            currentY += 10;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(PALETTE.MUTED);
            doc.text(`Dist: ${leg.dist.toFixed(1)} km`, topBox.x + topBox.w / 4, currentY, { align: 'center' });
            doc.text(`Gain/Loss: +${leg.gain}/-${leg.loss}m`, topBox.x + (topBox.w * 3 / 4), currentY, { align: 'center' });
            currentY += 10;
            
            // Draw Chart
            const chartBox = { x: topBox.x, y: currentY, w: topBox.w, h: 45 };
            if (segments && segments.length > 1) {
                const eleValues = segments.map(s => s.elevation);
                const minEle = Math.min(...eleValues);
                const maxEle = Math.max(...eleValues);
                const eleRange = Math.max(1, maxEle - minEle);
                const yPadding = eleRange * 0.1;

                const scaleX = (km: number) => chartBox.x + ((km - info.startKm) / leg.dist) * chartBox.w;
                const scaleY = (ele: number) => chartBox.y + chartBox.h - ((ele - (minEle - yPadding)) / (eleRange + yPadding * 2)) * chartBox.h;
                
                const nightSegs = nightPeriods?.map(p => ({ x1: Math.max(p.x1, info.startKm), x2: Math.min(p.x2, info.endKm) })).filter(p => p.x1 < p.x2) || [];
                doc.setFillColor(PALETTE.NIGHT_FILL);
                nightSegs.forEach(seg => {
                    doc.rect(scaleX(seg.x1), chartBox.y, scaleX(seg.x2) - scaleX(seg.x1), chartBox.h, 'F');
                });

                for (let segIdx = 0; segIdx < segments.length - 1; segIdx++) {
                    const p1 = segments[segIdx];
                    const p2 = segments[segIdx + 1];
                    doc.setFillColor(PALETTE.TERRAIN_FILL[p1.terrain]);
                    doc.setDrawColor(PALETTE.TERRAIN_STROKE[p1.terrain]);
                    doc.triangle(scaleX(p1.km), scaleY(p1.elevation), scaleX(p2.km), scaleY(p2.elevation), scaleX(p1.km), chartBox.y + chartBox.h, 'F');
                    doc.triangle(scaleX(p2.km), scaleY(p2.elevation), scaleX(p1.km), chartBox.y + chartBox.h, scaleX(p2.km), chartBox.y + chartBox.h, 'F');
                    doc.setLineWidth(0.5);
                    doc.line(scaleX(p1.km), scaleY(p1.elevation), scaleX(p2.km), scaleY(p2.elevation));
                }
                
                doc.setDrawColor(PALETTE.BORDER);
                doc.rect(chartBox.x, chartBox.y, chartBox.w, chartBox.h);
                
                // KM Markers for chart
                const tickY = chartBox.y + chartBox.h;
                doc.setLineWidth(0.5).setDrawColor(PALETTE.MUTED);
                doc.line(chartBox.x, tickY, chartBox.x + chartBox.w, tickY); // X-axis line
                doc.setFontSize(6).setTextColor(PALETTE.MUTED);

                const interval = leg.dist <= 2 ? 0.5 : leg.dist <= 5 ? 1 : leg.dist <= 15 ? 2 : 5;
                let currentTick = 0;
                while (currentTick <= leg.dist) {
                    const kmInRace = info.startKm + currentTick;
                    const tickX = scaleX(kmInRace);
                    doc.setDrawColor(PALETTE.MUTED);
                    doc.line(tickX, tickY, tickX, tickY + 2);
                    doc.text(String(currentTick.toFixed(currentTick % 1 === 0 ? 0 : 1)), tickX, tickY + 7, { align: 'center' });
                    if (currentTick === 0) { currentTick += interval; }
                    else { currentTick += interval; }
                }
                
                const finalTickX = scaleX(info.endKm);
                doc.line(finalTickX, tickY, finalTickX, tickY + 2);
                doc.text(leg.dist.toFixed(1), finalTickX, tickY + 7, { align: 'center' });
                
                const eventsInLeg = raceEvents?.filter(e => e.km >= info.startKm && e.km <= info.endKm) || [];
                markers.slice(0,6).forEach(marker => {
                    const mx = scaleX(marker.km);
                    const my = scaleY(getElevationAtKm(marker.km, segments));
                    const iconChar = pdfIconMap[marker.icon] || '?';
                    doc.setFillColor(PALETTE.MARKER_BG);
                    doc.circle(mx, my, 5, 'F');
                    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(PALETTE.MARKER_ICON);
                    doc.text(iconChar, mx, my + 2, { align: 'center' });
                });
                
                eventsInLeg.forEach(event => {
                    const ex = scaleX(event.km);
                    const ey = scaleY(getElevationAtKm(event.km, segments));
                    if (event.type === 'sunrise') {
                        doc.setFillColor(PALETTE.SUN_BG);
                        doc.circle(ex, ey - 5, 4, 'F');
                    } else {
                        doc.setFillColor(PALETTE.MOON_BG);
                        doc.circle(ex, ey - 5, 4, 'F');
                        doc.setFillColor(PALETTE.CARD_BG);
                        doc.circle(ex + 1.5, ey - 6, 4, 'F');
                    }
                });
            }
            currentY = chartBox.y + chartBox.h + 15;
            
            // Terrain Breakdown
            if (terrainBreakdown) {
                 doc.setFontSize(7);
                 doc.setTextColor(PALETTE.MUTED);
                 doc.text(terrainBreakdown, topBox.x + topBox.w / 2, currentY, { align: 'center', maxWidth: topBox.w });
                 currentY += 12;
            }

            const logistics = [ leg.crewAccess && 'Crew', leg.dropBag && 'Drop Bag', leg.pacerIn && 'Pacer In', leg.pacerOut && 'Pacer Out'].filter(Boolean) as string[];
            if (logistics.length > 0) {
                const totalLogisticsWidth = logistics.reduce((acc, text) => acc + doc.getTextWidth(text!) + 15, 0);
                let chipX = x + cardW / 2 - totalLogisticsWidth / 2;
                doc.setFontSize(7);
                logistics.forEach(text => {
                    const textW = doc.getTextWidth(text) + 6;
                    doc.setFillColor(PALETTE.CHIP_BG);
                    doc.setDrawColor(PALETTE.BORDER);
                    doc.roundedRect(chipX, currentY, textW, 10, 5, 5, 'FD');
                    doc.setTextColor(PALETTE.TEXT); doc.text(text, chipX + 3, currentY + 7);
                    chipX += textW + 3;
                });
            }

            // --- Fold Line ---
            doc.setLineDashPattern([3, 3], 0);
            doc.setDrawColor(PALETTE.MUTED);
            doc.line(x + 5, y + cardH / 2, x + cardW - 5, y + cardH / 2);
            doc.setLineDashPattern([], 0);

            // --- Bottom Half ---
            const bottomBox = { x: x + 8, y: y + cardH / 2 + 8, w: cardW - 16, h: cardH / 2 - 16 };
            const notesCol = { x: bottomBox.x, w: bottomBox.w * 0.55 };
            const markersCol = { x: bottomBox.x + notesCol.w + 5, w: bottomBox.w * 0.45 - 5 };
            
            const notesText = (isPacer ? info.leg.pacerNotes : info.leg.runnerNotes) || '—';
            const notesTitle = isPacer ? 'Pacer Notes:' : 'Personal Notes:';

            doc.setFontSize(8);
            doc.setTextColor(PALETTE.MUTED); doc.text(notesTitle, notesCol.x, bottomBox.y);
            doc.setTextColor(PALETTE.TEXT);
            const notes = doc.splitTextToSize(notesText, notesCol.w).slice(0, 6);
            doc.text(notes, notesCol.x, bottomBox.y + 10);

            doc.setTextColor(PALETTE.MUTED); doc.text('Course Markers:', markersCol.x, bottomBox.y);
            let markerY = bottomBox.y + 12;
            markers.slice(0,6).forEach(marker => {
                if (markerY > bottomBox.y + bottomBox.h - 5) return;
                const iconChar = pdfIconMap[marker.icon] || '?';
                doc.setFontSize(7); doc.setFont('helvetica', 'normal');
                doc.setTextColor(PALETTE.MUTED); doc.text(`${marker.km.toFixed(1)}`, markersCol.x + 10, markerY, { align: 'right'});
                
                doc.setFillColor(PALETTE.MARKER_BG); doc.circle(markersCol.x + 18, markerY - 2, 5, 'F');
                doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(PALETTE.MARKER_ICON);
                doc.text(iconChar, markersCol.x + 18, markerY, { align: 'center' });
                
                doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(PALETTE.TEXT);
                doc.text(doc.splitTextToSize(marker.note, markersCol.w - 25), markersCol.x + 26, markerY);
                markerY += 14;
            });
        });
        
        doc.save(`${raceName.replace(/ /g, '_')}_${isPacer ? 'Pacer' : 'Runner'}Cards.pdf`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Print ${cardType === 'runner' ? 'Runner' : 'Pacer'} Cards`} size="5xl">
            <div className="space-y-4">
                <p className="text-sm">These cards are designed to be folded and carried during your race. Personal notes and key markers are included for quick reference. Use the button to generate a PDF for printing.</p>
                
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div className="inline-flex rounded-md shadow-sm">
                        <button onClick={() => setCardType('runner')} className={`px-4 py-2 text-sm font-medium border border-slate-600 rounded-l-lg ${cardType === 'runner' ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            Runner Cards
                        </button>
                        <button onClick={() => setCardType('pacer')} disabled={!hasPacerLegs} className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-slate-600 rounded-r-lg ${cardType === 'pacer' ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50'}`}>
                            Pacer Cards ({pacerLegPlan.length})
                        </button>
                    </div>
                    {cardType === 'pacer' && !hasPacerLegs && (
                        <p className="text-xs text-amber-400">No pacer legs defined in the plan to generate cards for.</p>
                    )}
                </div>

                <div id="runner-cards-preview" className="max-h-[60vh] overflow-y-auto p-4 bg-slate-900 rounded-lg">
                    {!legPlanToDisplay || legPlanToDisplay.length === 0 ? (
                        <p className="text-center text-muted">
                            {cardType === 'pacer' ? 'No pacer legs to display.' : 'No legs defined in the plan.'}
                        </p>
                    ) : (
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                            {legPlanToDisplay.map((info, i) => {
                                const legNumber = (legPlan || []).findIndex(lp => lp.leg.id === info.leg.id) + 1;
                                return (
                                <CardPreview 
                                    key={info.leg.id}
                                    legInfo={info}
                                    legNumber={legNumber}
                                    prevLegName={legNumber === 1 ? 'Start' : (legPlan?.[legNumber - 2]?.leg.name || `Aid ${legNumber - 1}`)}
                                    isFinish={legNumber === (legPlan || []).length}
                                    raceEvents={raceEvents}
                                    nightPeriods={nightPeriods}
                                    notes={cardType === 'runner' ? info.leg.runnerNotes : info.leg.pacerNotes}
                                    notesTitle={cardType === 'runner' ? 'Personal Notes' : 'Pacer Notes'}
                                />
                            )})}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                    <Button onClick={() => handlePrint(cardType)} variant="primary" disabled={!legPlanToDisplay || legPlanToDisplay.length === 0}>
                        Generate {cardType === 'runner' ? 'Runner' : 'Pacer'} PDF
                    </Button>
                </div>
            </div>
        </Modal>
    );
};