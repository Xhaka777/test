import Immutable, { ImmutableObject } from 'seamless-immutable';
import Action from '../actions/Home';

interface AppState {
  darkMode?: boolean;
  userDetails: any;
  safeWord?: any;
  userLocation: any;
  selectedModel: string;
  isFirstTime?: boolean;
  isSafeZone?: boolean;
  threatDetected: boolean;
  streamStopped?: any;
  //
  headsUpfirstTime?: boolean;
  tutorialCompleted?: boolean;
  currentTutorialStep?: number;
  tutorialActive?: boolean;
  tutorialCurrentScreen?: string;

  highlitedElement?: string | null;
}

const initialState: ImmutableObject<AppState> = Immutable<AppState>({
  darkMode: false,
  userDetails: {},
  safeWord: {
    isSafeWord: true,
    safeWord: 'Activate',
  },
  userLocation: {},
  selectedModel: 'wss://threat-detection.rovesafe.com/ws/audio',
  isFirstTime: false,
  isSafeZone: false,
  threatDetected: false,
  streamStopped: false,
  //
  headsUpfirstTime: true,
  tutorialCompleted: false,
  currentTutorialStep: 1,
  tutorialActive: false,
  tutorialCurrentScreen: 'LiveStream',

  highlitedElement: null,
});

export default (state = initialState, action: { type: any; payload: any }) => {
  switch (action.type) {
    case Action.EMPTY_STATE_SUCCESS:
      return Immutable(initialState);

    case Action.IS_DARK_MODE:
      return Immutable(state).merge({
        darkMode: !state.darkMode,
      });

    case Action.USER_DETAILS: {
      return Immutable(state).merge({
        userDetails: action.payload,
      });
    }

    case Action.SAFE_WORD: {
      return Immutable(state).merge({
        safeWord: action.payload,
      });
    }

    case Action.USER_LOCATION: {
      return Immutable(state).merge({
        userLocation: action.payload,
      });
    }

    case Action.SELECTED_MODEL: {
      return Immutable(state).merge({
        selectedModel: action.payload,
      });
    }

    case Action.IN_SAFE_ZONE: {
      return Immutable(state).merge({
        isSafeZone: action.payload,
      });
    }

    case Action.THREAT_DETECTED: {
      return Immutable(state).merge({
        threatDetected: action.payload,
      });
    }
    case Action.STREAM_STOPPED: {
      return Immutable(state).merge({
        streamStopped: action.payload,
      });
    }

    //Tutorial reducer cases
    case Action.SET_TUTORIAL_COMPLETED: {
      return Immutable(state).merge({
        tutorialCompleted: action.payload,
        tutorialActive: !action.payload,
      });
    }

    case Action.HEADS_UP_FIRST_TIME: {
      return Immutable(state).merge({
        headsUpfirstTime: action.payload,
      });
    }

    case Action.SET_TUTORIAL_STEP: {
      return Immutable(state).merge({
        currentTutorialStep: action.payload,
      });
    }

    case Action.SET_TUTORIAL_ACTIVE:
      return Immutable(state).merge({
        tutorialActive: action.payload
      });

    case Action.SET_TUTORIAL_SCREEN:
      return Immutable(state).merge({
        tutorialCurrentScreen: action.payload,
      });

    case Action.RESET_TUTORIAL:
      return Immutable(state).merge({
        tutorialCompleted: false,
        currentTutorialStep: 1,
        tutorialActive: true,
        tutorialCurrentScreen: 'LiveStream',
      });

    case Action.SET_HIGHLIGHTED_ELEMENT:
      return Immutable(state).merge({
        highlitedElement: action.payload,
      })

    default:
      return state;
  }
};
