// ios/Rove/AudioSessionManager.swift
import Foundation
import AVFoundation
import React

@objc(AudioSessionManager)
class AudioSessionManager: NSObject {
  
  private var isAudioSessionActive = false
  private var shouldResumeOnInterruptionEnd = false
  
  override init() {
    super.init()
    setupAudioSessionNotifications()
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  private func setupAudioSessionNotifications() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioSessionInterruption),
      name: AVAudioSession.interruptionNotification,
      object: nil
    )
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioSessionRouteChange),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
  }
  
  @objc private func handleAudioSessionInterruption(notification: Notification) {
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }
    
    switch type {
    case .began:
      print("🔇 Audio session interrupted - another app is using microphone")
      isAudioSessionActive = false
      
      // Send event to React Native if needed
      // You can implement RCTEventEmitter if you need to notify JS side
      
    case .ended:
      print("🎤 Audio session interruption ended")
      
      if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
        let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
        if options.contains(.shouldResume) {
          print("🔄 System suggests we should resume audio session")
          shouldResumeOnInterruptionEnd = true
        }
      }
      
    @unknown default:
      break
    }
  }
  
  @objc private func handleAudioSessionRouteChange(notification: Notification) {
    guard let userInfo = notification.userInfo,
          let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
          let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
      return
    }
    
    switch reason {
    case .newDeviceAvailable:
      print("🎧 New audio device available")
    case .oldDeviceUnavailable:
      print("🎧 Audio device disconnected")
    case .categoryChange:
      print("🔄 Audio session category changed")
    default:
      break
    }
  }
  
  @objc func setAudioSessionActive(_ active: Bool,
                                  resolver: @escaping RCTPromiseResolveBlock,
                                  rejecter: @escaping RCTPromiseRejectBlock) {
    let audioSession = AVAudioSession.sharedInstance()
    
    print("🔍 AudioSessionManager: Setting active to: \(active)")
    print("🔍 AudioSessionManager: Current category: \(audioSession.category)")
    print("🔍 AudioSessionManager: Current state: \(isAudioSessionActive)")
    
    do {
      if active {
        // Configure for recording before activating
        try audioSession.setCategory(.playAndRecord,
                                   mode: .default,
                                   options: [.allowBluetooth, .defaultToSpeaker])
        
        // Try to activate the session
        try audioSession.setActive(true)
        isAudioSessionActive = true
        print("🎤 AudioSessionManager: Audio session activated for recording")
      } else {
        // Deactivate and allow other apps to use audio
        try audioSession.setActive(false, options: .notifyOthersOnDeactivation)
        isAudioSessionActive = false
        print("🎤 AudioSessionManager: Audio session deactivated, other apps can now use audio")
      }
      resolver(true)
    } catch let error as NSError {
      isAudioSessionActive = false
      print("❌ AudioSessionManager: Failed to set audio session active state")
      print("❌ Error domain: \(error.domain)")
      print("❌ Error code: \(error.code)")
      print("❌ Error description: \(error.localizedDescription)")
      
      // Provide more specific error information
      var errorMessage = "Failed to set audio session active state: \(error.localizedDescription)"
      
      if error.code == AVAudioSession.ErrorCode.isBusy.rawValue {
        errorMessage = "Audio session is busy - another app is using the microphone"
      } else if error.code == AVAudioSession.ErrorCode.insufficientPriority.rawValue {
        errorMessage = "Insufficient priority - another app has higher priority audio session"
      }
      
      rejecter("AUDIO_SESSION_ERROR", errorMessage, error)
    }
  }
  
  @objc func configureForRecording(_ resolver: @escaping RCTPromiseResolveBlock,
                                  rejecter: @escaping RCTPromiseRejectBlock) {
    let audioSession = AVAudioSession.sharedInstance()
    
    do {
      try audioSession.setCategory(.playAndRecord,
                                 mode: .default,
                                 options: [.allowBluetooth, .defaultToSpeaker])
      print("🎤 AudioSessionManager: Audio session configured for recording")
      resolver(true)
    } catch let error as NSError {
      print("❌ AudioSessionManager: Failed to configure audio session: \(error)")
      rejecter("AUDIO_SESSION_ERROR", "Failed to configure audio session: \(error.localizedDescription)", error)
    }
  }
  
  @objc func releaseAudioSession(_ resolver: @escaping RCTPromiseResolveBlock,
                                rejecter: @escaping RCTPromiseRejectBlock) {
    let audioSession = AVAudioSession.sharedInstance()
    
    print("🔍 AudioSessionManager: Current audio session category: \(audioSession.category)")
    print("🔍 AudioSessionManager: Current audio session mode: \(audioSession.mode)")
    print("🔍 AudioSessionManager: Is other audio playing: \(audioSession.isOtherAudioPlaying)")
    print("🔍 AudioSessionManager: Current state: \(isAudioSessionActive)")
    
    do {
      // Try to deactivate with notifyOthersOnDeactivation
      try audioSession.setActive(false, options: .notifyOthersOnDeactivation)
      isAudioSessionActive = false
      print("✅ AudioSessionManager: Audio session released successfully - other apps can use mic")
      resolver(true)
    } catch let error as NSError {
      print("❌ AudioSessionManager: Failed to release audio session")
      print("❌ Error domain: \(error.domain)")
      print("❌ Error code: \(error.code)")
      print("❌ Error description: \(error.localizedDescription)")
      
      // Try alternative approach - just deactivate without options
      do {
        try audioSession.setActive(false)
        isAudioSessionActive = false
        print("✅ AudioSessionManager: Audio session released with fallback method")
        resolver(true)
      } catch let fallbackError as NSError {
        isAudioSessionActive = false
        print("❌ AudioSessionManager: Fallback also failed")
        print("❌ Fallback error: \(fallbackError.localizedDescription)")
        rejecter("AUDIO_SESSION_ERROR", "Failed to release audio session: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc func getAudioSessionState(_ resolver: @escaping RCTPromiseResolveBlock,
                                 rejecter: @escaping RCTPromiseRejectBlock) {
    let audioSession = AVAudioSession.sharedInstance()
    
    let state = [
      "isActive": isAudioSessionActive,
      "category": audioSession.category.rawValue,
      "mode": audioSession.mode.rawValue,
      "isOtherAudioPlaying": audioSession.isOtherAudioPlaying,
      "shouldResumeOnInterruptionEnd": shouldResumeOnInterruptionEnd
    ] as [String : Any]
    
    resolver(state)
  }
  
  @objc func checkMicrophonePermission(_ resolver: @escaping RCTPromiseResolveBlock,
                                      rejecter: @escaping RCTPromiseRejectBlock) {
    let audioSession = AVAudioSession.sharedInstance()
    
    audioSession.requestRecordPermission { granted in
      DispatchQueue.main.async {
        let result = [
          "granted": granted,
          "status": granted ? "granted" : "denied"
        ]
        resolver(result)
      }
    }
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
}
