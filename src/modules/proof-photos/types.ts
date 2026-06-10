export interface ProofPhoto {
  id: string;
  createdAt: Date;
  driverId: string;
  campaignId: string;
  storagePath: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  photoTimestamp: Date;
}

export interface LocationMetadata {
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
}

export interface PhotoCaptureResult {
  uri: string;
  width: number;
  height: number;
  isRaw?: boolean;
  base64?: string;
}
