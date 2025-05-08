import Immutable, {ImmutableObject} from 'seamless-immutable';
import Action from '../actions/Home';

interface AppState {
  darkMode?: boolean;
  userDetails: any;
  safeWord?: any;
  userLocation: any;
  selectedModel: string;
  isFirstTime?: boolean;
  isSafeZone?: boolean;
}

const initialState: ImmutableObject<AppState> = Immutable<AppState>({
  darkMode: false,
  userDetails: {},
  safeWord: {
    isSafeWord: true,
    safeWord: 'Activate',
  },
  userLocation: {},
  selectedModel:
    'wss://threat-detection-gcp-917390125611.us-central1.run.app/ws/audio',
  isFirstTime: false,
  isSafeZone: false,
});

export default (state = initialState, action: {type: any; payload: any}) => {
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

    default:
      return state;
  }
};
