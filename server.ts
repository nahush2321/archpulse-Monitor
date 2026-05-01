import express from "express";
import { createServer as createViteServer } from "vite";
import si from "systeminformation";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get("/api/system-health", async (req, res) => {
    try {
      const [
        cpu,
        temp,
        mem,
        load,
        battery,
        fs,
        processes,
        graphics,
        net,
        bios,
      ] = await Promise.all([
        si.cpu(),
        si.cpuTemperature(),
        si.mem(),
        si.currentLoad(),
        si.battery(),
        si.fsSize(),
        si.processes(),
        si.graphics(),
        si.networkInterfaces(),
        si.bios(),
      ]);

      res.json({
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          speed: cpu.speed,
          cores: cpu.cores,
          temp: temp.main,
          maxTemp: temp.max,
          load: load.currentLoad,
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used,
          active: mem.active,
        },
        power: {
          hasBattery: battery.hasBattery,
          isCharging: battery.isCharging,
          percent: battery.percent,
          voltage: battery.voltage,
          capacityUnit: battery.capacityUnit,
        },
        storage: fs.map(f => ({
          fs: f.fs,
          size: f.size,
          used: f.used,
          use: f.use,
          mount: f.mount
        })),
        topProcesses: processes.list
          .sort((a, b) => b.cpu - a.cpu)
          .slice(0, 5)
          .map(p => ({
            pid: p.pid,
            name: p.name,
            cpu: p.cpu,
            mem: p.mem,
            user: p.user
          })),
        graphics: graphics.controllers.map(g => ({
          model: g.model,
          vram: g.vram,
          bus: g.bus,
          vendor: g.vendor
        })),
        network: net.map(n => ({
          iface: n.iface,
          ip4: n.ip4,
          speed: n.speed,
          operstate: n.operstate
        })),
        bios: {
          vendor: bios.vendor,
          version: bios.version,
          releaseDate: bios.releaseDate
        },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error fetching system info:", error);
      res.status(500).json({ error: "Failed to fetch system information" });
    }
  });

  // Action: Kill Process
  app.post("/api/actions/kill/:pid", async (req, res) => {
    const { pid } = req.params;
    try {
      // In a real Arch system, this might need sudo or specific capabilities
      process.kill(parseInt(pid), 'SIGTERM');
      res.json({ success: true, message: `Process ${pid} terminated.` });
    } catch (error) {
      res.status(500).json({ error: `Failed to kill process ${pid}: ${error}` });
    }
  });

  // Action: Fan Boost (Hardware Dependent)
  app.post("/api/actions/boost-cooling", async (req, res) => {
    try {
      // This is a placeholder for hardware-specific fan control.
      // On Arch, this might involve:
      // 1. exec("echo 255 > /sys/class/hwmon/hwmonX/pwmY")
      // 2. exec("systemctl start fancontrol")
      // 3. exec("sensors -s")
      
      // For demonstration, we'll log the intent. 
      // In a real environment, you'd map this to your specific hardware utility.
      console.log("Cooling boost requested...");
      res.json({ success: true, message: "Cooling protocols initiated. Fans set to maximum (if supported)." });
    } catch (error) {
      res.status(500).json({ error: "Failed to initiate cooling boost." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
