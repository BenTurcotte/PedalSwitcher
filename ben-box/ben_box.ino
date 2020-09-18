// This works -- its from carter

//COMMS (ETHERNET+SERIAL CONFIG)
#include <SPI.h>
#include <Ethernet.h>
#include <EEPROM.h>

byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};
IPAddress ip(192, 168, 66, 176);

// Box deafults to 1234, will be from EEPROM
EthernetServer server(1234);
EthernetClient clients[8];

//MIDI Config
#include <MIDI.h>
MIDI_CREATE_INSTANCE(HardwareSerial, Serial1, midi1);

//Message Variables
byte incomingByte;     //The single byte that gets read from the buffer
byte message[30];      //The array used to store and order a message received
byte validMessage = 0; //Used during evaluation of message received, evlauted messaged id and conditional length
int inc = 0;           //Counts the number bytes received

//Loop variables
int i = 0;
int j = 0;

//EEPROM Variables
int addr = 0;

void setup()
{
  Ethernet.init(53);
  Ethernet.begin(mac, ip);

  // Open serial communications and wait for port to open:
  Serial.begin(9600);

  // start listening for clients
  server.begin();
  //Set up box I/O
  pinMode(22, OUTPUT);
  pinMode(23, OUTPUT);
  pinMode(24, OUTPUT);
  pinMode(25, OUTPUT);
  pinMode(26, OUTPUT);
  pinMode(27, OUTPUT);
  pinMode(28, OUTPUT);
  pinMode(29, OUTPUT);

  midi1.begin(MIDI_CHANNEL_OFF);
}

void loop()
{
  // check for any new client connecting, and say hello (before any incoming data)
  EthernetClient newClient = server.accept();
  if (newClient)
  {
    for (byte i = 0; i < 8; i++)
    {
      if (!clients[i])
      {
        newClient.print("Hello, client number: ");
        newClient.println(i);

        Serial.print("Hello, client number: ");
        Serial.println(i);

        // Once we "accept", the client is no longer tracked by EthernetServer
        // so we must store it into our list of clients
        clients[i] = newClient;
        break;
      }
    }
  }

  // check for incoming data from all clients
  for (byte i = 0; i < 8; i++)
  {
    //if there is a message from a client
    if (clients[i] && clients[i].available())
    {
      byte msg[64];
      int x = 0;
      while (x < 64 && clients[i] && clients[i].available())
      {
      }
      if (msg[x])
      {
        // invalid message!
      }
      // read incoming data from the client
      incomingByte = clients[i].read();

      if (inc < sizeof(message))
      {
        message[inc] = incomingByte;
        inc += 1;
      }

      MessageCheck();

      if (validMessage && incomingByte == 0x0A && message[inc - 2] == 0x0D)
      {

        clients[i].println("VALID");

        //BOX STATUS MESSAGE
        for (byte j = 0; j < 8; j++)
        {
          if (clients[j])
          {
            clients[j].println(incomingByte);
          }
        }

        if (message[0] == 65 && inc == 4)
        {
          AudioPresetChange();
          EndCMD();
        }

        if (message[0] == 77 && inc == 7)
        {
          MidiPedalChange();
          EndCMD();
        }

        if (message[0] == 80 && inc == 5)
        {
          MidiPC();
          EndCMD();
        }

        if (message[0] == 67 && inc == 6)
        {
          MidiCC();
          EndCMD();
        }

        if (message[0] == 73 && inc == 11)
        {
          IP_Program();
          EndCMD();
        }

        if (message[0] == 82 && inc == 7)
        {
          ReadEEPROM();
          EndCMD();
        }

        if (message[0] == 71 && inc == 28)
        {
          GlobalPresetChange();
          EndCMD();
        }

        if (message[0] == 66 && inc == 5)
        {
          AudioDisc();
          EndCMD();
        }

        if (message[0] == 69 && inc == 5)
        {
          ExpCTL();
          EndCMD();
        }
      }
    }
  }

  // stop any clients which disconnect
  for (byte i = 0; i < 8; i++)
  {
    if (clients[i] && !clients[i].connected())
    {
      clients[i].stop();
    }
  }
}

//MESSAGE VALIDATION
void MessageCheck()
{
  //Check that first byte rx is valid
  clients[i].println("MESSAGE CHECK");
  if (inc == 1)
  {
    clients[i].println("FIRST BYTE");
    if (message[0] == 65 ||
        message[0] == 77 ||
        message[0] == 80 ||
        message[0] == 67 ||
        message[0] == 73 ||
        message[0] == 82 ||
        message[0] == 71 ||
        message[0] == 66 ||
        message[0] == 69)
    {
      validMessage = 1;
    }

    else
    {
      clients[i].println("INVALID MESSAGE START");
      EndCMD();
    }

    if (validMessage)
    {
      clients[i].println("SUCCESS");
    }
    else
    {
      clients[i].println("FAILURE");
    }
  }
  //As bytes are received/assembled, verify length criteria has not been exceeded
  if (message[0] == 65 && inc > 4)
  {
    EndCMD();
    clients[i].println("INVALID MESSAGE LENGTH");
  }

  if (message[0] == 77 && inc > 7)
  {
    EndCMD();
    clients[i].println("INVALID MESSAGE LENGTH");
  }

  if (message[0] == 80 && inc > 5)
  {
    EndCMD();
    clients[i].println("INVALID MESSAGE LENGTH");
  }

  if (message[0] == 67 && inc > 6)
  {
    EndCMD();
    clients[i].println("INVALD MESSAGE LENGTH");
  }

  if (message[0] == 73 && inc > 11)
  {
    EndCMD();
    clients[i].println("INVALID MESSAGE LENGTH");
  }

  if (message[0] == 82 && inc > 7)
  {
    EndCMD();
    clients[i].println("INVALID MESSAGE LENGTH");
  }

  if (message[0] == 71 && inc > 28)
  {
    EndCMD();
    clients[i].println("INVALID MESSAGE LENGTH");
  }

  if (message[0] == 66 && inc > 5)
  {
    EndCMD();
    clients[i].println("INVALD MESSAGE LENGTH");
  }

  if (message[0] == 69 && inc > 5)
  {
    EndCMD();
    clients[i].println("INVALD MESSAGE LENGTH");
  }
}

void EndCMD()
{
  clients[i].println("ENDCMD");
  inc = 0;
  memset(message, 0, sizeof(message));
  validMessage = 0;
  i = 0;
}

//BOX FUNCTIONS
void AudioPresetChange()
{

  for (i = 0; i < 8; i++)
  {
    if (bitRead(message[1], i))
    {
      digitalWrite(i + 22, HIGH);
    }
    else
    {
      digitalWrite(i + 22, LOW);
    }
  }
  //Print the status message
  for (byte j = 0; j < 8; j++)
  {
    if (clients[j])
    {
      clients[j].println("AUDIO PRESET");
    }
  }
}

void MidiPedalChange()
{
  midi1.sendProgramChange(message[2], message[1]);
  midi1.sendControlChange(message[3], message[4], message[1]);

  //Print the status message
  for (byte j = 0; j < 8; j++)
  {
    if (clients[j])
    {
      clients[j].println("MIDI PEDAL CHANGE");
    }
  }
}

void MidiPC()
{
  midi1.sendProgramChange(message[2], message[1]);

  //Print the status message
  for (byte j = 0; j < 8; j++)
  {
    if (clients[j])
    {
      clients[j].println("MIDI PROGRAM CHANGE");
    }
  }
}

void MidiCC()
{
  midi1.sendControlChange(message[2], message[3], message[1]);

  //Print the status message
  for (byte j = 0; j < 8; j++)
  {
    if (clients[j])
    {
      clients[j].println("MIDI CONTROL CHANGE");
    }
  }
}

void IP_Program()
{
  for (j; j < inc - 3; j++)
  {
    Serial.print("WRITING IP CONFIG #: ");
    Serial.println(j);

    EEPROM.update(j, message[j + 1]);

    Serial.println("APPLIED");
  }
  j = 0;
}

void ReadEEPROM()
{
}

void GlobalPresetChange()
{
}

void AudioDisc()
{
}

void ExpCTL()
{
}