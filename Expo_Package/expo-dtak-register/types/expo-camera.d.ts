declare module "expo-camera" {
  import * as React from "react";
  import { ViewProps } from "react-native";

  export type CameraPermissionStatus = "granted" | "denied" | "undetermined";

  export type CameraType = "front" | "back";

  export const CameraType: {
    readonly front: CameraType;
    readonly back: CameraType;
  };

  export interface CameraCapturedPicture {
    uri: string;
    width?: number;
    height?: number;
    base64?: string;
  }

  export interface CameraPictureOptions {
    quality?: number;
    base64?: boolean;
    skipProcessing?: boolean;
  }

  export interface CameraViewProps extends ViewProps {
    facing?: CameraType;
    ratio?: string;
  }

  export type CameraViewHandle = {
    takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture>;
  };

  export const CameraView: React.ForwardRefExoticComponent<
    CameraViewProps & React.RefAttributes<CameraViewHandle>
  >;

  export function getCameraPermissionsAsync(): Promise<{
    status: CameraPermissionStatus;
  }>;

  export function requestCameraPermissionsAsync(): Promise<{
    status: CameraPermissionStatus;
  }>;
}
