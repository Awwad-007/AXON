# AXON Hardware Wiring & Pinout Guide

This guide documents the hardware pinout and wiring schematics for the ESP32 Edge Node (`firmware/edge_node/`) and the central Gateway Hub (`firmware/gateway_hub/`).

---

## 1. Edge Node Pinout (MSME Compressor Rig)

The Edge Node mounts directly to the air compressor in an IP65 enclosure. It reads analog telemetry from acoustic, pressure, vibration, and temperature transducers, computes a dynamic baseline on-chip, and broadcasts via ESP-NOW.

| ESP32 Pin | Function | Peripheral / Channel | Target Component | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **GPIO 34** | Analog Input | ADC1_CH6 | Acoustic Sensor Puck | High-frequency acoustic / ultrasonic envelope (0–3.3V) |
| **GPIO 35** | Analog Input | ADC1_CH7 | Pressure Transducer | Piezoresistive G1/4" sensor via voltage divider (0.33–2.97V) |
| **GPIO 32** | Analog Input | ADC1_CH4 | Vibration Sensor | Piezo / accelerometer RMS envelope (0–3.3V) |
| **GPIO 33** | Analog Input | ADC1_CH5 | Temperature Sensor | NTC thermistor / LM35 analog proxy |
| **GPIO 2**  | Digital Output | GPIO / Onboard | Status / Heartbeat LED | Blinks at 1 Hz normal; solid during calibration |
| **GPIO 4**  | Digital Output | GPIO | Alarm LED | High when anomaly is detected |
| **3V3**     | Power Out | 3.3V LDO | Acoustic & Vibration Pucks | Regulated clean 3.3V rail |
| **VIN / 5V**| Power In / Out | 5.0V USB / DC | Pressure Transducer Supply | 5V DC supply for industrial transducer |
| **GND**     | Ground | Common Ground | All Sensors & LEDs | Single-point star ground to minimize analog noise |

> **ADC Selection Note:** ESP-NOW uses the Wi-Fi radio. When Wi-Fi/ESP-NOW is active, the ESP32's **ADC2 is blocked**. All analog sensors are strictly wired to **ADC1** (GPIO 32–39) to prevent measurement lockups.

---

## 2. Gateway Hub Pinout (Wall / DIN-Rail Enclosure)

The Gateway Hub receives offline ESP-NOW packets from edge nodes, drives physical status indicators matching the 3D digital twin (`GatewayNode.tsx`), and dispatches HTTP POST webhooks over Wi-Fi.

| ESP32 Pin | Function | Indicator / Signal | LED Color | State Description |
| :--- | :--- | :--- | :--- | :--- |
| **GPIO 4**  | Digital Output | Power Status | Steady Green | Board powered and operational |
| **GPIO 16** | Digital Output | Mesh Packet RX | Pulse Sky Blue | 80 ms pulse upon receiving ESP-NOW packet |
| **GPIO 17** | Digital Output | Cloud / Wi-Fi | Steady Green | Connected to factory Wi-Fi / LTE backhaul |
| **GPIO 5**  | Digital Output | Anomaly Alarm | Flashing Red | Machine anomaly alert received and webhook dispatched |
| **VIN / 5V**| Power In | 5.0V DC Input | — | Industrial DIN-rail 5V 2A power supply or USB |
| **GND**     | Ground | Common Ground | — | Earth / chassis ground |

---

## 3. Pressure Transducer Voltage Divider

Industrial pressure transducers (0–16 bar gauge) typically output **0.5V to 4.5V** powered by 5V. To protect the ESP32 ADC (3.3V maximum input), wire a passive 1:2 resistive voltage divider:

```text
Transducer Signal Out (0.5V - 4.5V)
       │
      ┌┴┐
      │ │ R1 (10 kΩ, 1% tolerance)
      └┬┘
       ├──────> ESP32 GPIO 35 (ADC1_CH7) [Scaled: 0.33V - 2.97V]
      ┌┴┐
      │ │ R2 (20 kΩ, 1% tolerance)
      └┬┘
       │
      GND (Common)
```

Scaling formula applied in firmware:
$$\text{Scaled Voltage } V_{\text{div}} = V_{\text{out}} \times \frac{R_2}{R_1 + R_2} = V_{\text{out}} \times \frac{2}{3}$$
$$4.5\text{V} \times \frac{2}{3} = 3.00\text{V} \quad (\le 3.3\text{V threshold})$$

---

## 4. Power & Decoupling Recommendations

1. **Bulk Capacitance:** Place a **100 µF / 16V** electrolytic capacitor across ESP32 `VIN` and `GND` to buffer current surges (~250 mA bursts) when the RF radio transmits ESP-NOW packets.
2. **Noise Suppression:** Place a **0.1 µF (100 nF)** ceramic decoupling capacitor between each analog input pin (GPIO 32, 33, 34, 35) and `GND` right at the ESP32 header to filter motor EMI.
3. **Shielding:** Ground the braided outer shield of sensor cables to chassis ground at the machine frame only (single-ended grounding to prevent ground loops).
