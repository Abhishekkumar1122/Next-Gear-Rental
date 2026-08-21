'use client';

import { useState } from 'react';
import { X, MapPin, CheckCircle2 } from 'lucide-react';

interface ServiceLocation {
  state: string;
  cities: string[];
  active: boolean;
}

const serviceLocations: ServiceLocation[] = [
  { state: 'Karnataka', cities: ['Bangalore', 'Mysore'], active: true },
  { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur'], active: true },
  { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore'], active: true },
  { state: 'Telangana', cities: ['Hyderabad', 'Secunderabad'], active: true },
  { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada'], active: true },
  { state: 'Delhi', cities: ['New Delhi'], active: true },
  { state: 'Haryana', cities: ['Gurgaon', 'Noida'], active: true },
  { state: 'Gujarat', cities: ['Ahmedabad', 'Surat'], active: true },
  { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur'], active: true },
  { state: 'Rajasthan', cities: ['Jaipur', 'Udaipur'], active: true },
  { state: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram'], active: true },
  { state: 'West Bengal', cities: ['Kolkata'], active: false },
  { state: 'Punjab', cities: ['Chandigarh', 'Mohali'], active: true },
];

interface IndiaCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IndiaCoverageModal({ isOpen, onClose }: IndiaCoverageModalProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const activeStates = serviceLocations.filter(loc => loc.active);

  if (!isOpen) return null;

  const selectedStateData = serviceLocations.find(loc => loc.state === selectedState);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden border border-white/15 bg-[#0d0d0d] text-white shadow-2xl shadow-red-500/20 flex flex-col animate-in fade-in zoom-in-95 duration-200" 
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-red-950/40 via-[#0d0d0d] to-[#0d0d0d]">
          <div>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              🗺️ Our Pan India <span className="gradient-text">Coverage</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-0.5">Operating across India with verified vehicle rentals</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-red-600 hover:border-red-600 text-white transition-all shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Statistics Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-red-950/20 to-[#0d0d0d] p-3 sm:p-4 text-center shadow-lg shadow-red-500/10">
              <div className="text-xl sm:text-3xl font-black text-red-500">{activeStates.length}</div>
              <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 font-bold">Active States</div>
            </div>
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-blue-950/20 to-[#0d0d0d] p-3 sm:p-4 text-center shadow-lg shadow-blue-500/10">
              <div className="text-xl sm:text-3xl font-black text-blue-400">
                {activeStates.reduce((acc, state) => acc + state.cities.length, 0)}
              </div>
              <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 font-bold">Cities Covered</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-emerald-950/20 to-[#0d0d0d] p-3 sm:p-4 text-center shadow-lg shadow-emerald-500/10">
              <div className="text-xl sm:text-3xl font-black text-emerald-400">24/7</div>
              <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 font-bold">Service Ready</div>
            </div>
          </div>

          {/* Service Locations Buttons */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-2 sm:mb-3">
              Select Service Location
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
              {serviceLocations.map((location) => {
                const isSelected = selectedState === location.state;
                return (
                  <button
                    key={location.state}
                    onClick={() => setSelectedState(location.state)}
                    disabled={!location.active}
                    className={`rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-200 border flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/30 scale-[1.02]'
                        : location.active
                        ? 'border-white/15 bg-white/[0.04] text-white hover:border-red-500/50 hover:bg-red-950/30'
                        : 'border-white/10 bg-white/[0.02] text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <span className="truncate">{location.state}</span>
                    {location.active ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                    ) : (
                      <span className="text-[9px] uppercase tracking-wide text-white/40 font-bold shrink-0">Soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected State Details Showcase */}
          {selectedStateData && (
            <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-[#0d0d0d] to-[#0d0d0d] p-3.5 sm:p-5 shadow-lg shadow-red-500/10 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm sm:text-base uppercase tracking-wide mb-2">
                    {selectedStateData.state} Cities Hub
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedStateData.cities.map((city) => (
                      <span
                        key={city}
                        className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend Footer */}
          <div className="flex items-center gap-4 flex-wrap text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-white/70 font-medium">Active Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="text-white/40 font-medium">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 bg-[#090909] px-4 sm:px-6 py-3.5 sm:py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 sm:py-2.5 rounded-full border border-white/20 bg-white/5 text-white font-bold text-xs sm:text-sm hover:bg-white/10 transition-all"
          >
            Close
          </button>
          <button
            onClick={() => {
              window.location.href = '/vehicles';
            }}
            className="flex-1 px-4 py-2 sm:py-2.5 rounded-full bg-[var(--brand-red)] text-white font-bold text-xs sm:text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-600/30"
          >
            Book Now →
          </button>
        </div>
      </div>
    </div>
  );
}
