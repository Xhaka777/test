import { ParamListBase } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import React, { Component, ReactElement, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Button,
  View,
  TextInput,
  Text,
} from 'react-native';
import {
  ErrorCodeType,
  IRtcEngine,
  IRtcEngineEventHandler,
  RtcConnection,
  RtcStats,
  RtcSurfaceView,
  UserOfflineReasonType,
  VideoCanvas,
  VideoSourceType,
} from 'react-native-agora';

export interface BaseComponentState {
  appId: string;
  enableVideo: boolean;
  channelId?: string;
  token?: string;
  uid?: number;
  joinChannelSuccess?: boolean;
  remoteUsers?: number[];
  hideAction?: boolean;
  startPreview?: boolean;
}

export interface BaseAudioComponentState extends BaseComponentState {
  channelId: string;
  token: string;
  uid: number;
  joinChannelSuccess: boolean;
  remoteUsers: number[];
}

export interface BaseVideoComponentState extends BaseAudioComponentState {
  startPreview: boolean;
}

export abstract class BaseComponent<
    P extends ParamListBase,
    S extends BaseComponentState = BaseComponentState
  >
  extends Component<StackScreenProps<{ [T in keyof P]: P[T] }, string>, S>
  implements IRtcEngineEventHandler
{
  protected engine?: IRtcEngine;
  private _data: Array<string> = [];

  constructor(props: StackScreenProps<{ [T in keyof P]: P[T] }, string>) {
    super(props);
    this.state = this.createState();
    // const headerRight = () => <Header getData={() => this._data} />;
    // props.navigation.setOptions({ headerRight });
  }

  componentDidMount() {
    this.initRtcEngine();
  }

  componentWillUnmount() {
    this.releaseRtcEngine();
  }

  protected abstract createState(): S;

  protected abstract initRtcEngine(): void;

  protected joinChannel() {}

  protected leaveChannel() {}

  protected abstract releaseRtcEngine(): void;

  onError(err: ErrorCodeType, msg: string) {
    this.info('onError', 'err', err, 'msg', msg);
  }

  onJoinChannelSuccess(connection: RtcConnection, elapsed: number) {
    this.info(
      'onJoinChannelSuccess',
      'connection',
      connection,
      'elapsed',
      elapsed
    );
    this.setState({ joinChannelSuccess: true });
  }

  onLeaveChannel(connection: RtcConnection, stats: RtcStats) {
    this.info('onLeaveChannel', 'connection', connection, 'stats', stats);
    this.setState(this.createState());
  }

  onUserJoined(connection: RtcConnection, remoteUid: number, elapsed: number) {
    this.info(
      'onUserJoined',
      'connection',
      connection,
      'remoteUid',
      remoteUid,
      'elapsed',
      elapsed
    );
    this.setState((preState) => {
      return {
        remoteUsers: [...(preState.remoteUsers ?? []), remoteUid],
      };
    });
  }

  onUserOffline(
    connection: RtcConnection,
    remoteUid: number,
    reason: UserOfflineReasonType
  ) {
    this.info(
      'onUserOffline',
      'connection',
      connection,
      'remoteUid',
      remoteUid,
      'reason',
      reason
    );
    this.setState((preState) => {
      return {
        remoteUsers: preState.remoteUsers?.filter((uid) => uid !== remoteUid),
      };
    });
  }

  render() {
    const users = this.renderUsers();
    const configuration = this.renderConfiguration();
    const { hideAction } = this.state;
    return (
      <KeyboardAvoidingView
        style={AgoraStyle.fullSize}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={AgoraStyle.fullWidth}>{this.renderChannel()}</View>
        {users ? <View style={AgoraStyle.fullSize}>{users}</View> : undefined}
        {configuration ? (
          <>
            <Text
              style={AgoraStyle.title}
              onPress={() => {
                this.setState({ hideAction: !hideAction });
              }}
            >
              {`The Configuration of ${this.constructor.name}`}
            </Text>
            <ScrollView style={AgoraStyle.fullSize}>{configuration}</ScrollView>
          </>
        ) : undefined}
        {!hideAction ? (
          <View style={AgoraStyle.float}>{this.renderAction()}</View>
        ) : undefined}
      </KeyboardAvoidingView>
    );
  }

  protected renderChannel(): ReactElement | undefined {
    const { channelId, joinChannelSuccess } = this.state;
    return (
      <>
        <TextInput
          onChangeText={(text) => {
            this.setState({ channelId: text });
          }}
          placeholder={`channelId`}
          value={channelId}
        />
        <Button
          title={`${joinChannelSuccess ? 'leave' : 'join'} Channel`}
          onPress={() => {
            joinChannelSuccess ? this.leaveChannel() : this.joinChannel();
          }}
        />
      </>
    );
  }

  protected renderUsers(): ReactElement | undefined {
    const { enableVideo, startPreview, joinChannelSuccess, remoteUsers } =
      this.state;
    return enableVideo ? (
      <>
        {!!startPreview || joinChannelSuccess
          ? this.renderUser({
              uid: 0,
              sourceType: VideoSourceType.VideoSourceCamera,
            })
          : undefined}
      </>
    ) : undefined;
  }

  protected renderUser(user: VideoCanvas): ReactElement | undefined {
    const video = this.renderVideo(user);
    return user.uid === 0 ? video : <></>;
  }

  protected renderVideo(user: VideoCanvas): ReactElement | undefined {
    return (
      <RtcSurfaceView
        style={user.uid === 0 ? AgoraStyle.videoLarge : AgoraStyle.videoSmall}
        zOrderMediaOverlay={user.uid !== 0}
        canvas={user}
      />
    );
  }

  protected renderConfiguration(): ReactElement | undefined {
    return undefined;
  }

  protected renderAction(): ReactElement | undefined {
    return undefined;
  }

  private _logSink(
    level: 'debug' | 'log' | 'info' | 'warn' | 'error',
    message?: any,
    ...optionalParams: any[]
  ): string {
    if (level === 'error' && !__DEV__) {
      this.alert(message);
    } else {
      console[level](message, ...optionalParams);
    }
    const content = `${optionalParams.map((v) => JSON.stringify(v))}`;
    this._data.splice(0, 0, `[${level}] ${message} ${content}`);
    return content;
  }

  protected debug(message?: any, ...optionalParams: any[]): void {
    this.alert(message, this._logSink('debug', message, optionalParams));
  }

  protected log(message?: any, ...optionalParams: any[]): void {
    this._logSink('log', message, optionalParams);
  }

  protected info(message?: any, ...optionalParams: any[]): void {
    this._logSink('info', message, optionalParams);
  }

  protected warn(message?: any, ...optionalParams: any[]): void {
    this._logSink('warn', message, optionalParams);
  }

  protected error(message?: any, ...optionalParams: any[]): void {
    this._logSink('error', message, optionalParams);
  }

  protected alert(title: string, message?: string): void {
    Alert.alert(title, message);
  }
}

export const AgoraStyle = StyleSheet.create({
  title: {
    marginVertical: 10,
    fontWeight: 'bold',
  },
  fullWidth: {
    width: '100%',
  },
  fullHeight: {
    height: '100%',
  },
  fullSize: {
    flex: 1,
  },
  input: {
    height: 50,
    color: 'black',
  },
  videoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  videoLarge: {
    flex: 1,
  },
  videoSmall: {
    width: 150,
    height: 150,
  },
  float: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    height: 20,
    width: 20,
    backgroundColor: 'red',
  },
  listItem: {
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: {
    width: 120,
    height: 120,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  statusBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusBarText: {
    color: '#ffffff',
  },
});
