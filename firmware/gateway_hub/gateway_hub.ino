/**
 * AXON MSME Predictive Maintenance — Gateway Hub Firmware
 * Platform: ESP32 (Arduino core)
 * Function: Listens for offline ESP-NOW packets from machine nodes.
 *           On detecting an anomaly, formats a JSON payload matching agentFlow.ts
 *           and dispatches an HTTP POST webhook over Wi-Fi to trigger the WhatsApp agent.
 */

#include <esp_now.h>
#include <WiFi.h>
#include <HTTPClient.h>

// -----------------------------------------------------------------------------
// Pin Definitions (Matching 3D GatewayNode layout)
// -----------------------------------------------------------------------------
#define PIN_LED_PWR   4   // Steady Green: Power ON
#define PIN_LED_RX   16   // Pulse Sky Blue: ESP-NOW Mesh Packet RX
#define PIN_LED_WIFI 17   // Steady Green: Cloud Wi-Fi / LTE Connected
#define PIN_LED_ALM   5   // Flashing Red: Machine Anomaly Alarm

// -----------------------------------------------------------------------------
// Wi-Fi & Webhook Configuration
// -----------------------------------------------------------------------------
const char *WIFI_SSID = "MSME_FACTORY_WIFI";
const char *WIFI_PASS = "FactoryNet2026";
const char *WEBHOOK_URL = "http://axon-cloud.internal/api/webhook/alert";

// -----------------------------------------------------------------------------
// Packet Struct (Must match edge_node.ino)
// -----------------------------------------------------------------------------
typedef struct __attribute__((packed)) {
  char     node_id[8];
  uint32_t uptime_ms;
  float    acoustic;
  float    pressure;
  float    vib_rms;
  float    temp_c;
  uint8_t  anomaly;
} NodePacket;

NodePacket rx_pkt;
volatile bool new_pkt = false;

// ESP-NOW Receive Callback (compatible with ESP32 core v2 & v3)
#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 0, 0)
void on_data_recv(const esp_now_recv_info *info, const uint8_t *data, int len) {
#else
void on_data_recv(const uint8_t *mac, const uint8_t *data, int len) {
#endif
  if (len == sizeof(NodePacket)) {
    memcpy(&rx_pkt, data, sizeof(NodePacket));
    new_pkt = true;
  }
}

// -----------------------------------------------------------------------------
// Cloud Webhook Dispatch (Triggers WhatsApp agentFlow.ts)
// -----------------------------------------------------------------------------
void send_cloud_alert(const NodePacket &p) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] Wi-Fi not connected. Cannot send webhook.");
    return;
  }

  HTTPClient http;
  http.begin(WEBHOOK_URL);
  http.addHeader("Content-Type", "application/json");

  // Format JSON payload matching AXON agentFlow structure
  char json[384];
  snprintf(json, sizeof(json),
    "{"
      "\"node_id\":\"%s\","
      "\"machine\":\"MSME Compressor C-01\","
      "\"anomaly\":true,"
      "\"severity\":%d,"
      "\"telemetry\":{"
        "\"acoustic\":%.2f,"
        "\"pressure_bar\":%.1f,"
        "\"vibration_mms\":%.2f,"
        "\"temp_c\":%.1f"
      "},"
      "\"agent_action\":\"DISPATCH_MECHANIC\","
      "\"idle_window\":\"14:00 - 16:00\","
      "\"recommended_tech\":\"Ramesh Kumar (4.9 rating)\""
    "}",
    p.node_id, p.anomaly, p.acoustic, p.pressure, p.vib_rms, p.temp_c
  );

  Serial.println("[WEBHOOK TX] Dispatching alert to Cloud Agent...");
  int code = http.POST(json);
  Serial.printf("[WEBHOOK RX] HTTP Response: %d\n", code);
  http.end();
}

// -----------------------------------------------------------------------------
// Setup & Loop
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(PIN_LED_PWR, OUTPUT);
  pinMode(PIN_LED_RX, OUTPUT);
  pinMode(PIN_LED_WIFI, OUTPUT);
  pinMode(PIN_LED_ALM, OUTPUT);

  digitalWrite(PIN_LED_PWR, HIGH);
  digitalWrite(PIN_LED_RX, LOW);
  digitalWrite(PIN_LED_WIFI, LOW);
  digitalWrite(PIN_LED_ALM, LOW);

  // Connect to factory Wi-Fi in dual AP+STA mode
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.println("[INIT] Connecting to Wi-Fi...");

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERR] ESP-NOW Hub init failed");
    return;
  }

  esp_now_register_recv_cb(on_data_recv);

  Serial.print("[OK] Gateway Hub Listening. MAC: ");
  Serial.println(WiFi.macAddress());
}

uint32_t rx_flash_until = 0;
uint32_t last_wifi_chk  = 0;
uint32_t last_alert_tx  = 0;

void loop() {
  uint32_t now = millis();

  // Wi-Fi status LED
  if (now - last_wifi_chk >= 1000) {
    last_wifi_chk = now;
    digitalWrite(PIN_LED_WIFI, WiFi.status() == WL_CONNECTED ? HIGH : LOW);
  }

  // Handle incoming mesh packet
  if (new_pkt) {
    new_pkt = false;
    rx_flash_until = now + 120; // Flash RX LED for 120 ms
    digitalWrite(PIN_LED_RX, HIGH);

    Serial.printf("[MESH RX] Node: %s | Ac: %.2f | Pr: %.1f bar | Vib: %.2f | Anomaly: %d\n",
      rx_pkt.node_id, rx_pkt.acoustic, rx_pkt.pressure, rx_pkt.vib_rms, rx_pkt.anomaly
    );

    // If anomaly flagged, trigger alarm and cloud webhook (rate-limited to 1 per 10 s)
    if (rx_pkt.anomaly > 0) {
      digitalWrite(PIN_LED_ALM, HIGH);
      if (now - last_alert_tx >= 10000) {
        last_alert_tx = now;
        send_cloud_alert(rx_pkt);
      }
    } else {
      digitalWrite(PIN_LED_ALM, LOW);
    }
  }

  // Turn off RX flash LED
  if (rx_flash_until && now > rx_flash_until) {
    digitalWrite(PIN_LED_RX, LOW);
    rx_flash_until = 0;
  }
}
