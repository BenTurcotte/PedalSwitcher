#include <SPI.h>
#include <Ethernet.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

//OLED Setup
#define OLED_RESET 4
Adafruit_SSD1306 display(OLED_RESET);

#define NUMFLAKES 10
#define XPOS 0
#define YPOS 1
#define DELTAY 2

#if (SSD1306_LCDHEIGHT != 64)
#error("Height incorrect, please fix Adafruit_SSD1306.h!");
#endif


#define LOGO16_GLCD_HEIGHT 64 
#define LOGO16_GLCD_WIDTH  16 


//Ethernet Config
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};
IPAddress ip(192, 168, 1, 20);
IPAddress server(192, 168, 1, 177);
EthernetClient client;

//Footswitch Config (top down, left to right)
int buttonTune = 22;
int button1 = 23;
int button2 = 24;
int button3 = 25;
int button4 = 26;
int buttonBoost = 31;
int button5 = 30;
int button6 = 29;
int button7 = 28;
int buttonBank = 27;

//Strymon Timeline
byte TL = 2;
//Warped Vinyl
byte WV = 5;
//Wombtone
byte WT = 6;

//Internal Variables
byte Preset[2][7][13] =

{
  {
    {0, TL, 1, 102, 0, WV, 1, 102, 0, WT, 1, 102, 0},
    {2, TL, 1, 102, 0, WV, 1, 102, 0, WT, 1, 102, 0},
    {4, TL, 28, 102, 127, WV, 1, 102, 0, WT, 1, 102, 0},
    {8, TL, 35, 102, 127, WV, 1, 102, 0, WT, 1, 102, 0},
    {16, TL, 25, 102, 127, WV, 1, 102, 0, WT, 1, 102, 0},
    {14, TL, 27, 102, 127, WV, 1, 102, 0, WT, 1, 102, 0},
    {20, TL, 16, 102, 127, WV, 1, 102, 0, WT, 1, 102, 0},
  },
  {
    {4, TL, 1, 102, 0, WV, 3, 102, 127, WT, 1, 102, 0},
    {4, TL, 28, 102, 127, WV, 3, 102, 127, WT, 1, 102, 0},
    {4, TL, 1, 102, 0, WV, 1, 102, 0, WT, 3, 102, 127},
    {4, TL, 1, 102, 0, WV, 1, 102, 0, WT, 2, 102, 127},
    {20, TL, 48, 102, 127, WV, 1, 102, 0, WT, 1, 102, 0},
    {20, TL, 1, 102, 0, WV, 1, 102, 0, WT, 1, 102, 0},
    {20, TL, 16, 102, 127, WV, 1, 102, 0, WT, 1, 102, 0},
  }
};

int preset = 0;
int bank = 0;
int bank_inc = 0;
int tune = 0;
int boost = 0;
int BoostJack = 5;

byte PresetReq[] = {80, 0, 10};
byte MidiReq[] = {77, 0, 0, 0, 0, 10};

void setup() {

  //Footswitch Setup
  pinMode(buttonTune, INPUT_PULLUP);
  pinMode(button1, INPUT_PULLUP);
  pinMode(button2, INPUT_PULLUP);
  pinMode(button3, INPUT_PULLUP);
  pinMode(button4, INPUT_PULLUP);
  pinMode(buttonBoost, INPUT_PULLUP);
  pinMode(button5, INPUT_PULLUP);
  pinMode(button6, INPUT_PULLUP);
  pinMode(button7, INPUT_PULLUP);
  pinMode(buttonBank, INPUT_PULLUP);

  //Ethernet Setup
  Ethernet.begin(mac, ip);
  Serial.begin(9600);

  delay(1000);
  Serial.println("connecting...");

   //Display Setup
   display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
   display.clearDisplay();
   display.setTextSize(2);
   display.setTextColor(WHITE);
   display.setCursor(0,0);
   display.println("POWER ON");
   display.display();
   display.clearDisplay();

  if (client.connect(server, 1234)) {
    Serial.println("connected");
  }

  else {
    Serial.println("connection failed");
  }

}

void loop() {

  if (digitalRead(buttonTune) == LOW) {
    //Increment tune on button press
    tune = tune + 1;
    Serial.println(tune);
    //Toggle Tuner On
    if (tune == 1) {
      Serial.println("TUNER ON");
      PresetReq[1] = 1;
      client.write(PresetReq,3);
    }
     
    //Toggle Tuner Off back to previous preset
    if (tune > 1) {
      tune = 0;
      Serial.println("TUNER OFF");
      PresetChange(bank,preset);
    }

    delay(500);

    ScreenWrite();
  }

  if (digitalRead(buttonBoost) == LOW) {
    boost = boost + 1;
    tune = 0;
    if (boost > 1){
      boost = 0;
    }
    PresetChange(bank,preset);
    delay(200);
  }   


  if (digitalRead(button1) == LOW) {
    preset = 0;
    tune = 0;
    PresetChange(bank,preset);
    MIDIChange(bank,preset);
  }

  if (digitalRead(button2) == LOW) {
    preset = 1;
    tune = 0;
    PresetChange(bank,preset);
    MIDIChange(bank,preset);
  }

  if (digitalRead(button3) == LOW) {
    preset = 2;
    tune = 0;
    PresetChange(bank,preset);
    MIDIChange(bank,preset);
  }

  if (digitalRead(button4) == LOW) {
    preset = 3;
    tune = 0;
    PresetChange(bank,preset);
    MIDIChange(bank,preset);
  }


  if (digitalRead(button5) == LOW) {
    preset = 4;
    tune = 0;
    PresetChange(bank,preset);
    MIDIChange(bank,preset);
  }

  if (digitalRead(button6) == LOW) {
    preset = 5;
    tune = 0;
    PresetChange(bank,preset);
    MIDIChange(bank,preset);
  }

  if (digitalRead(button7) == LOW) {
    preset = 6;
    tune = 0;
    PresetChange(bank,preset);
    MIDIChange(bank,preset);
  }

  if (digitalRead(buttonBank) == LOW) {
     bank_inc = bank_inc + 1;
     tune = 0;
     if (bank_inc > 1){
      bank_inc = 0;
     }
      
     ScreenWrite();
     delay(100);
  }

}

void PresetChange(int b, int p) {
  PresetReq[1] = Preset[b][p][0];
  //Check State of Boost, adjust boost bit accordingly
  bank = bank_inc;
  if (boost == 1){
     bitWrite(PresetReq[1], BoostJack,1);
  }
 
  client.write(PresetReq, 3);

  ScreenWrite();
 
}

void MIDIChange(int b, int p){
  
  MidiReq[1] = Preset[b][p][1];
  MidiReq[2] = Preset[b][p][2];
  MidiReq[3] = Preset[b][p][3];
  MidiReq[4] = Preset[b][p][4];

  client.write(MidiReq,6);

  MidiReq[1] = Preset[b][p][5];
  MidiReq[2] = Preset[b][p][6];
  MidiReq[3] = Preset[b][p][7];
  MidiReq[4] = Preset[b][p][8];

  client.write(MidiReq,6);

  MidiReq[1] = Preset[b][p][9];
  MidiReq[2] = Preset[b][p][10];
  MidiReq[3] = Preset[b][p][11];
  MidiReq[4] = Preset[b][p][12];

  client.write(MidiReq,6);
  
  delay(500);
}

void ScreenWrite() {

    if (tune == 1) {
      display.clearDisplay();
      display.setTextSize(3);
      display.setCursor(0,20);
      display.println("Tune");
      display.display();
   }

   else {

   //Write Preset ID to Screen
   display.clearDisplay();
   display.setTextSize(4);
   display.setTextColor(WHITE);
   display.setCursor(0,0);
   display.println("ID:");
   display.setTextSize(4);
   display.setCursor(65,0);
   display.println(bank+1);
   display.setCursor(90,0);
   display.println(preset+1);

   
   display.setCursor(80,35);
   display.setTextSize(4);
   display.println(bank_inc+1);
   

   //Boost Check
   if (boost == 1){
    display.setTextSize(2);
    display.setCursor(0,40);
    display.println("Boost");
    }

   display.display();
   display.clearDisplay(); 
   
   }

   
}
