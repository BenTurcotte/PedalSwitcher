#include <Ethernet.h>

#define PIN_FSW_PREV 41
#define PIN_FSW_TUNE 42
#define PIN_FSW_BOOST 43
#define PIN_FSW_4 44
#define PIN_FSW_5 45
#define PIN_FSW_NEXT 46
#define PIN_FSW_7 47
#define PIN_FSW_8 48
#define NUM_BUTTONS 8

#define TRON 1
#define TENT 2
#define BLOOM 4
#define PRE 8
#define ZOIA 16
#define ECHO 32
#define MOD 64
#define LOOP_8 128

#define NUM_BANKS 3

#define BOX_CMD_MAX_LEN 32

#define ZOIA_CHANNEL 1
#define PREAMP_CHANNEL 2
#define BLOOM_CHANNEL 3
#define MOOD_CHANNEL 4
#define GRAV_CHANNEL 5
#define WARP_CHANNEL 6
#define ECHO_CHANNEL 7

#define PREAMP_EXP_CC_ID 100
#define ZOIA_TUNER_PC_VAL 0

//Ethernet Config
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xEE};
IPAddress ip(192, 168, 66, 20);
IPAddress server(192, 168, 66, 176);
IPAddress myDns(192, 168, 1, 1);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
EthernetClient client;

bool hasPendingActions = false;
const unsigned long debounceDelay = 40;
bool BOOST_ON = false;
bool TUNER_ON = false;
uint8_t CURRENT_BANK = 0;
uint8_t ZOIA_PREV_PC = 1;
uint8_t ONE_HOT_LOOPS = 124;


typedef struct Button {
    unsigned long timeMostRecentlyEqual;
    unsigned long timeWhenPendingStarted;
    bool actionPending;
    bool isPressed;
    uint8_t pin;
    uint8_t lastState;
    void  (*cmd)(void);
} Button;

void BankUp() {
    CURRENT_BANK = (CURRENT_BANK+1) % NUM_BANKS;
}

void BankDown() {
    CURRENT_BANK = (CURRENT_BANK-1) % NUM_BANKS;
}

void ToggleBoost() {
    BOOST_ON = !BOOST_ON;
    char msg[6] = {67, PREAMP_CHANNEL, PREAMP_EXP_CC_ID, BOOST_ON ? 127 : 0, 13, 10};
    client.write(msg, 6);
}

void ToggleTuner() {
    TUNER_ON = !TUNER_ON;
    char msg[5] = {80, ZOIA_CHANNEL, TUNER_ON ? ZOIA_TUNER_PC_VAL : ZOIA_PREV_PC, 13, 10};
    client.write(msg, 5);
}

void TopLeftPreset() {
    char preamp_msg[5] = {80, PREAMP_CHANNEL, 3, 13, 10};
    char echo_msg[5] = {80, ECHO_CHANNEL, 3, 13, 10}; // echosystem preset 3
    char bloom_msg[6] = {67, BLOOM_CHANNEL, 1, 127, 13, 10}; // comp on
    char loop_msg[4] = {65, 52, 13, 10}; // loops 3, 5, & 6 on
    client.write(preamp_msg, 5);
    client.write(echo_msg, 5);
    client.write(bloom_msg, 6);
    client.write(loop_msg, 4);
}

Button buttons[NUM_BUTTONS] = {
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_PREV, .lastState=HIGH, .cmd=BankUp},
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_TUNE, .lastState=HIGH, .cmd=ToggleTuner},
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_BOOST, .lastState=HIGH, .cmd=ToggleBoost},
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_4, .lastState=HIGH, .cmd=TopLeftPreset},
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_5, .lastState=HIGH, .cmd=},
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_NEXT, .lastState=HIGH, .cmd=},
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_7, .lastState=HIGH, .cmd=},
    { .timeMostRecentlyEqual=0xffffffff, .timeWhenPendingStarted=0x00000000, .actionPending=false, .isPressed=false, .pin=PIN_FSW_8, .lastState=HIGH, .cmd=}
};

void setup() {

    Serial.begin(9600);

    Ethernet.begin(mac, ip);

    for (int i = 0; i < NUM_BUTTONS; i++) {
        pinMode(buttons[i].pin, INPUT_PULLUP);
    }
}

void loop() {

    if (!client.connected())
    {
        Serial.println("Trying to conect to box @ 192.168.66.176:1234");
        if (client.connect(server, 1234))
        {
            Serial.println("Connected.");
        }
        else
        {
            Serial.println("Failed.");
            delay(500);
            return;
        }
    }

    if (client.available())
    {
        Serial.println("\n// Msg from server: ============");
        char data;
        while (client.available() && (data = client.read()))
        {
            Serial.print(data);
        }
        Serial.println("// end of msg ==================\n");
    }
    
    // Read all button states
    uint8_t reading;

    for (int i = 0; i < NUM_BUTTONS; i++) {
        
        reading = digitalRead(buttons[i].pin);
        
        if (reading == buttons[i].lastState)
        {
            buttons[i].timeMostRecentlyEqual = millis();
        }
        else if (millis() - buttons[i].timeMostRecentlyEqual > debounceDelay)
        {
            buttons[i].lastState = reading;
            if (reading == LOW) {
                buttons[i].timeWhenPendingStarted = millis();
                buttons[i].actionPending = true;
            }
        }
    }
    
    // Check if need to toggle boost
    if (buttons[0].actionPending)
    {
        Serial.print("Toogle boost (");
        Serial.print(boostEngagged ? "ON" : "off");
        Serial.println(")");
        boostEngagged = !boostEngagged;
        buttons[0].boxCmd[3] = boostEngagged ? 127 : 0;
        // actual sending of box cmd happens in loop below
    }

    //  Check if need to send message
    for (int i = 0; i < NUM_BUTTONS; i++)
    {
        if (buttons[i].actionPending)
        {
            client.write(buttons[i].boxCmd, buttons[i].boxCmdLen);
            buttons[i].actionPending = false;
            buttons[i].timeWhenPendingStarted = 0xffffffff;
        }
    }
}