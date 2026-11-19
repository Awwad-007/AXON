/**
 * AXON MSME Predictive Maintenance — Edge Node Firmware
 * Platform: ESP32 (Arduino core)
 * Function: Reads acoustic, pressure, vibration & temperature sensors on
 *           an MSME compressor. Computes dynamic baseline (online mean + variance)
 *           and broadcasts telemetry packets via ESP-NOW offline mesh.
 */

#include <esp_now.h>
#include <WiFi.h>

// -----------------------------------------------------------------------------
// Pin Definitions
// -----------------------------------------------------------------------------
#define PIN_ACOUSTIC   34  // ADC1_CH6 (Acoustic emission / ultrasonic flutter)
#define PIN_PRESSURE   35  // ADC1_CH7 (0-16 bar piezoresistive transducer)
#define PIN_VIBRATION  32  // ADC1_CH4 (Piezo/accelerometer analog envelope)
#define PIN_TEMP       33  // ADC1_CH5 (NTC / LM35 / DS18B20 analog proxy)
#define PIN_LED_OK      2  // Built-in status LED (Heartbeat / calibration)
#define PIN_LED_ALM     4  // Anomaly alert LED

// -----------------------------------------------------------------------------
// ESP-NOW Mesh Configuration
// -----------------------------------------------------------------------------
// Gateway MAC address (replace with target gateway hub MAC)
uint8_t gw_mac[] = { 0x24, 0x6F, 0x28, 0xAA, 0xBB, 0xCC };

typedef struct __attribute__((packed)) {
  char     node_id[8];     // "COMP_01"
  uint32_t uptime_ms;      // Node uptime
  float    acoustic;       // Normalized acoustic score (0.0 - 1.0)
  float    pressure;       // Gauge pressure (bar)
  float    vib_rms;        // Vibration RMS (mm/s)
  float    temp_c;         // Temperature (deg C)
  uint8_t  anomaly;        // 0 = Normal, 1 = Warning, 2 = Critical
} NodePacket;

NodePacket pkt;

// -----------------------------------------------------------------------------
// Dynamic Baseline Calibration (Welford's Online Algorithm)
// -----------------------------------------------------------------------------
struct Baseline {
  uint32_t count;
  float    mean;
  float    m2;
  float    std;
  float    upper;
};

Baseline b_ac = { 0, 0.0f, 0.0f, 0.05f, 0.25f };
Baseline b_vb = { 0, 0.0f, 0.0f, 0.15f, 1.80f };

const float K_SIGMA = 3.0f;          // 3-sigma dynamic threshold
bool  calibrated   = false;
const uint16_t CALIB_SAMPLES = 100; // 10 s @ 10 Hz

void update_baseline(Baseline &b, float val) {
  b.count++;
  float d1 = val - b.mean;
  b.mean += d1 / b.count;
  float d2 = val - b.mean;
  b.m2 += d1 * d2;
  if (b.count > 1) {
    b.std = sqrtf(b.m2 / (b.count - 1));
    b.upper = b.mean + K_SIGMA * b.std;
  }
}

// -----------------------------------------------------------------------------
// Sensor Read Helpers
// -----------------------------------------------------------------------------
float read_acoustic() {
  int raw = analogRead(PIN_ACOUSTIC);
  return (float)raw / 4095.0f; // Normalized 0-1
}

float read_pressure() {
  // Standard 0.5V - 4.5V transducer scaled to 0-16 bar (with 3.3V divider)
  int raw = analogRead(PIN_PRESSURE);
  float v = (raw / 4095.0f) * 3.3f;
  float bar = (v - 0.33f) * (16.0f / (2.97f - 0.33f));
  return bar < 0.0f ? 0.0f : bar;
}

float read_vibration() {
  int raw = analogRead(PIN_VIBRATION);
  return (raw / 4095.0f) * 7.0f; // Scale to 0-7 mm/s RMS
}

float read_temp() {
  int raw = analogRead(PIN_TEMP);
  return 20.0f + (raw / 4095.0f) * 70.0f; // 20 C to 90 C
}

// -----------------------------------------------------------------------------
// Setup & Loop
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED_OK, OUTPUT);
  pinMode(PIN_LED_ALM, OUTPUT);
  analogReadResolution(12);

  // Initialize Wi-Fi in Station mode for ESP-NOW (no AP connection needed)
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERR] ESP-NOW init failed");
    return;
  }

  // Register peer gateway
  esp_now_peer_info_t peer;
  memset(&peer, 0, sizeof(peer));
  memcpy(peer.peer_addr, gw_mac, 6);
  peer.channel = 1;
  peer.encrypt = false;
  esp_now_add_peer(&peer);

  strncpy(pkt.node_id, "COMP_01", sizeof(pkt.node_id));
  Serial.println("[OK] AXON Edge Node initialized. Calibrating baseline (10s)...");
}

uint32_t last_tick = 0;
uint32_t last_tx   = 0;
uint8_t  persist   = 0;

void loop() {
  uint32_t now = millis();

  // 10 Hz sampling tick (100 ms)
  if (now - last_tick >= 100) {
    last_tick = now;

    float ac = read_acoustic();
    float pr = read_pressure();
    float vb = read_vibration();
    float tp = read_temp();

    // 10-second initial calibration window
    if (!calibrated) {
      update_baseline(b_ac, ac);
      update_baseline(b_vb, vb);
      digitalWrite(PIN_LED_OK, (now / 200) % 2); // Fast blink during calib

      if (b_ac.count >= CALIB_SAMPLES) {
        calibrated = true;
        digitalWrite(PIN_LED_OK, HIGH);
        Serial.printf("[CALIB DONE] Acoustic lim: %.3f, Vib lim: %.2f mm/s\n", b_ac.upper, b_vb.upper);
      }
      return;
    }

    // Dynamic threshold detection
    bool breach = (ac > b_ac.upper) || (vb > b_vb.upper);
    if (breach) {
      persist++;
      if (persist >= 3) {
        pkt.anomaly = (ac > b_ac.upper * 1.4f || vb > b_vb.upper * 1.5f) ? 2 : 1;
        digitalWrite(PIN_LED_ALM, HIGH);
      }
    } else {
      persist = 0;
      pkt.anomaly = 0;
      digitalWrite(PIN_LED_ALM, LOW);
    }

    pkt.uptime_ms = now;
    pkt.acoustic  = ac;
    pkt.pressure  = pr;
    pkt.vib_rms   = vb;
    pkt.temp_c    = tp;

    // Transmit: immediately on anomaly, or every 2 seconds as heartbeat
    if (pkt.anomaly > 0 || (now - last_tx >= 2000)) {
      last_tx = now;
      esp_now_send(gw_mac, (uint8_t *)&pkt, sizeof(pkt));
      Serial.printf("[TX] ac=%.2f pr=%.1f vb=%.2f tp=%.1f alm=%d\n", ac, pr, vb, tp, pkt.anomaly);
    }
  }
}
