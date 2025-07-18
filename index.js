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
import SplashScreenComponent from './src/components/SplashScreen/SplashScreenComponent';

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
    // Hide splash after 4 seconds
    setTimeout(() => {
      this.setState({ showSplash: false });
    }, 4000);
  }

  render() {
    if (this.state.showSplash) {
      return <SplashScreenComponent />;
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
