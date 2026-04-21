'use client';

import { useState } from 'react';
import { X, MapPin } from 'lucide-react';

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
  const inactiveStates = serviceLocations.filter(loc => !loc.active);

  if (!isOpen) return null;

  const selectedStateData = serviceLocations.find(loc => loc.state === selectedState);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-white" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10 bg-gradient-to-r from-[var(--brand-red)]/5 to-[var(--brand-red)]/0">
          <div>
            <h2 className="text-2xl font-bold text-black">🗺️ Our Pan India Coverage</h2>
            <p className="text-sm text-black/60 mt-1">Operating across India with quality vehicle rentals</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-[var(--brand-red)]/10 to-[var(--brand-red)]/0 p-4 text-center">
              <div className="text-3xl font-bold text-[var(--brand-red)]">{activeStates.length}</div>
              <div className="text-xs text-black/70 mt-1">Active States</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-blue-500/10 to-blue-500/0 p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {activeStates.reduce((acc, state) => acc + state.cities.length, 0)}
              </div>
              <div className="text-xs text-black/70 mt-1">Cities Covered</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-green-500/10 to-green-500/0 p-4 text-center">
              <div className="text-3xl font-bold text-green-600">24/7</div>
              <div className="text-xs text-black/70 mt-1">Service Available</div>
            </div>
          </div>

          {/* Map Section */}
          <div>
            <h3 className="font-semibold text-black mb-4">Service Locations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {serviceLocations.map((location) => (
                <button
                  key={location.state}
                  onClick={() => setSelectedState(location.state)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 border ${
                    selectedState === location.state
                      ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white shadow-lg shadow-red-500/20 scale-105'
                      : location.active
                      ? 'border-[var(--brand-red)]/30 bg-[var(--brand-red)]/10 text-black hover:border-[var(--brand-red)]/60 hover:bg-[var(--brand-red)]/20'
                      : 'border-black/10 bg-black/5 text-black/50 cursor-not-allowed'
                  }`}
                  disabled={!location.active}
                >
                  <span className="flex items-center gap-1 justify-center">
                    {location.active && selectedState === location.state && (
                      <MapPin className="w-4 h-4" />
                    )}
                    {location.state}
                    {location.active && (
                      <span className="text-xs ml-1">✓</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected State Details */}
          {selectedStateData && (
            <div className="rounded-2xl border-2 border-[var(--brand-red)] bg-gradient-to-br from-[var(--brand-red)]/5 to-[var(--brand-red)]/0 p-5">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-[var(--brand-red)] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-black text-lg mb-2">{selectedStateData.state}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStateData.cities.map((city) => (
                      <span
                        key={city}
                        className="inline-block px-3 py-1 rounded-full bg-white border border-[var(--brand-red)]/30 text-sm text-black font-medium"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--brand-red)]/20 border border-[var(--brand-red)]/50"></div>
              <span className="text-black/70">Active Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-black/5 border border-black/10"></div>
              <span className="text-black/70">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 bg-black/2 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 rounded-lg border border-black/10 text-black font-medium hover:bg-black/5 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Navigate to vehicles page or booking page
              window.location.href = '/vehicles';
            }}
            className="flex-1 px-6 py-2 rounded-lg bg-[var(--brand-red)] text-white font-medium hover:bg-[var(--brand-red)]/90 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
