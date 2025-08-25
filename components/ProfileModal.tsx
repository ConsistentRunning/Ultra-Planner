import React from 'react';
import { Profile } from '../types';
import { presets, fmtTime, getFadeDescriptor, getResilienceDescriptor, getUphillDescriptor, getDownhillBenefitDescriptor, getDownhillPenaltyDescriptor, getVamDescriptor, getHeatDescriptor } from '../utils';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input, Select, RangeInput } from './ui/Input';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile;
    setProfile: (profile: Profile) => void;
    setPreset: (preset: keyof typeof presets) => void;
    openWhyModal: () => void;
    openHikeInfoModal: () => void;
    finalTime?: number;
}

const ProfileInput: React.FC<{ label: string; value: number; unit: string; description?: string; children: React.ReactElement }> = ({ label, value, unit, description, children }) => (
  <div>
      <div className="flex justify-between items-baseline">
        <label className="block text-sm font-medium text-muted">{label}</label>
        {description && <span className="text-xs text-accent2 font-semibold">{description}</span>}
      </div>
      {children}
      <div className="text-right text-xs text-muted font-mono">{value.toFixed(keyToPrecision((children.props as any).onChange.toString()))}{unit}</div>
  </div>
);

const keyToPrecision = (handlerString: string) => {
    if (handlerString.includes('muscularResilience')) return 4;
    if (handlerString.includes('fadePer10k')) return 2;
    if (handlerString.includes('hikingEconomyFactor')) return 1;
    return 2;
}


const SettingsGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
        <h4 className="font-semibold text-lg text-accent">{title}</h4>
        <div className="space-y-4 rounded-lg border border-slate-700 p-4 bg-slate-900/30">
            {children}
        </div>
    </div>
);


export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, setProfile, setPreset, openWhyModal, openHikeInfoModal, finalTime }) => {
    const handleProfileChange = <K extends keyof Profile,>(key: K, value: Profile[K]) => {
        setProfile({ ...profile, [key]: value });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Runner Profile" size="5xl">
            {finalTime !== undefined && (
                <div className="sticky top-0 bg-panel/80 backdrop-blur-sm z-10 p-4 -mx-6 -mt-6 mb-4 border-b border-slate-700">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-text">Predicted Finish Time</span>
                        <span className="text-2xl font-bold font-mono text-accent2">{fmtTime(finalTime)}</span>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-lg font-semibold text-text">Presets</h3>
                    <p className="text-sm text-muted">Start with a preset that matches your running style, then fine-tune the values below.</p>
                </div>
                <Button onClick={openWhyModal} variant="primary" className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                    <span>Why these numbers?</span>
                </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(presets).map(p => (
                    <Button key={p} onClick={() => setPreset(p as keyof typeof presets)}>{p.charAt(0).toUpperCase() + p.slice(1)}</Button>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                     <SettingsGroup title="Environment">
                        <ProfileInput label="Heat Acclimation" value={profile.heat} unit="" description={getHeatDescriptor(profile.heat)}>
                            <RangeInput min={0.7} max={1.5} step={0.01} value={profile.heat} onChange={e => handleProfileChange('heat', +e.target.value)} />
                        </ProfileInput>
                        <Select label="Night Confidence" value={profile.nightConf} onChange={e => handleProfileChange('nightConf', e.target.value as any)}>
                            <option>High</option><option>Medium</option><option>Low</option>
                        </Select>
                    </SettingsGroup>
                    
                    <SettingsGroup title="Advanced Fatigue Model">
                        <ProfileInput label="Base Metabolic Fade % / 10k" value={profile.fadePer10k} unit="%" description={getFadeDescriptor(profile.fadePer10k)}>
                            <RangeInput min={0.0} max={4.0} step={0.05} value={profile.fadePer10k} onChange={e => handleProfileChange('fadePer10k', +e.target.value)} />
                        </ProfileInput>
                        <ProfileInput label="Muscular Resilience (Sensitivity)" value={profile.muscularResilience || 0} unit="" description={getResilienceDescriptor(profile.muscularResilience || 0)}>
                            <RangeInput min={0.0005} max={0.01} step={0.0001} value={profile.muscularResilience || 0} onChange={e => handleProfileChange('muscularResilience', +e.target.value)} />
                        </ProfileInput>
                    </SettingsGroup>

                    <SettingsGroup title="Grade Factors">
                        <ProfileInput label="Uphill Cost % per +1% Grade" value={profile.upCostPct} unit="%" description={getUphillDescriptor(profile.upCostPct)}>
                            <RangeInput min={1.5} max={6.0} step={0.05} value={profile.upCostPct} onChange={e => handleProfileChange('upCostPct', +e.target.value)} />
                        </ProfileInput>
                        <ProfileInput label="Down Benefit % per -1% (to -3%)" value={profile.downBenefitPct} unit="%" description={getDownhillBenefitDescriptor(profile.downBenefitPct)}>
                            <RangeInput min={0.0} max={2.0} step={0.02} value={profile.downBenefitPct} onChange={e => handleProfileChange('downBenefitPct', +e.target.value)} />
                        </ProfileInput>
                        <ProfileInput label="Down Penalty % per -1% (< -3%)" value={profile.downPenaltyPct} unit="%" description={getDownhillPenaltyDescriptor(profile.downPenaltyPct)}>
                            <RangeInput min={0.5} max={4.0} step={0.02} value={profile.downPenaltyPct} onChange={e => handleProfileChange('downPenaltyPct', +e.target.value)} />
                        </ProfileInput>
                    </SettingsGroup>
                </div>

                <div className="space-y-6">
                    <SettingsGroup title="Terrain Multipliers">
                        <ProfileInput label="Terrain - Road" value={profile.tRoad} unit="x">
                            <RangeInput min={0.9} max={1.05} step={0.01} value={profile.tRoad} onChange={e => handleProfileChange('tRoad', +e.target.value)} />
                        </ProfileInput>
                        <ProfileInput label="Terrain - Smooth" value={profile.tSmooth} unit="x">
                            <RangeInput min={0.95} max={1.05} step={0.01} value={profile.tSmooth} onChange={e => handleProfileChange('tSmooth', +e.target.value)} />
                        </ProfileInput>
                        <ProfileInput label="Terrain - Mixed" value={profile.tMixed} unit="x">
                            <RangeInput min={1.0} max={1.15} step={0.01} value={profile.tMixed} onChange={e => handleProfileChange('tMixed', +e.target.value)} />
                        </ProfileInput>
                        <ProfileInput label="Terrain - Technical" value={profile.tTech} unit="x">
                            <RangeInput min={1.02} max={1.25} step={0.01} value={profile.tTech} onChange={e => handleProfileChange('tTech', +e.target.value)} />
                        </ProfileInput>
                        <ProfileInput label="Terrain - Sandy" value={profile.tSand} unit="x">
                            <RangeInput min={1.05} max={1.35} step={0.01} value={profile.tSand} onChange={e => handleProfileChange('tSand', +e.target.value)} />
                        </ProfileInput>
                    </SettingsGroup>

                    <SettingsGroup title="Hiking Model">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded accent-accent" checked={profile.hike} onChange={e => handleProfileChange('hike', e.target.checked)} />
                                <span>Power-hike all climbs</span>
                            </label>
                            <button onClick={openHikeInfoModal} type="button" aria-label="More information on the hiking model" className="text-muted hover:text-accent transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className={`transition-opacity duration-300 ${profile.hike ? 'opacity-100' : 'opacity-50'}`}>
                            <ProfileInput label={`Start hiking ≥ ${profile.hikeThr}%`} value={profile.hikeThr} unit="%">
                               <RangeInput min={5} max={30} step={1} value={profile.hikeThr} onChange={e => handleProfileChange('hikeThr', +e.target.value)} disabled={!profile.hike}/>
                           </ProfileInput>
                             <ProfileInput label="Hiking Economy Bonus" value={(profile.hikingEconomyFactor || 0) * 100} unit="%">
                               <RangeInput min={0} max={15} step={0.5} value={(profile.hikingEconomyFactor || 0) * 100} onChange={e => handleProfileChange('hikingEconomyFactor', +e.target.value / 100)} disabled={!profile.hike}/>
                           </ProfileInput>
                           <div className="grid grid-cols-3 gap-4 mt-2">
                                <Input label="Hike VAM (m/h)" type="number" value={profile.vam} onChange={e => handleProfileChange('vam', +e.target.value)} disabled={!profile.hike}/>
                                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                                    <input type="checkbox" className="h-4 w-4 rounded accent-accent" checked={profile.poles} onChange={e => handleProfileChange('poles', e.target.checked)} disabled={!profile.hike}/>
                                    <span>Poles</span>
                                </label>
                                <Input label="Pack (kg)" type="number" min="0" step="0.5" value={profile.packKg} onChange={e => handleProfileChange('packKg', +e.target.value)} disabled={!profile.hike}/>
                           </div>
                           <ProfileInput label="" value={profile.vam} unit="m/h" description={getVamDescriptor(profile.vam)}>
                                <RangeInput min={400} max={1400} step={10} value={profile.vam} onChange={e => handleProfileChange('vam', +e.target.value)} disabled={!profile.hike} className="mt-2" />
                            </ProfileInput>
                        </div>
                    </SettingsGroup>
                </div>
            </div>
        </Modal>
    );
};
