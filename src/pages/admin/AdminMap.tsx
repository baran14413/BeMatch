import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { Globe, Users, Activity, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../components/Admin.css';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl; // eslint-disable-line @typescript-eslint/no-explicit-any
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for online/offline
const onlineIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const offlineIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapUser {
    id: string;
    firstName: string;
    city: string;
    lat: number;
    lng: number;
    isOnline: boolean;
    isPremium: boolean;
    gender: string;
}

export default function AdminMap() {
    const [users, setUsers] = useState<MapUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, online: 0, cities: new Set<string>() });

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
            const loadedUsers: MapUser[] = [];
            let onlineCount = 0;
            const uniqueCities = new Set<string>();

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.role !== 'admin' && data.locationCoords && data.locationCoords.lat && data.locationCoords.lng) {

                    const userOnline = data.isOnline || false;

                    loadedUsers.push({
                        id: doc.id,
                        firstName: data.firstName || 'İsimsiz',
                        city: data.locationCity || 'Bilinmiyor',
                        lat: data.locationCoords.lat + (Math.random() - 0.5) * 0.05, // Slight scatter so pins don't overlap completely
                        lng: data.locationCoords.lng + (Math.random() - 0.5) * 0.05,
                        isOnline: userOnline,
                        isPremium: data.isPremium || false,
                        gender: data.gender || 'Bilinmiyor'
                    });

                    if (userOnline) onlineCount++;
                    if (data.locationCity) uniqueCities.add(data.locationCity);
                }
            });

            setUsers(loadedUsers);
            setStats({ total: loadedUsers.length, online: onlineCount, cities: uniqueCities });
            setLoading(false);
        });

        return () => unsub();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="admin-page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Globe className="text-[var(--god-blue)]" /> Küresel Radar
                    </h1>
                    <p className="admin-page-subtitle">Sistemdeki tüm lokasyon paylaşımlı kullanıcıların anlık radar takibi.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="admin-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--god-blue)' }}>
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--god-text-muted)', margin: '0 0 4px 0' }}>Saptanan Lokasyonlar</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0', color: 'var(--god-text)' }}>{loading ? '...' : stats.total}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--god-green)' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--god-text-muted)', margin: '0 0 4px 0' }}>Aktif Çevrimiçi (Radarda)</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0', color: 'var(--god-text)' }}>{loading ? '...' : stats.online}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="admin-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--god-gold)' }}>
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--god-text-muted)', margin: '0 0 4px 0' }}>Erişilen Şehirler</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0', color: 'var(--god-text)' }}>{loading ? '...' : stats.cities.size}</p>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="admin-card"
                style={{ flex: 1, minHeight: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
            >
                <div style={{ position: 'relative', height: '100%', width: '100%', backgroundColor: '#0f172a' }}>
                    <MapContainer
                        center={[39.93, 32.85]} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}
                    >
                        {/* 
                            Used CartoDB Dark Matter tiles for a very chic, cyber/god's eye feel 
                            Alternative: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' for standard 
                        */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        {users.map(user => (
                            <Marker
                                key={user.id}
                                position={[user.lat, user.lng]}
                                icon={user.isOnline ? onlineIcon : offlineIcon}
                            >
                                <Popup className="admin-map-popup">
                                    <div style={{ padding: '4px', textAlign: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--god-border)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Users size={20} color="var(--god-text-muted)" />
                                        </div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>
                                            {user.firstName}
                                        </h4>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4b5563' }}>
                                            <MapPin size={10} style={{ display: 'inline', marginRight: '4px' }} />{user.city}
                                        </p>

                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: user.isOnline ? '#dcfce7' : '#fef2f2', color: user.isOnline ? '#166534' : '#991b1b' }}>
                                                {user.isOnline ? 'ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI'}
                                            </span>
                                            {user.isPremium && (
                                                <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                                                    PREMIUM
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* HUD Overlay Map Legend */}
                    <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000, backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '12px', border: '1px solid var(--god-border)', display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
                        <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--god-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Radar Lejantı</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid rgba(255,255,255,0.5)' }}></div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--god-text)', fontWeight: '500' }}>Aktif İzleme (Çevrimiçi)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid rgba(255,255,255,0.5)' }}></div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--god-text-dim)' }}>Son Bilinen (Çevrimdışı)</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
