export interface VideoPost {
  id: string;
  videoUrl: string;
  caption: string;
  thumbnailUrl: string;
  createdAt: Date;
}

export enum ApiKeyState {
  UNKNOWN = 'UNKNOWN',
  SELECTED = 'SELECTED',
  NOT_SELECTED = 'NOT_SELECTED',
}

export interface AistudioWindow extends Window {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
    // Add missing properties based on the error message to match the expected 'AIStudio' type.
    getHostUrl: () => Promise<string>;
    getModelQuota: () => Promise<any>;
  };
}