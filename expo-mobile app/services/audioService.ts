import { API_CONFIG } from '@/config/api';

export const audioService = {
  async uploadRecordedAudio(uri: string) {
    const formData = new FormData();
    
    formData.append('file', {
      uri,
      type: 'audio/m4a',
      name: `recording_${Date.now()}.m4a`
    } as any);
    
    // Required fields for upload-demo endpoint
    formData.append('title', 'User Recording');
    formData.append('category', 'user_recording');
    formData.append('description', 'Temporary user recording');
    formData.append('duration', '1');

    const response = await fetch(`${API_CONFIG.BASE_URL}/audio/upload-demo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  async deleteDemoAudio(audioId: number) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/audio/demo/${audioId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete audio');
    }
  },

  async getDemoAudios() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/demos`);
      if (!response.ok) throw new Error('Failed to fetch demos');
      return response.json();
    } catch (error) {
      console.error('Fetch demos error:', error);
      throw error;
    }
  },

  async streamDemo(demoId: number): Promise<string> {
    return `${API_CONFIG.BASE_URL}/audio/demo/${demoId}/stream-demo`;
  },

  async transcribeAudio(audioChunk: Blob): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('file', audioChunk, 'audio.wav');

      console.log('[Audio] Sending request to transcribe, size:', audioChunk.size);

      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/transcribe`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Error]:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Transcription Result]:', data);
      return data;
    } catch (error) {
      console.error('[Transcription Error]:', error);
      throw error;
    }
  },

  async transcribeRealtimeAudio(audioBlob: Blob): Promise<{
    transcription: string;
    has_otp: boolean;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');

      console.log('[Audio] Sending request for realtime transcription');

      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/test/realtime-transcription`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Realtime Transcription]:', data);
      return data;
    } catch (error) {
      console.error('[Transcription Error]:', error);
      throw error;
    }
  },

  async transcribeDemoAudio(demoId: number): Promise<{
    transcription: string;
    has_otp: boolean;
  }> {
    try {
      console.log('[Audio] Starting demo transcription');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/audio/test/realtime-transcription/${demoId}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('[Demo Transcription]:', data);
      return data;
    } catch (error) {
      console.error('[Transcription Error]:', error);
      throw error;
    }
  },

  async transcribeRealtimeRecording(recordingId: number): Promise<{
    transcription: string;
  }> {
    try {
      console.log('\n=== Starting Recording Transcription ===');
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/audio/realtimetranscribe-recording/${recordingId}`,
        { 
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Transcription Error]:', error);
      throw error;
    }
  },

  async uploadRecording(formData: FormData): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/upload-recording`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }

      return response.json();
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  },

  async saveRecording(uri: string, transcription: string): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/raw',
        name: 'recording.raw'
      } as any);
      formData.append('transcription', transcription);

      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/save-recording`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save recording');
      }
    } catch (error) {
      console.error('Error saving recording:', error);
      throw error;
    }
  },

  async analyzeFraud(text: string): Promise<{
    classification: string;
    confidence: number;
  }> {
    try {
      console.log('Sending fraud analysis request:', text);
      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/analyze_fraud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Fraud analysis failed');
      }

      const result = await response.json();
      console.log('Fraud analysis response:', result);
      return result;
    } catch (error) {
      console.error('Fraud analysis error:', error);
      throw error;
    }
  },

  async uploadTempAudio(uri: string) {
    const formData = new FormData();
    
    formData.append('file', {
      uri,
      type: 'audio/m4a',
      name: `recording_${Date.now()}.m4a`
    } as any);
    
    formData.append('category', 'temp_recording');
    formData.append('description', 'Temporary recording for simulation');
    formData.append('duration', '1');

    const response = await fetch(`${API_CONFIG.BASE_URL}/audio/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  async deleteTempAudio(audioId: number) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/audio/temp/${audioId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete temporary audio');
    }

    return response.json();
  },

  async getStoredHashes(): Promise<AudioHash[]> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/audio/hashes`);
    if (!response.ok) throw new Error('Failed to fetch hashes');
    return response.json();
  },

  async checkAudioHash(uri: string): Promise<{
    hash: string;
    matches: number;
    matched_files: Array<{
      filename: string;
      content_type: string;
      created_at: string;
      matched_count: number;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/m4a',
      name: `check_${Date.now()}.m4a`
    } as any);

    const response = await fetch(`${API_CONFIG.BASE_URL}/audio/check-hash`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Hash check failed');
    return response.json();
  },

  async storeAudioHash(uri: string) {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/m4a',
      name: `store_${Date.now()}.m4a`
    } as any);

    const response = await fetch(`${API_CONFIG.BASE_URL}/audio/store-hash`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to store hash');
    return response.json();
  }
};

class AudioStreamingService {
  private ws: WebSocket | null = null;
  private onTranscriptionCallback: ((text: string) => void) | null = null;

  connect(onTranscription: (text: string) => void) {
    this.onTranscriptionCallback = onTranscription;
    this.ws = new WebSocket(`${API_CONFIG.WS_URL}/ws/audio`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transcription' && this.onTranscriptionCallback) {
        console.log('Real-time transcription:', data.text);
        this.onTranscriptionCallback(data.text);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  sendAudioChunk(chunk: Blob) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const audioStreamingService = new AudioStreamingService();