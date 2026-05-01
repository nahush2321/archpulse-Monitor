import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Thermometer, 
  HardDrive, 
  Layers, 
  AlertTriangle,
  RefreshCw,
  Info,
  Clock,
  Globe,
  Monitor
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SystemData {
  cpu: {
    manufacturer: string;
    brand: string;
    speed: number;
    cores: number;
    temp: number;
    maxTemp: number;
    load: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    active: number;
  };
  power: {
    hasBattery: boolean;
    isCharging: boolean;
    percent: number;
    voltage: number;
    capacityUnit: string;
  };
  storage: Array<{
    fs: string;
    size: number;
    used: number;
    use: number;
    mount: string;
  }>;
  topProcesses: Array<{
    pid: number;
    name: string;
    cpu: number;
    mem: number;
    user: string;
  }>;
  graphics: Array<{
    model: string;
    vram: number;
    bus: string;
    vendor: string;
  }>;
  network: Array<{
    iface: string;
    ip4: string;
    speed: number;
    operstate: string;
  }>;
  bios: {
    vendor: string;
    version: string;
    releaseDate: string;
  };
  timestamp: number;
}

export default function App() {
  const [data, setData] = useState<SystemData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/system-health');
      if (!response.ok) throw new Error('Failed to fetch system health');
      const newData: SystemData = await response.json();
      
      setData(newData);
      setLastUpdate(new Date());
      setHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          load: Math.round(newData.cpu.load),
          temp: newData.cpu.temp || 0,
          mem: Math.round((newData.memory.used / newData.memory.total) * 100)
        }];
        return newHistory.slice(-20); // Keep last 20 points
      });
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const killProcess = async (pid: number) => {
    setActionLoading(`kill-${pid}`);
    try {
      const res = await fetch(`/api/actions/kill/${pid}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to terminate process');
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const boostCooling = async () => {
    setActionLoading('boost');
    try {
      const res = await fetch('/api/actions/boost-cooling', { method: 'POST' });
      const result = await res.json();
      alert(result.message || 'Cooling boost initiated');
    } catch (err) {
      alert('Hardware control failed. Ensure server has root privileges.');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-[#E2E2E2] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#00FF41]" />
          <p className="text-sm tracking-widest uppercase opacity-50">Initializing Hardware Probe...</p>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTempColor = (temp: number) => {
    if (temp > 80) return 'text-red-500';
    if (temp > 65) return 'text-orange-500';
    return 'text-[#00FF41]';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E2E2E2] font-mono selection:bg-[#00FF41] selection:text-black">
      {/* Header */}
      <header className="border-b border-[#1A1A1C] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
            <h1 className="text-xl font-bold tracking-tighter uppercase">ArchPulse v1.0.4</h1>
          </div>
          <p className="text-xs text-[#666] uppercase tracking-widest">System Health & Hardware Monitoring Interface</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={boostCooling}
            disabled={actionLoading === 'boost'}
            className={cn(
              "px-4 py-2 border border-[#00FF41] text-[#00FF41] text-[10px] uppercase tracking-widest hover:bg-[#00FF41] hover:text-black transition-all flex items-center gap-2",
              actionLoading === 'boost' && "opacity-50 cursor-not-allowed"
            )}
          >
            <Thermometer size={14} className={actionLoading === 'boost' ? "animate-spin" : ""} />
            {actionLoading === 'boost' ? 'Initiating...' : 'Emergency Cooling Boost'}
          </button>
          
          <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-[#666]">
            <div className="flex flex-col items-end">
              <span>Kernel Status</span>
              <span className="text-[#00FF41]">Operational</span>
            </div>
            <div className="flex flex-col items-end">
              <span>Last Update</span>
              <span className="text-white">{lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vitals */}
        <div className="lg:col-span-4 space-y-6">
          {/* CPU Card */}
          <section className="bg-[#111112] border border-[#1A1A1C] p-5 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cpu size={64} />
            </div>
            <div className="flex items-center gap-2 mb-6">
              <Cpu size={16} className="text-[#00FF41]" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Processor Unit</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#666] uppercase mb-1">Model</p>
                <p className="text-sm truncate">{data?.cpu.brand}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#666] uppercase mb-1">Cores</p>
                  <p className="text-lg font-bold">{data?.cpu.cores}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#666] uppercase mb-1">Speed</p>
                  <p className="text-lg font-bold">{data?.cpu.speed} GHz</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1A1A1C]">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] text-[#666] uppercase">Thermal State</p>
                  <p className={cn("text-xl font-bold", getTempColor(data?.cpu.temp || 0))}>
                    {data?.cpu.temp ? `${data.cpu.temp}°C` : 'N/A'}
                  </p>
                </div>
                <div className="h-1 bg-[#1A1A1C] w-full rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((data?.cpu.temp || 0), 100)}%` }}
                    className={cn("h-full", (data?.cpu.temp || 0) > 75 ? "bg-red-500" : "bg-[#00FF41]")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* GPU Card */}
          <section className="bg-[#111112] border border-[#1A1A1C] p-5 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Monitor size={64} />
            </div>
            <div className="flex items-center gap-2 mb-6">
              <Monitor size={16} className="text-[#00FF41]" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Graphics Unit</h2>
            </div>
            <div className="space-y-4">
              {data?.graphics.map((gpu, idx) => (
                <div key={idx} className="pb-3 border-b border-[#1A1A1C] last:border-0 last:pb-0">
                  <p className="text-[10px] text-[#666] uppercase mb-1">{gpu.vendor}</p>
                  <p className="text-sm font-bold truncate">{gpu.model}</p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-[9px] text-[#444] uppercase">VRAM</p>
                      <p className="text-xs">{gpu.vram ? `${gpu.vram} MB` : 'SHARED'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#444] uppercase">BUS</p>
                      <p className="text-xs">{gpu.bus}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Load Reduction Center */}
          <section className="bg-[#111112] border border-[#1A1A1C] p-5 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-[#00FF41]" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Load Reduction Center</h2>
            </div>
            <p className="text-[9px] text-[#666] uppercase mb-4">Terminate high-CPU processes to reduce heat</p>
            <div className="space-y-2">
              {data?.topProcesses.map((proc) => (
                <div key={proc.pid} className="flex items-center justify-between p-2 bg-black/30 border border-[#1A1A1C] rounded-sm group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold truncate">{proc.name}</span>
                      <span className="text-[8px] text-[#444]">PID: {proc.pid}</span>
                    </div>
                    <div className="flex gap-3 text-[8px] text-[#666] uppercase">
                      <span>CPU: {proc.cpu.toFixed(1)}%</span>
                      <span>MEM: {proc.mem.toFixed(1)}%</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => killProcess(proc.pid)}
                    disabled={actionLoading === `kill-${proc.pid}`}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[8px] border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    {actionLoading === `kill-${proc.pid}` ? '...' : 'KILL'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Graphs & Detailed Stats */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Load Chart */}
          <section className="bg-[#111112] border border-[#1A1A1C] p-6 rounded-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#00FF41]" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Real-time Performance Metrics</h2>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00FF41]" />
                  <span className="text-[9px] uppercase text-[#666]">CPU Load</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] uppercase text-[#666]">Memory</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00FF41" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1C" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#333" 
                    fontSize={9} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#333" 
                    fontSize={9} 
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111112', border: '1px solid #1A1A1C', fontSize: '10px' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="load" 
                    stroke="#00FF41" 
                    fillOpacity={1} 
                    fill="url(#colorLoad)" 
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mem" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorMem)" 
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Network Stats */}
            <section className="bg-[#111112] border border-[#1A1A1C] p-5 rounded-sm">
              <div className="flex items-center gap-2 mb-6">
                <Globe size={16} className="text-[#00FF41]" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Network Hardware</h2>
              </div>
              <div className="space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {data?.network.map((net, idx) => (
                  <div key={idx} className="p-2 bg-black/20 border border-[#1A1A1C] rounded-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold">{net.iface}</span>
                      <span className={cn("text-[8px] px-1 rounded", net.operstate === 'up' ? "bg-[#00FF41]/10 text-[#00FF41]" : "bg-red-500/10 text-red-500")}>
                        {net.operstate.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[9px] text-[#666]">{net.ip4 || 'NO IP'}</p>
                    <p className="text-[9px] text-[#444] mt-1">SPEED: {net.speed ? `${net.speed} Mbps` : 'N/A'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* BIOS & Firmware */}
            <section className="bg-[#111112] border border-[#1A1A1C] p-5 rounded-sm">
              <div className="flex items-center gap-2 mb-6">
                <Info size={16} className="text-[#00FF41]" />
                <h2 className="text-xs font-bold uppercase tracking-widest">BIOS / Firmware</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-[#666] uppercase">Vendor</p>
                  <p className="text-xs font-bold">{data?.bios.vendor}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#666] uppercase">Version</p>
                  <p className="text-xs font-bold">{data?.bios.version}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#666] uppercase">Release Date</p>
                  <p className="text-xs font-bold">{data?.bios.releaseDate}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory Allocation */}
            <section className="bg-[#111112] border border-[#1A1A1C] p-5 rounded-sm">
              <div className="flex items-center gap-2 mb-6">
                <Layers size={16} className="text-[#00FF41]" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Memory Allocation</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] uppercase">
                  <span className="text-[#666]">Used / Total</span>
                  <span>{formatBytes(data?.memory.used || 0)} / {formatBytes(data?.memory.total || 0)}</span>
                </div>
                <div className="h-2 bg-[#1A1A1C] w-full rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((data?.memory.used || 0) / (data?.memory.total || 1)) * 100}%` }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Storage Stats */}
            <section className="bg-[#111112] border border-[#1A1A1C] p-5 rounded-sm">
              <div className="flex items-center gap-2 mb-6">
                <HardDrive size={16} className="text-[#00FF41]" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Storage Volumes</h2>
              </div>
              <div className="space-y-4 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {data?.storage.map((disk, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase">
                      <span className="text-white truncate max-w-[100px]">{disk.mount}</span>
                      <span className="text-[#666]">{disk.use}%</span>
                    </div>
                    <div className="h-1 bg-[#1A1A1C] w-full rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00FF41]" 
                        style={{ width: `${disk.use}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Detailed Hardware Info Table */}
          <section className="bg-[#111112] border border-[#1A1A1C] rounded-sm overflow-hidden">
            <div className="p-4 border-b border-[#1A1A1C] flex items-center gap-2">
              <Info size={14} className="text-[#666]" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest">Hardware Inventory Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] uppercase tracking-wider">
                <thead>
                  <tr className="bg-[#1A1A1C] text-[#666]">
                    <th className="px-4 py-2 text-left font-medium">Component</th>
                    <th className="px-4 py-2 text-left font-medium">Metric</th>
                    <th className="px-4 py-2 text-left font-medium">Value</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1C]">
                  <tr>
                    <td className="px-4 py-3 text-[#999]">Mainboard</td>
                    <td className="px-4 py-3 text-[#999]">Voltage VCC</td>
                    <td className="px-4 py-3">1.05V</td>
                    <td className="px-4 py-3 text-[#00FF41]">NOMINAL</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#999]">CPU Socket</td>
                    <td className="px-4 py-3 text-[#999]">Thermal Margin</td>
                    <td className="px-4 py-3">24.5°C</td>
                    <td className="px-4 py-3 text-[#00FF41]">SAFE</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#999]">DRAM Bus</td>
                    <td className="px-4 py-3 text-[#999]">Voltage VDD</td>
                    <td className="px-4 py-3">1.35V</td>
                    <td className="px-4 py-3 text-[#00FF41]">NOMINAL</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#999]">PCIe Rail</td>
                    <td className="px-4 py-3 text-[#999]">Power Draw</td>
                    <td className="px-4 py-3">12.4W</td>
                    <td className="px-4 py-3 text-[#00FF41]">NOMINAL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B] border-t border-[#1A1A1C] px-6 py-2 flex justify-between items-center text-[9px] uppercase tracking-[0.2em] text-[#444]">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
            <span>Link: Established</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
            <span>Probe: Active</span>
          </div>
        </div>
        <div className="flex gap-6">
          <span>OS: Arch Linux x86_64</span>
          <span>Uptime: 14d 02h 45m</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0A0A0B;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1A1C;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}} />
    </div>
  );
}
