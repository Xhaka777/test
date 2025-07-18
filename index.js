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
import { SimpleSplashScreen, VideoSplashScreen, GifSplashScreen, LottieSplashScreen } from './src/components';
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
    }, 4000);
  }

  render() {
    if (this.state.showSplash) {
      // Option 1: WebM splash (best quality with transparency support)
      return (
        <VideoSplashScreen
          onFinish={() => this.setState({ showSplash: false })}
          duration={4000}
          type="webm"
          webmSource={require('./src/assets/animations/splash.webm')}
        />
      );
      
      // Option 2: Improved GIF splash (better quality)
      // return (
      //   <GifSplashScreen
      //     onFinish={() => this.setState({ showSplash: false })}
      //     duration={4000}
      //     gifSource={require('./src/assets/animations/splash.gif')}
      //   />
      // );
      
      // Option 3: Try Lottie with better implementation (uncomment to test)
      // return (
      //   <LottieSplashScreen
      //     onFinish={() => this.setState({ showSplash: false })}
      //     duration={4000}
      //     animationSource={require('./src/assets/animations/your-lottie-file.json')}
      //     backgroundColor="#000000"
      //   />
      // );
      
      // Option 4: MP4 Video splash (uncomment to try)
      // return (
      //   <VideoSplashScreen
      //     onFinish={() => this.setState({ showSplash: false })}
      //     duration={4000}
      //     type="video"
      //     videoSource={require('./src/assets/animations/splash.mp4')}
      //   />
      // );
      
      // Option 5: Simple animated splash (most reliable fallback)
      // return (
      //   <SimpleSplashScreen
      //     onFinish={() => this.setState({ showSplash: false })}
      //     duration={4000}
      //     logoSource={Images.Logo}
      //     title="Rove"
      //     backgroundColor="#000000"
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
