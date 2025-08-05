/**
 * @format
 */
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import configureStore from './src/redux/Store';
import DataHandler from './src/services/dataHandler.service';
import { PersistGate } from 'redux-persist/integration/react';
import { SimpleSplashScreen, VideoSplashScreen, GifSplashScreen } from './src/components';
import { Images } from './src/config';
import LottieView from 'lottie-react-native';

const { runSaga, store, persistor } = configureStore();
DataHandler.setStore(store);

class AppView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSplash: true,
    };
  }

  componentDidMount() {
    // Hide splash after 3 seconds
    setTimeout(() => {
      this.setState({ showSplash: false });
    }, 2550);
  }

render() {
  if (this.state.showSplash) {

    return (
      <LottieView
        source={require('./src/assets/animations/ROVE_short_R4.json')}
        autoPlay
        loop
        style={{ flex: 1, backgroundColor: '#000' }} // ✅ required!
      />
    );
  }

  return (
    <>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </>
  );
}
}

AppRegistry.registerComponent(appName, () => AppView);
