declare module 'expo-av' {
  export enum InterruptionModeIOS {
    DoNotMix = 1,
  }

  export enum InterruptionModeAndroid {
    DoNotMix = 1,
  }

  export type AVPlaybackSource = number;

  export namespace Audio {
    type AudioMode = {
      allowsRecordingIOS?: boolean;
      staysActiveInBackground?: boolean;
      interruptionModeIOS?: InterruptionModeIOS;
      playsInSilentModeIOS?: boolean;
      shouldDuckAndroid?: boolean;
      interruptionModeAndroid?: InterruptionModeAndroid;
      playThroughEarpieceAndroid?: boolean;
    };

    type SoundObject = {
      sound: Sound;
    };

    class Sound {
      static createAsync(
        source: AVPlaybackSource,
        initialStatus?: {
          shouldPlay?: boolean;
          isLooping?: boolean;
          volume?: number;
          progressUpdateIntervalMillis?: number;
        },
      ): Promise<SoundObject>;
      setPositionAsync(positionMillis: number): Promise<void>;
      playAsync(): Promise<void>;
      stopAsync(): Promise<void>;
      unloadAsync(): Promise<void>;
    }

    function setAudioModeAsync(mode: AudioMode): Promise<void>;
  }
}
