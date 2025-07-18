/**
 * @format
 */
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React, {Component} from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {Provider} from 'react-redux';
import configureStore from './src/redux/Store';
import DataHandler from './src/services/dataHandler.service';
import {PersistGate} from 'redux-persist/integration/react';
import { SimpleSplashScreen, VideoSplashScreen, GifSplashScreen } from './src/components';
import { Images } from './src/config';

const {runSaga, store, persistor} = configureStore();
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
    }, 3000);
  }

  render() {
    if (this.state.showSplash) {
      // Try different splash screen types:
      
      // Option 1: Simple animated splash (most reliable)
      return (
        <SimpleSplashScreen
          onFinish={() => this.setState({ showSplash: false })}
          duration={3000}
          logoSource={Images.Logo}
          title="Rove"
          backgroundColor="#000000"
        />
      );
      
      // Option 2: Video splash (uncomment to try)
      // return (
      //   <VideoSplashScreen
      //     onFinish={() => this.setState({ showSplash: false })}
      //     duration={3000}
      //     type="video"
      //     videoSource={require('./src/assets/animations/splash.mp4')}
      //   />
      // );
      
      // Option 3: GIF splash (uncomment to try)
      // return (
      //   <GifSplashScreen
      //     onFinish={() => this.setState({ showSplash: false })}
      //     duration={3000}
      //     gifSource={require('./src/assets/animations/splash.gif')}
      //   />
      // );
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
