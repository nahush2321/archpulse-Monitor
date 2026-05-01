# ArchPulse Hardware Monitor v1.0.4

ArchPulse is a professional-grade system health and hardware monitoring dashboard designed for Arch Linux. It provides real-time telemetry, hardware inventory, and emergency control protocols through a sleek, high-density terminal-inspired interface.

## 🚀 Key Features

### 1. Real-time Vitals Monitoring
- **CPU Intelligence**: Monitor processor brand, clock speed, core count, and real-time load percentage.
- **Thermal Tracking**: Color-coded temperature monitoring with safety threshold warnings.
- **Power Management**: Voltage stability tracking and battery reserve telemetry (for mobile units).

### 2. High-Performance Load Reduction
- **Process Manager**: Automatically identifies the top 5 CPU-consuming processes.
- **Direct Mitigation**: Terminate high-load processes directly from the dashboard using the "KILL" interface to immediately reduce heat and system stress.

### 3. Hardware Inventory & Firmware
- **GPU Telemetry**: Detailed information on graphics controllers, including VRAM and bus details.
- **Network Probe**: Status tracking for all physical and virtual network interfaces, including IP assignments and speeds.
- **Firmware Info**: Quick access to BIOS vendor, version, and release date.

### 4. Interactive Data Visualization
- **Performance Curves**: Real-time Area Charts tracking the relationship between CPU load and Memory allocation over time.
- **Storage Mapping**: Visual representation of all mounted volumes and filesystem usage.

### 5. Emergency Cooling Protocols
- **Cooling Boost**: Integrated manual override button to initiate hardware-level cooling protocols (requires compatible hardware drivers on the host system).

---

## 🛠 Technical Stack

- **Frontend**: React 18, Vite, Tailwind CSS (Styling)
- **Animation**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Charts**: Recharts (D3-based)
- **Backend**: Node.js & Express
- **Hardware Interface**: `systeminformation` library

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- Arch Linux (or any Linux distribution) with hardware sensor drivers (`lm_sensors`) installed.

### Installation Steps

1. **Clone or download the project** to your local machine.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Hardware Permissions** (Important):
   To allow the server to collect thermal data and kill processes, you may need to run the application with elevated privileges or add your user to the `hwmon` and `proc` groups.
   ```bash
   sudo npm run dev
   ```

### Running the App
- **Development Mode**:
  ```bash
  npm run dev
  ```
  Access the dashboard at `http://localhost:3000`

- **Build for Production**:
  ```bash
  npm run build
  npm start
  ```

---

## ⚠️ Hardware Compatibility Note
While ArchPulse is built to be universal, features like **Voltage Tracking** and **Fan Control (Boost)** depend on your specific motherboard drivers and the exposure of `/sys/class/hwmon` interfaces. Ensure `lm_sensors` is configured on your Arch system via `sensors-detect`.
