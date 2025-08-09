import { WalletClient } from 'viem';

export interface AudioMessage {
  id: string;
  audioUrl: string;
  filename: string;
  timestamp: Date;
  sender: string;
  guess?: string;
  correctAnswer?: string;
}

export interface GameState {
  currentRound: number;
  score: number;
  totalRounds: number;
}

// Mock XMTP client for now - we'll implement the real one once we understand the API
class XMTPGameClient {
  private isConnectedState = false;
  private conversations: Map<string, any> = new Map();
  private messageListeners: Map<string, (message: AudioMessage) => void> = new Map();

  async connect(walletClient: WalletClient) {
    try {
      // For now, we'll simulate a connection
      // In the real implementation, this would use the actual XMTP client
      console.log('Connecting to XMTP...', walletClient);
      this.isConnectedState = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to XMTP:', error);
      throw error;
    }
  }

  async getConversations(): Promise<any[]> {
    if (!this.isConnectedState) throw new Error('Client not connected');
    return Array.from(this.conversations.values());
  }

  async getOrCreateConversation(peerAddress: string): Promise<any> {
    if (!this.isConnectedState) throw new Error('Client not connected');
    
    const existing = this.conversations.get(peerAddress);
    if (existing) return existing;

    const conversation = {
      peerAddress,
      id: `conv_${Date.now()}`,
      send: async (message: string) => {
        // Simulate sending a message
        console.log('Sending message:', message);
        return true;
      },
      streamMessages: async () => {
        // Simulate message streaming
        return {
          subscribe: (callback: (message: any) => void) => {
            // Store the callback for later use
            this.messageListeners.set(peerAddress, callback);
            return () => {
              this.messageListeners.delete(peerAddress);
            };
          }
        };
      }
    };
    
    this.conversations.set(peerAddress, conversation);
    return conversation;
  }

  async sendAudioMessage(
    conversation: any,
    audioBlob: Blob,
    filename: string,
    correctAnswer?: string
  ): Promise<void> {
    if (!this.isConnectedState) throw new Error('Client not connected');

    const messageData = {
      type: 'audio-challenge',
      audioUrl: URL.createObjectURL(audioBlob),
      filename,
      correctAnswer,
      timestamp: new Date().toISOString(),
    };

    await conversation.send(JSON.stringify(messageData));
  }

  async sendGuess(
    conversation: any,
    guess: string,
    originalMessageId: string
  ): Promise<void> {
    const guessMessage = {
      type: 'guess',
      guess,
      originalMessageId,
      timestamp: new Date().toISOString(),
    };

    await conversation.send(JSON.stringify(guessMessage));
  }

  async listenToMessages(
    conversation: any,
    onMessage: (message: AudioMessage) => void
  ): Promise<() => void> {
    const stream = await conversation.streamMessages();
    
    const unsubscribe = stream.subscribe((message: any) => {
      try {
        const content = message.content || message;
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        
        if (parsed.type === 'audio-challenge') {
          const audioMessage: AudioMessage = {
            id: message.id || Date.now().toString(),
            audioUrl: parsed.audioUrl,
            filename: parsed.filename,
            timestamp: new Date(parsed.timestamp),
            sender: message.senderAddress || 'unknown',
            correctAnswer: parsed.correctAnswer,
          };
          onMessage(audioMessage);
        } else if (parsed.type === 'guess') {
          console.log('Received guess:', parsed);
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    return unsubscribe;
  }

  isConnected(): boolean {
    return this.isConnectedState;
  }

  getClient(): any {
    return this.isConnectedState ? {} : null;
  }
}

export const xmtpGameClient = new XMTPGameClient(); 