"use client";

import React, { useState, useEffect } from 'react';

/**

mishTee Delivery Mitra - Mobile Dashboard

Developed by Senior Frontend Engineer

Architecture:

Single-file Next.js Client Component.

100% Inline Styles for logic-bound styling and design compliance.

Responsive Mobile-first container with safe area centering. */

export default function DeliveryMitraDashboard() { // State for the pulsing green dot (Senior Engineer Note: Using state-based // animation to adhere strictly to the "Inline Styles only" constraint). const [pulseOpacity, setPulseOpacity] = useState(1);

useEffect(() => { const interval = setInterval(() => { setPulseOpacity((prev) => (prev === 1 ? 0.3 : 1)); }, 1000); return () => clearInterval(interval); }, []);

// Design Tokens const colors = { brandOrange: '#FF6B00', successGreen: '#28a745', background: '#F8F9FA', white: '#FFFFFF', textDark: '#333333', shadow: '0 10px 25px rgba(0,0,0,0.08)', };

return ( <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: colors.background, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '0 15px', }} > {/* Mobile-first Layout Container /} <div style={{ width: '100%', maxWidth: '500px', backgroundColor: colors.white, borderRadius: '24px', padding: '40px 20px', boxShadow: colors.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', }} > {/ Brand Identity Section */} <img src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" alt="mishTee Logo" style={{ width: '80px', marginBottom: '16px' }} />

    <h1
      style={{
        fontSize: '24px',
        fontWeight: '800',
        color: colors.brandOrange,
        margin: '0 0 12px 0',
        letterSpacing: '-0.5px',
      }}
    >
      mishTee Delivery Mitra
    </h1>

    {/* Real-time Status Indicator */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '40px',
        padding: '6px 16px',
        backgroundColor: '#E9F7EF',
        borderRadius: '20px',
      }}
    >
      <span
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: colors.successGreen,
          borderRadius: '50%',
          opacity: pulseOpacity,
          transition: 'opacity 0.8s ease-in-out',
        }}
      />
      <span
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: colors.successGreen,
        }}
      >
        Agent Online
      </span>
    </div>

    {/* Active Task Card */}
    
    <div
      style={{
        width: '100%',
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: colors.white,
        border: '1px solid #EEEEEE',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        marginBottom: '32px',
        textAlign: 'left',
      }}
    >
      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888888', textTransform: 'uppercase', fontWeight: 'bold' }}>
        Current Task
      </p>
      <h2 style={{ margin: 0, fontSize: '18px', color: colors.textDark, fontWeight: '700' }}>
        Deliver to: Arjun Mehta
      </h2>
      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666666' }}>
        📍 42, Green Valley Apartments, Mumbai
      </p>
    </div>

    {/* Primary Action */}
    <button
      style={{
        width: '100%',
        padding: '18px',
        backgroundColor: colors.brandOrange,
        color: colors.white,
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'transform 0.2s active',
        boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)',
      }}
      onClick={() => alert('Launching Navigation...')}
    >
      Start Navigation
    </button>
  </div>
</main>
); }
