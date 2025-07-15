export default class Action {
  //Constants
  static EMPTY_STATE_SUCCESS = 'EMPTY_STATE_SUCCESS';
  static IS_DARK_MODE = 'IS_DARK_MODE';
  static USER_DETAILS = 'USER_DETAILS';
  static SAFE_WORD = 'SAFE_WORD';
  static USER_LOCATION = 'USER_LOCATION';
  static SELECTED_MODEL = 'SELECTED_MODEL';
  static IN_SAFE_ZONE = 'IN_SAFE_ZONE';
  static THREAT_DETECTED = 'THREAT_DETECTED';
  static STREAM_STOPPED = 'STREAM_STOPPED';

  //Tutorial constants
  static SET_TUTORIAL_COMPLETED = 'SET_TUTORIAL_COMPLETED';
  static SET_TUTORIAL_STEP = 'SET_TUTORIAL_STEP';
  static SET_TUTORIAL_ACTIVE = 'SET_TUTORIAL_ACTIVE';
  static SET_TUTORIAL_SCREEN = 'SET_TUTORIAL_SCREEN';
  static RESET_TUTORIAL = 'RESET_TUTORIAL';

  //Actions
  static setDarkMode() {
    return {
      type: Action.IS_DARK_MODE,
    };
  }

  static setUserDetails(payload: any) {
    return {
      type: Action.USER_DETAILS,
      payload,
    };
  }

  static setSafeWord(payload: any) {
    return {
      type: Action.SAFE_WORD,
      payload,
    };
  }

  static setUserLocation(payload: any) {
    return {
      type: Action.USER_LOCATION,
      payload,
    };
  }

  static setSelectedModel(payload: any) {
    return {
      type: Action.SELECTED_MODEL,
      payload,
    };
  }

  static setInSafeZone(payload: any) {
    return {
      type: Action.IN_SAFE_ZONE,
      payload,
    };
  }
  static setThreatDetected(payload: boolean) {
    return {
      type: Action.THREAT_DETECTED,
      payload,
    };
  }
  static setStreamStopped(payload: boolean) {
    return {
      type: Action.STREAM_STOPPED,
      payload,
    };
  }

  //Tutorial actions
  static setTutorialCompleted(payload: boolean) {
    return {
      type: Action.SET_TUTORIAL_COMPLETED,
      payload,
    }
  }

  static setTutorialStep(payload: number) {
    return {
      type: Action.SET_TUTORIAL_STEP,
      payload,
    }
  }

  static setTutorialActive(payload: boolean) {
    return { type: Action.SET_TUTORIAL_ACTIVE, payload };
  }

  static setTutorialScreen(payload: string) {
    return { type: Action.SET_TUTORIAL_SCREEN, payload };
  }

  static resetTutorial() {
    return { type: Action.RESET_TUTORIAL };
  }

}
