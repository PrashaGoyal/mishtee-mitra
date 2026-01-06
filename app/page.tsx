"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * mishTee Delivery Mitra - Final Integrated App
 * Logic: Login -> Task Fetch -> Write-Back (Out for Delivery) -> PoD Closure
 */

// --- 1. Supabase Initialization ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DeliveryMitraApp() {
  // --- State ---
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [task, setTask] = useState<any>(null); // Flattened task object
  const [distance, setDistance] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showPoD, setShowPoD] = useState(false);
  const [jobSuccess, setJobSuccess] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const theme = {
    orange: '#FF6B00',
    green: '#28A745',
    blue: '#007AFF',
    white: '#FFFFFF',
    bg: '#F2F2F7',
    gray: '#8E8E93',
  };

  // --- Logic: Haversine Distance ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  // --- Logic: Authentication ---
  const handleLogin = async () => {
    if (!phoneNumber.match(/^[9][0-9]{9}$/)) {
      setError('Invalid Mitra number. Must start with 9.');
      return;
    }
    setLoading(true);
    try {
      const { data: agentData, error: authError } = await supabase
        .from('agents')
        .select('*, stores(lat, lon, location_name)')
        .eq('phone_number', phoneNumber)
        .single();

      if (authError || !agentData) {
        setError('Agent not found.');
      } else {
        setAgent(agentData);
        await fetchLatestTask(agentData);
        setIsLoggedIn(true);
      }
    } catch (err) { setError('System Error. Try again.'); }
    finally { setLoading(false); }
  };

  // --- Logic: Fetch Task (Join & Flatten) ---
  const fetchLatestTask = async (agentData: any) => {
    setLoading(true);
    const { data: taskData, error: taskError } = await supabase
      .from('orders')
      .select(`
        order_id, status,
        customers ( full_name, delivery_address, lat, lon ),
        traffic_api ( etd_minutes )
      `)
      .eq('agent_id', agentData.agent_id)
      .neq('status', 'Delivered')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!taskError && taskData) {
      // FIX: Handle array vs object for customers join
      const customerData = Array.isArray(taskData.customers) ? taskData.customers[0] : taskData.customers;
      const trafficData = Array.isArray(taskData.traffic_api) ? taskData.traffic_api[0] : taskData.traffic_api;

      const formattedTask = {
        ...taskData,
        customer: customerData,
        traffic: trafficData
      };

      setTask(formattedTask);
      setIsNavigating(taskData.status === 'Out for Delivery');
      
      const d = calculateDistance(
        agentData.stores.lat, 
        agentData.stores.lon, 
        customerData.lat, 
        customerData.lon
      );
      setDistance(d);
    } else {
      setTask(null);
    }
    setLoading(false);
    setJobSuccess(false);
  };

  // --- [FIX] Logic: Status Write-Back (Navigation) ---
  const startNavigation = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Out for Delivery' })
        .eq('order_id', task.order_id);

      if (error) {
        alert("Database Error: " + error.message);
      } else {
        setIsNavigating(true);
      }
    } catch (e) { alert('Update failed'); }
    finally { setLoading(false); }
  };

  // --- Signature Logic ---
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    if (ctx) { ctx.beginPath(); ctx.moveTo(x, y); }
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    if (ctx) { ctx.lineTo(x, y); ctx.stroke(); }
  };

  const closeOrder = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('orders').update({ status: 'Delivered' }).eq('order_id', task.order_id);
      if (error) throw error;
      setTask(null);
      setIsNavigating(false);
      setShowPoD(false);
      setJobSuccess(true);
    } catch (err) { alert('Closure failed.'); }
    finally { setLoading(false); }
  };

  // --- Render ---
  if (!isLoggedIn) {
    return (
      <div style={styles.shell}>
        <div style={styles.card}>
          <img src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" style={styles.logo} alt="logo" />
          <h2 style={{ color: theme.orange }}>Mitra Dashboard</h2>
          <input type="tel" placeholder="Phone (9...)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={styles.input} />
          <button onClick={handleLogin} style={styles.primaryBtn}>{loading ? 'Checking...' : 'Login'}</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (jobSuccess) {
    return (
      <div style={styles.shell}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px' }}>✅</h1>
          <h2>Job Well Done!</h2>
          <button onClick={() => fetchLatestTask(agent)} style={styles.primaryBtn}>Find Next Delivery</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" style={{ width: '40px' }} alt="logo" />
          <span style={{ color: theme.green, fontWeight: 'bold' }}>● Online</span>
        </div>

        {task ? (
          <div style={styles.taskCard}>
            <span style={styles.label}>CUSTOMER</span>
            <h3 style={{ margin: '5px 0' }}>{task.customer?.full_name}</h3>
            <p style={{ color: theme.gray }}>📍 {task.customer?.delivery_address}</p>
            
            <div style={styles.statsRow}>
              <div><small>Dist.</small><br/><b>{distance} km</b></div>
              <div><small>ETD</small><br/><b>{task.traffic?.etd_minutes || '--'} m</b></div>
            </div>

            <iframe 
              width="100%" height="150" style={{ borderRadius: '12px', border: 'none', marginTop: '10px' }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${task.customer?.lon-0.01},${task.customer?.lat-0.01},${task.customer?.lon+0.01},${task.customer?.lat+0.01}&marker=${task.customer?.lat},${task.customer?.lon}`}
            ></iframe>

            {!isNavigating ? (
              <button onClick={startNavigation} style={{ ...styles.primaryBtn, backgroundColor: theme.orange }}>
                {loading ? 'Updating...' : 'View Detailed Route'}
              </button>
            ) : (
              <button onClick={() => setShowPoD(true)} style={{ ...styles.primaryBtn, backgroundColor: theme.green }}>
                Mark as Delivered
              </button>
            )}

            {showPoD && (
              <div style={styles.overlay}>
                <div style={styles.modal}>
                  <h3>Sign for Closure</h3>
                  <canvas ref={canvasRef} width="300" height="150" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} style={styles.canvas} />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={() => setShowPoD(false)} style={styles.secondaryBtn}>Cancel</button>
                    <button onClick={closeOrder} style={styles.primaryBtn}>Finish</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: theme.gray }}>No active tasks.</p>
            <button onClick={() => fetchLatestTask(agent)} style={styles.secondaryBtn}>Refresh</button>
          </div>
        )}
        <button onClick={() => setIsLoggedIn(false)} style={styles.linkBtn}>Logout</button>
      </div>
    </div>
  );
}

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  shell: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F2F2F7', padding: '15px', fontFamily: 'sans-serif' },
  card: { width: '100%', maxWidth: '400px', backgroundColor: '#FFF', borderRadius: '25px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  logo: { width: '60px' },
  input: { width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #DDD', marginBottom: '10px', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', color: '#FFF', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#FF6B00' },
  secondaryBtn: { width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #DDD', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#FFF' },
  taskCard: { padding: '20px', borderRadius: '15px', border: '1px solid #F0F0F0' },
  label: { fontSize: '10px', color: '#999', fontWeight: 'bold' },
  statsRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #F9F9F9', marginTop: '10px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#FFF', padding: '20px', borderRadius: '20px', width: '90%', maxWidth: '340px' },
  canvas: { border: '1px solid #DDD', width: '100%', cursor: 'crosshair', backgroundColor: '#FAFAFA', touchAction: 'none' },
  linkBtn: { width: '100%', background: 'none', border: 'none', color: '#999', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }
};
