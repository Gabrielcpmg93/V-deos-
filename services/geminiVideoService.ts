import { GoogleGenAI, GenerateVideosRequest, GetVideosOperationRequest, GenerateVideosOperation, GenerateVideosResponse } from "@google/genai";
import { VIDEO_GENERATION_MODEL } from '../constants';
import { AistudioWindow, ApiKeyState } from '../types';

declare const window: AistudioWindow;

interface VideoGenerationResult {
  videoUrl: string | null;
  error: string | null;
  apiKeyState: ApiKeyState;
}

/**
 * Ensures the API key is selected before proceeding with video generation.
 * Handles opening the API key selection dialog if necessary.
 * @returns A promise that resolves with the API key state.
 */
async function ensureApiKeySelected(): Promise<ApiKeyState> {
  if (!window.aistudio) {
    console.warn('window.aistudio is not available. API key selection cannot be performed.');
    return ApiKeyState.NOT_SELECTED;
  }

  const hasSelected = await window.aistudio.hasSelectedApiKey();
  if (hasSelected) {
    return ApiKeyState.SELECTED;
  } else {
    try {
      await window.aistudio.openSelectKey();
      // Assume success after opening the dialog, even if hasSelectedApiKey isn't immediately true.
      return ApiKeyState.SELECTED;
    } catch (e) {
      console.error('Failed to open API key selection dialog:', e);
      return ApiKeyState.NOT_SELECTED;
    }
  }
}

/**
 * Generates a video from a text prompt using the Gemini API.
 * Includes polling for operation completion and API key management.
 * @param prompt The text prompt for video generation.
 * @param onProgress Callback for progress messages during generation.
 * @returns A promise that resolves with the video URL or an error.
 */
export async function generateVideoFromPrompt(
  prompt: string,
  onProgress: (message: string) => void,
): Promise<VideoGenerationResult> {
  onProgress('Checking API key...');
  const apiKeyState = await ensureApiKeySelected();

  if (apiKeyState !== ApiKeyState.SELECTED) {
    return {
      videoUrl: null,
      error: `API key not selected or failed to open selection dialog. Please select a paid API key for Veo models. See ai.google.dev/gemini-api/docs/billing`,
      apiKeyState: ApiKeyState.NOT_SELECTED,
    };
  }

  if (!process.env.API_KEY) {
    return {
      videoUrl: null,
      error: 'API_KEY environment variable is not set. Please ensure it is configured.',
      apiKeyState: ApiKeyState.NOT_SELECTED,
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const generateRequest: GenerateVideosRequest = {
    model: VIDEO_GENERATION_MODEL,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  };

  try {
    onProgress('Starting video generation...');
    let operation: GenerateVideosOperation = await ai.models.generateVideos(generateRequest);

    let progressIndex = 0;
    const progressMessages = [
      'Generating video... (1/5)',
      'Analyzing prompt and preparing assets... (2/5)',
      'Composing scenes and animations... (3/5)',
      'Finalizing rendering and encoding... (4/5)',
      'Video almost ready! (5/5)',
      'Fetching final video link...',
    ];

    while (!operation.done) {
      onProgress(progressMessages[progressIndex % progressMessages.length]);
      progressIndex++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      const getOperationRequest: GetVideosOperationRequest = { operation: operation };
      operation = await ai.operations.getVideosOperation(getOperationRequest);
    }

    if (operation.response && operation.response.generatedVideos && operation.response.generatedVideos.length > 0) {
      const downloadLink = operation.response.generatedVideos[0].video?.uri;
      if (downloadLink) {
        onProgress('Video generated successfully! Fetching video data...');
        // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
        // For simplicity and direct use in video tag, we just return the URI with API key.
        const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        return { videoUrl, error: null, apiKeyState: ApiKeyState.SELECTED };
      }
    }
    return { videoUrl: null, error: 'Video generation completed, but no video URL was returned.', apiKeyState: ApiKeyState.SELECTED };

  } catch (error: any) {
    console.error('Error generating video:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
      // API key might have become invalid or project not configured correctly
      console.warn("API key might be invalid. Resetting state for re-selection.");
      return {
        videoUrl: null,
        error: `Video generation failed: ${error.message}. Please re-select your API key to ensure it's from a paid GCP project.`,
        apiKeyState: ApiKeyState.NOT_SELECTED,
      };
    }
    return { videoUrl: null, error: `Video generation failed: ${error.message || 'Unknown error'}`, apiKeyState: ApiKeyState.SELECTED };
  }
}
