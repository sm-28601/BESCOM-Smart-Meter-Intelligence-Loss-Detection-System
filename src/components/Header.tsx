import React, { useState, useRef, useEffect } from 'react';

/**
 * Header component — official top navigation bar with BESCOM branding
 * Includes a clickable profile badge with dropdown showing user details
 */

interface HeaderProps {
  currentTime: string;
}

// Dummy officer profile data
const officerProfile = {
  name: 'Shri Ramesh B. Patil',
  designation: 'Sub-Divisional Officer (SDO)',
  employeeId: 'BESCOM/SD/2019/04782',
  division: 'South Division – Jayanagar',
  circle: 'Bangalore Urban South Circle',
  email: 'ramesh.patil@bescom.karnataka.gov.in',
  phone: '+91 80 2657 4321',
  mobile: '+91 98456 12345',
  officeAddress: 'BESCOM Sub-Division Office, 3rd Cross, Jayanagar 4th Block, Bangalore – 560041',
  lastLogin: '25 Apr 2026, 08:45',
  role: 'Investigation Officer – Smart Meter Division',
};

export const Header: React.FC<HeaderProps> = ({ currentTime }) => {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gov-navy shadow-header sticky top-0 z-50">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-4">
          {/* Emblem placeholder */}
          <div className="w-10 h-10 bg-white bg-opacity-15 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-white text-base font-semibold leading-tight tracking-wide">
              BESCOM Smart Meter Intelligence
            </h1>
            <p className="text-blue-200 text-opacity-60 text-xs mt-0.5">
              Bangalore Electricity Supply Company Ltd. — Loss Detection & Monitoring System
            </p>
          </div>
        </div>

        {/* Right: Status indicators */}
        <div className="flex items-center gap-6">
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
            </span>
            <span className="text-green-300 text-xs font-medium">LIVE</span>
          </div>

          {/* Timestamp */}
          <div className="text-blue-100 text-opacity-60 text-xs font-mono">
            {currentTime}
          </div>

          {/* User badge — clickable with dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              id="profile-button"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-white bg-opacity-15 rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-white text-xs font-medium leading-tight">SDO Office</p>
                <p className="text-blue-200 text-opacity-50 text-[10px]">South Division</p>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`hidden lg:block transition-transform ${showProfile ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="profile-dropdown" id="profile-dropdown">
                {/* Header */}
                <div className="px-4 py-3 bg-gov-navy bg-opacity-5 border-b border-slate-100 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gov-navy bg-opacity-10 rounded-full flex items-center justify-center text-gov-navy flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{officerProfile.name}</p>
                      <p className="text-[11px] text-slate-500">{officerProfile.designation}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="px-4 py-3 space-y-2.5">
                  <ProfileRow label="Employee ID" value={officerProfile.employeeId} mono />
                  <ProfileRow label="Role" value={officerProfile.role} />
                  <ProfileRow label="Division" value={officerProfile.division} />
                  <ProfileRow label="Circle" value={officerProfile.circle} />
                  <ProfileRow label="Email" value={officerProfile.email} mono />
                  <ProfileRow label="Office Phone" value={officerProfile.phone} mono />
                  <ProfileRow label="Mobile" value={officerProfile.mobile} mono />
                  <ProfileRow label="Office Address" value={officerProfile.officeAddress} />
                  <ProfileRow label="Last Login" value={officerProfile.lastLogin} />
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
                  <button className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors">
                    Edit Profile
                  </button>
                  <button className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-gov-navy rounded hover:bg-gov-navy-light transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ── Helper ──
const ProfileRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
    <p className={`text-xs text-slate-700 mt-0.5 leading-snug ${mono ? 'font-mono' : ''}`}>
      {value}
    </p>
  </div>
);
