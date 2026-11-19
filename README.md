# AXON · MSME Predictive Maintenance & Autonomous Dispatch

> **Low-Cost Industrial Condition Monitoring & Autonomous Maintenance Dispatch for MSMEs**  
> *Concept Digital Twin, ESP32 ESP-NOW Firmware & Autonomous Dispatch Swarm.*

---

## 1. Executive Summary

Micro, Small, and Medium Enterprises (MSMEs) operate over 60% of critical manufacturing machinery—reciprocating compressors, pumps, presses, and motors—yet remain cut off from predictive maintenance. Enterprise SCADA systems and cloud vibration platforms require tens of thousands of dollars in sensor licensing, industrial PLC gateways, and complex software installations.

**AXON** delivers predictive maintenance designed specifically for MSME constraints:
1. **Low-Cost Edge Sensing:** Retrofit acoustic and pressure transducers on standard machines.
2. **7-Day Dynamic Self-Calibration:** Unsupervised statistical baselining that adapts to each machine's specific environment without requiring machine learning training runs or pre-labelled datasets.
3. **Offline Factory Mesh:** 2.4 GHz ESP-NOW telemetry packets route to a central gateway without needing factory Wi-Fi at every machine asset.
4. **Autonomous WhatsApp Dispatch:** An agentic workflow detects anomalies, schedules maintenance during planned idle windows, locates local technicians, and delivers 1-click interactive approval notifications directly to the factory owner's phone.
5. **Tier 1 Zero-Hardware Acoustic DSP:** Live in-browser microphone Fourier frequency analysis for immediate retrofitting without physical sensors.

---

## 2. Core Architecture Pillars

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        AXON DISTRIBUTED TOPOLOGY                       │
├────────────────────────┬─────────────────────┬─────────────────────────┤
│    EDGE HARDWARE       │     GATEWAY HUB     │    AUTONOMOUS DISPATCH  │
│  (Compressor Rig)      │   (Offline Mesh)    │     (Cloud Swarm)       │
│                        │                     │                         │
│  [Acoustic Puck]       │   [ESP32 Gateway]   │   [Dynamic Baseline]    │
│  [Pressure Sensor] ───►│   ESP-NOW RX        ├──►│   Welford 3σ Bounds │
│  [ESP32 Edge Node]     │   Wi-Fi Backhaul    │   [Agent State Machine] │
│  ADC1 + Welford Filter │   Status LEDs       │   [WhatsApp Smartphone] │
└────────────────────────┴─────────────────────┴─────────────────────────┘
```

### Pillar 1: High-Fidelity 3D Digital Twin (`CompressorRig.tsx` & `Scene.tsx`)
A procedural industrial air compressor twin built with `@react-three/fiber` and `@react-three/drei`:
- Procedural crankcase, cooling fins, ASME pressure relief valve, oil inspection port, and ribbed belt guard.
- Realistic cast-iron, machined steel, and bronze physical materials.
- Procedural wiring harnesses with strain-relief glands connecting sensors back to local terminal boxes.
- Floating 3D HUD telemetry callouts styled in flat industrial design (`#111317`, hairline borders).

### Pillar 2: 7-Day Unsupervised Baseline (`useCalibration.ts`)
Instead of rigid static limits, AXON uses Welford's online algorithm to fast-forward 7 days of operational telemetry in 10 seconds:
- Tracks running sample count, sample mean ($\mu$), and squared deviations ($M_2$).
- Computes sample variance ($\sigma^2$) and standard deviation ($\sigma$).
- Establishes a dynamic $3\sigma$ operational envelope ($\text{Threshold} = \mu + 3\sigma$).
- Prevents false alarms from ambient factory floor noise while immediately catching mechanical degradation.

### Pillar 3: Offline ESP-NOW Factory Mesh (`GatewayNode.tsx`)
MSME factory floors often have dead zones or spotty Wi-Fi coverage:
- Edge nodes broadcast compact binary telemetry packets over ESP-NOW (connectionless peer-to-peer 2.4 GHz RF).
- The central wall-mounted Gateway Hub receives packets, displays real-time animated particle mesh pings, and manages cloud backhaul routing.
- Rugged IP67 enclosure with reactive emissive LEDs (Power, Mesh RX pulse, Cloud Wi-Fi, and Alarm).

### Pillar 4: Autonomous WhatsApp Dispatch (`agentFlow.ts` & `MockPhoneUI.tsx`)
An autonomous state machine handling end-to-end incident response:
- **`DETECTED`**: Gateway catches dynamic baseline breach.
- **`SCHEDULING`**: Searches production schedules to isolate upcoming idle windows (e.g., between shifts).
- **`LOGISTICS`**: Locates certified nearby service technicians and parts inventory.
- **`COMMS`**: Generates structured WhatsApp message payloads with live telemetry snapshots.
- **`WAITING_APPROVAL`**: Factory owner receives interactive **Approve Dispatch** or **Dismiss / False Alarm** options directly on their mobile device.

### Pillar 5: Tier 1 Zero-Hardware Acoustic DSP (`audioDSP.ts` & `Tier1MicMode.tsx`)
For workshops with zero upfront hardware budget:
- Live microphone streaming via Web Audio API (`AudioContext` and 2048-bin `AnalyserNode`).
- Bandpass filtering isolating mechanical flutter and ultrasonic bearing hiss.
- Real-time HTML5 Canvas visualizer rendering frequency bins, live statistical mean, and dynamic standard deviation threshold envelope.

### Pillar 6: Physical ESP32 Firmware (`firmware/`)
Deployable production C++ firmware ready to flash directly onto ESP32 hardware:
- `firmware/edge_node/edge_node.ino`: Compressor edge node reader with Welford baseline filter and ESP-NOW packet transmitter.
- `firmware/gateway_hub/gateway_hub.ino`: Central gateway hub receiver, status LED driver, and HTTP POST webhook dispatcher.
- `firmware/WIRING.md`: Complete pinout mapping, 1:2 voltage divider schematics for 5V pressure transducers, and decoupling guidelines.

---

## 3. Quick Start

### Prerequisites
- Node.js 18+ (tested with Node 20 / 24)
- npm or pnpm

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Awwad-007/AXON.git
cd AXON

# Install dependencies
npm install

# Start local development server (http://localhost:5173)
npm run dev

# Run full TypeScript validation
npm run typecheck

# Run complete automated test suite (98 tests across 11 suites)
npm test

# Build production bundle
npm run build
```

---

## 4. Evaluator Walkthrough (Demo Path)

1. **Launch AXON SIM View:**  
   Open the application. The default view loads the 3D twin of the MSME Compressor Rig, the wall-mounted Gateway Hub, and the WhatsApp smartphone UI.
2. **Run Unsupervised Calibration:**  
   In the WhatsApp phone drawer, tap **"Start 7-Day Calibration"**. Watch the progress bar fast-forward through 7 operational days, locking in the baseline mean ($\mu$) and standard deviation ($\sigma$).
3. **Inject Fault Anomaly:**  
   Tap **"Simulate Anomaly"** or advance the fault sliders in the SCADA pane. An anomaly packet triggers an animated mesh ping travelling from the compressor sensors to the Gateway Node.
4. **Inspect Autonomous Dispatch:**  
   Watch the WhatsApp agent transition through Scheduling, Logistics, and Dispatch. Review the interactive alert message and test the **"Approve Dispatch"** or **"Dismiss / Re-calibrate"** responses.
5. **Switch Views:**  
   Use the header toggle `[SCADA] ⇄ [AXON SIM] ⇄ [AXON LIVE MIC]` to inspect the enterprise SCADA telemetry dashboard or switch to browser-based microphone DSP analysis.

---

## 5. Deployment

This repository is optimized for one-click deployment on **Vercel**:
- Production build output: `dist/`
- SPA routing configured via root `vercel.json`
- Strict zero-dependency client architecture (all 3D models and DSP engines are procedural and bundled locally).
