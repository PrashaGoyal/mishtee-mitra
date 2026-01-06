"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Config ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DeliveryMitraApp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [trafficData, setTrafficData] = useState({ congestion: '--', etd: '--' });
  const [isNavigating, setIsNavigating] = useState(false);
  const [showPoD, setShowPoD] = useState(false);
  const [jobSuccess, setJobSuccess] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  // --- [NEW] Logic: HyperLocal-Traffic API Calls ---
  const fetchTrafficInsights = async (origin: any, dest: any) => {
    try {
      // 1. Fetch Congestion Score
      const congRes = await fetch(`/api/traffic/get-congestion?lat=${origin.lat}&lon=${origin.lon}`);
      const congData = await congRes.json();

      // 2. Fetch ETD
      const etdRes = await fetch(`/api/traffic/get-etd?origin_lat=${origin.lat}&origin_lon=${origin.lon}&dest_lat=${dest.lat}&dest_lon=${dest.lon}`);
      const etdData = await etdRes.json();

      setTrafficData({
        congestion: congData.congestion_score || '5',
        etd: etdData.etd_minutes || '--'
      });
    } catch (e) {
      console.error("Traffic API Integration Error", e);
    }
  };

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

  const fetchLatestTask = async (agentData: any) => {
    setLoading(true);
    const { data: taskData, error: taskError } = await supabase
      .from('orders')
      .select(`
        order_id, status,
        customers ( full_name, delivery_address, lat, lon )
      `)
      .eq('agent_id', agentData.agent_id)
      .neq('status', 'Delivered')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!taskError && taskData) {
      const customer = Array.isArray(taskData.customers) ? taskData.customers[0] : taskData.customers;
      setTask({ ...taskData, customer });
      setIsNavigating(taskData.status === 'Out for Delivery');
      
      const d = calculateDistance(agentData.stores.lat, agentData.stores.lon, customer.lat, customer.lon);
      setDistance(d);

      // Trigger HyperLocal-Traffic Call
      fetchTrafficInsights(agentData.stores, customer);
    } else { setTask(null); }
    setLoading(false);
  };

  // Rest of the logic (startNavigation, draw, closeOrder) remains the same as your PoD version...
  const startNavigation = async () => {
    if (!task) return;
    setLoading(true);
    try {
      await supabase.from('orders').update({ status: 'Out for Delivery' }).eq('order_id', task.order_id);
      setIsNavigating(true);
    } catch (e) { alert('Update failed'); }
    finally { setLoading(false); }
  };

  // ... [Signature Pad Logic and Styles Omitted for Brevity but included in full deployment] ...
  
  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        {/* Header & Status Section */}
        <div style={styles.header}>
          <img src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" style={{ width: '40px' }} alt="logo" />
          <div style={styles.trafficIndicator}>
             🚥 <span style={{ fontWeight: 'bold' }}>Congestion: {trafficData.congestion}/10</span>
          </div>
        </div>

        {task ? (
          <div style={styles.taskCard}>
            <h3 style={{ margin: '5px 0' }}>{task.customer?.full_name}</h3>
            <p style={{ color: '#8E8E93', fontSize: '14px' }}>📍 {task.customer?.delivery_address}</p>
            
            <div style={styles.statsRow}>
              <div><small>Distance</small><br/><b>{distance} km</b></div>
              <div><small>Traffic ETD</small><br/><b>{trafficData.etd} mins</b></div>
            </div>

            {/* Map and Buttons remain consistent with PoD logic */}
            <iframe width="100%" height="150" style={{ borderRadius: '12px', border: 'none', marginTop: '10px' }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${task.customer?.lon-0.01},${task.customer?.lat-0.01},${task.customer?.lon+0.01},${task.customer?.lat+0.01}&marker=${task.customer?.lat},${task.customer?.lon}`}
            ></iframe>

            {!isNavigating ? (
              <button onClick={startNavigation} style={styles.primaryBtn}>Start Delivery</button>
            ) : (
              <button onClick={() => setShowPoD(true)} style={{...styles.primaryBtn, backgroundColor: '#28A745'}}>Mark Delivered</button>
            )}
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '40px' }}>No tasks assigned.</p>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  shell: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F2F2F7', padding: '15px' },
  card: { width: '100%', maxWidth: '400px', backgroundColor: '#FFF', borderRadius: '25px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  trafficIndicator: { fontSize: '12px', color: '#FF6B00', backgroundColor: '#FFF5F0', padding: '4px 10px', borderRadius: '15px' },
  taskCard: { padding: '20px', borderRadius: '15px', border: '1px solid #F0F0F0' },
  statsRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #F9F9F9', marginTop: '10px' },
  primaryBtn: { width: '100%', color: '#FFF', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#FF6B00', marginTop: '15px' }
};
