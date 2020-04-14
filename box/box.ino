//Pedal Server works as a chat server
//MIDIConfig

#include<MIDI.h>
MIDI_CREATE_INSTANCE(HardwareSerial, Serial2,midi1);

#include <SPI.h>
#include <Ethernet.h>

// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network.
// gateway and subnet are optional:
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};
IPAddress ip(192, 168, 1, 177);
EthernetServer server(1234);

//Buffer to Store Incoming Messages
byte message[20];
int inc = 0;
int i = 0;

void setup() {

    // initialize the ethernet device
    Ethernet.begin(mac, ip);
      
    // start listening for clients
    server.begin();

    pinMode(22, OUTPUT);
    pinMode(23, OUTPUT);
    pinMode(24, OUTPUT);
    pinMode(25, OUTPUT);
    pinMode(26, OUTPUT);
    pinMode(27, OUTPUT);
    pinMode(28, OUTPUT);
    pinMode(29, OUTPUT);
    
    Serial.begin(9600);
    midi1.begin(MIDI_CHANNEL_OFF);

}


void loop() {
  // wait for a new client:
  EthernetClient client = server.available();

  if (client.available() > 0) {
    // read the bytes incoming from the client:
    byte incomingByte = client.read();

    //Save the message if space

    if (inc < sizeof(message)) {
      message[inc] = incomingByte;
      inc += 1;
    }


    if (  char(incomingByte) == '\n' ) {
      if (message[0] == 80) {
          PresetChange();
      }

      if (message[0] == 77) {
          MidiChange();
      }

      memset(message, 0, sizeof(message));
      inc = 0;
    }

  }
}

void PresetChange(){
  Serial.println("Preset Message RX");
  for (i=0; i<8 ; i++){
    if (bitRead(message[1],i)){
      digitalWrite(i+22,HIGH);
      }
    else{
      digitalWrite(i+22,LOW);
      }            
  }
}

void MidiChange(){ 
  Serial.println("MIDI Message RX");
  midi1.sendProgramChange(message[2],message[1]);
  midi1.sendControlChange(message[3],message[4],message[1]);

}
