
export interface User {
  id: string;
  name: string;
  department: string;
  email: string;
  password?: string;
  profileImage?: string; // base64 string
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userProfile?: string;
  text: string;
  timestamp: number;
}

export interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  text: string;
  timestamp: number;
}

export interface BoardTask {
  id: string;
  userId: string;
  userName: string;
  userProfile?: string;
  boardId: string;
  taskName: string;
  codeUsed: string;
  circuitDesignImage?: string; // base64
  referenceUrl: string;
  timestamp: number;
  comments?: Comment[];
}

export interface ArduinoBoard {
  id: string;
  name: string;
  description: string;
  image: string;
  specs: {
    microcontroller: string;
    operatingVoltage: string;
    inputVoltage: string;
    digitalIO: string;
    analogInput: string;
    flashMemory: string;
  };
}

export type ViewState = 'WELCOME' | 'AUTH_REGISTER' | 'AUTH_LOGIN' | 'COMMON_PAGE' | 'BOARD_LIST' | 'BOARD_DETAILS' | 'COMMUNITY' | 'PROFILE' | 'INBOX';
