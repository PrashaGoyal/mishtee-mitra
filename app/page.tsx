"use client";

import React, { useState, useEffect } from 'react';

/**
 * mishTee Delivery Mitra - Mobile Dashboard (Next.js App Router)
 * FIX: Resolved 'theme' variable scope issue.
 */

export default function DeliveryMitraDashboard() {
  const [pulseOpacity, setPulseOpacity] = useState(1);

  // Pulse animation logic for the 'Agent Online' status
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseOpacity((prev) => (prev === 1 ? 0.3 : 1));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // UI Theme Constants (Ensure this is not on a comment line)
  const theme = {
    orange: '#FF6B00',
    green: '#28A745',
    white: '#FFFFFF',
    background: '#F5F5F7',
    text: '#1D1D1F',
    shadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme.background,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        margin: 0,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: theme.white,
          borderRadius: '28px',
          padding: '40px 24px',
          boxShadow: theme.shadow,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo Section */}
        <img
          src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png"
          alt="mishTee Logo"
          style={{ width: '80px', marginBottom: '16px' }}
        />

        {/* Brand Title */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '800',
            color: theme.orange,
            margin: '0 0 16px 0',
            textAlign: 'center',
          }}
        >
          mishTee Delivery Mitra
        </h1>

        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F0FFF4',
            padding: '8px 20px',
            borderRadius: '100px',
            border: '1px solid #C6F6D5',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: theme.green,
              borderRadius: '50%',
              opacity: pulseOpacity,
              transition: 'opacity 0.4s ease-in-out',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: '600', color: theme.green }}>
            Agent Online
          </span>
        </div>

        {/* Task Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: theme.white,
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #E5E5E7',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            marginBottom: '32px',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '11px',
              color: '#86868B',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Assigned Task
          </p>
          <h2
            style={{
              margin: '0',
              fontSize: '20px',
              color: theme.text,
              fontWeight: '700',
            }}
          >
            Deliver to: Arjun Mehta
          </h2>
          <p
            style={{
              margin: '12px 0 0 0',
              fontSize: '15px',
              color: '#424245',
              lineHeight: '1.5',
            }}
          >
            📍 42, Green Valley Apartments, Mumbai
          </p>
        </div>

        {/* Action Button */}
        <button
          style={{
            width: '100%',
            backgroundColor: theme.orange,
            color: theme.white,
            padding: '18px',
            borderRadius: '16px',
            border: 'none',
            fontSize: '17px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(255, 107, 0, 0.25)',
          }}
          onClick={() => alert('Launching Google Maps...')}
        >
          Start Navigation
        </button>

        <p style={{ marginTop: '24px', fontSize: '13px', color: '#86868B' }}>
          Powered by mishTee Logistics
        </p>
      </div>
    </div>
  );
}
