export default class Action {
  //Constants
  static EMPTY_STATE_SUCCESS = 'EMPTY_STATE_SUCCESS';
  static IS_DARK_MODE = 'IS_DARK_MODE';
  static USER_DETAILS = 'USER_DETAILS';
  static SAFE_WORD = 'SAFE_WORD';
  static USER_LOCATION = 'USER_LOCATION';
  static SELECTED_MODEL = 'SELECTED_MODEL';
  static IN_SAFE_ZONE = 'IN_SAFE_ZONE';

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
}
