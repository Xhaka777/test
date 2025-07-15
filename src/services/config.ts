export const BASE_URL: string = 'https://api.rovesafe.com/';
// export const BASE_URL: string = 'https://backend-api-458410.uc.r.appspot.com/';
// export const BASE_URL: string = 'https://rove-backend-api-752186260001.us-central1.run.app/';
export const BASE_PATH: string = 'api/';
export const SOCKET_URL: string = 'http://161.35.120.195:9001/';
export const V1_BASE_URL: string = '';
export const API_TIMEOUT: number = 500000;
export const LIMIT: number = 10;
export const GOOGLE_API_KEY: string = 'AIzaSyBcOBbH59pgJk_bmN6WavZCExwCGqCztaY';

export const Environments = {
  Models: {
    WHISPER_AND_SENTIMENT: 'wss://threat-detection.rovesafe.com/ws/audio',
    VIT: 'wss://threat-detection.rovesafe.com/ws/audio',
    TRIGGER_WORD_WHISPER:
      'wss://gcp-whisperonly-917390125611.us-central1.run.app/ws/audio',
  },
};
