
import { ArduinoBoard } from './types';

export const ARDUINO_BOARDS: ArduinoBoard[] = [
  {
    id: 'uno',
    name: 'Arduino Uno',
    description: 'The standard and most popular board for beginners. Robust and versatile.',
    image: 'https://picsum.photos/seed/arduino-uno/400/300',
    specs: {
      microcontroller: 'ATmega328P',
      operatingVoltage: '5V',
      inputVoltage: '7-12V',
      digitalIO: '14 (of which 6 provide PWM output)',
      analogInput: '6',
      flashMemory: '32 KB'
    }
  },
  {
    id: 'nano',
    name: 'Arduino Nano',
    description: 'A small, complete, and breadboard-friendly board based on the ATmega328.',
    image: 'https://picsum.photos/seed/arduino-nano/400/300',
    specs: {
      microcontroller: 'ATmega328',
      operatingVoltage: '5V',
      inputVoltage: '7-12V',
      digitalIO: '14',
      analogInput: '8',
      flashMemory: '32 KB'
    }
  },
  {
    id: 'mega',
    name: 'Arduino Mega 2560',
    description: 'Designed for more complex projects with more pins and more memory.',
    image: 'https://picsum.photos/seed/arduino-mega/400/300',
    specs: {
      microcontroller: 'ATmega2560',
      operatingVoltage: '5V',
      inputVoltage: '7-12V',
      digitalIO: '54 (of which 15 provide PWM output)',
      analogInput: '16',
      flashMemory: '256 KB'
    }
  },
  {
    id: 'leonardo',
    name: 'Arduino Leonardo',
    description: 'A board that has built-in USB communication, allowing it to act as a keyboard or mouse.',
    image: 'https://picsum.photos/seed/arduino-leo/400/300',
    specs: {
      microcontroller: 'ATmega32u4',
      operatingVoltage: '5V',
      inputVoltage: '7-12V',
      digitalIO: '20',
      analogInput: '12',
      flashMemory: '32 KB'
    }
  }
];
