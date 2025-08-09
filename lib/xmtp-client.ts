import { WalletClient } from 'viem';

export interface AudioMessage {
  id: string;
  audioUrl?: string;
  filename?: string;
  timestamp: Date;
  sender: string;
  guess?: string;
  correctAnswer?: string;
  text?: string;
  isSolved?: boolean;
  type?: 'audio' | 'text' | 'guess';
}

export interface GameState {
  currentRound: number;
  score: number;
  totalRounds: number;
}

// XMTP client with comprehensive logging
class XMTPGameClient {
  private isConnectedState = false;
  private conversations: Map<string, any> = new Map();
  private messageListeners: Map<string, (message: AudioMessage) => void> = new Map();
  private client: any = null;

  async connect(walletClient: WalletClient) {
    try {
      console.log('🔄 Connecting to XMTP...', { walletClient: !!walletClient });
      
      // Create a signer from the wallet client
      const signer = {
        type: "EOA" as const,
        getIdentifier: () => ({
          identifier: walletClient.account?.address || "0x",
          identifierKind: "Ethereum" as const
        }),
        signMessage: async (message: string): Promise<Uint8Array> => {
          console.log('📝 Signing message:', message);
          if (!walletClient.account) {
            throw new Error('No account available for signing');
          }
          const signature = await walletClient.signMessage({ 
            message,
            account: walletClient.account
          });
          // Convert hex signature to Uint8Array
          return new Uint8Array(Buffer.from(signature.slice(2), 'hex'));
        }
      };

      console.log('🔐 Created signer:', signer.getIdentifier());
      
      // Import and create the XMTP client
      const { Client } = await import('@xmtp/browser-sdk');
      this.client = await Client.create(signer, {
        env: 'production'
      });
      
      console.log('✅ XMTP client created successfully');
      this.isConnectedState = true;
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to XMTP:', error);
      throw error;
    }
  }

  async getConversations(): Promise<any[]> {
    if (!this.isConnectedState || !this.client) throw new Error('Client not connected');

    try {
      console.log('📋 Fetching conversations from XMTP...');
      const conversations = await this.client.conversations.list({});
      console.log('✅ Found conversations:', conversations.length);

      conversations.forEach((conv: any) => {
        const peerRaw = (typeof conv?.peerAddress === 'string' ? conv.peerAddress : undefined)
          || (typeof conv?.peerInboxId === 'string' ? conv.peerInboxId : undefined)
          || (typeof conv?.inboxId === 'string' ? conv.inboxId : undefined);
        const peer = peerRaw || 'unknown';
        if (peer !== 'unknown' && !String(peer).startsWith('async')) {
          this.conversations.set(peer, conv);
        }
      });

      return conversations;
    } catch (error) {
      console.error('❌ Failed to get conversations:', error);
      return Array.from(this.conversations.values());
    }
  }

  async getOrCreateConversation(identifierInput: string): Promise<any> {
    if (!this.isConnectedState || !this.client) throw new Error('Client not connected');

    console.log('🔍 Getting or creating DM with:', identifierInput);

    // Return cached if we have it (by any key)
    const cached = this.conversations.get(identifierInput);
    if (cached) {
      console.log('✅ Found existing conversation (cached)');
      return cached;
    }

    const looksLikeEthAddress = /^0x[a-fA-F0-9]{40}$/.test(identifierInput);

    try {
      let inboxId: string | undefined = undefined;

      if (looksLikeEthAddress) {
        console.log('🆕 Resolving inbox ID from Ethereum address...');
        const identifier = { identifier: identifierInput, identifierKind: 'Ethereum' as const };
        inboxId = await this.client.findInboxIdByIdentifier(identifier);
        if (!inboxId) {
          throw new Error(`Peer ${identifierInput} is not reachable on XMTP`);
        }
      } else {
        // Assume the input is already an inbox ID
        inboxId = identifierInput;
      }

      // Try to get an existing DM first
      let dm = await this.client.conversations.getDmByInboxId(inboxId);
      if (!dm) {
        console.log('🆕 Creating new DM with inboxId:', inboxId);
        dm = await this.client.conversations.newDm(inboxId);
      }

      console.log('✅ Ready DM:', dm);

      // Cache by both inboxId and eth address (if known)
      const idKey = dm?.id || dm?.conversationId || dm?.dmId || inboxId;
      this.conversations.set(idKey, dm);
      this.conversations.set(inboxId, dm);
      if (looksLikeEthAddress) this.conversations.set(identifierInput, dm);

      return dm;
    } catch (error) {
      console.error('❌ Failed to get/create DM:', error);
      throw error;
    }
  }

  async sendAudioMessage(
    conversation: any,
    audioBlob: Blob,
    filename: string,
    correctAnswer?: string
  ): Promise<void> {
    if (!this.isConnectedState) throw new Error('Client not connected');

    try {
      console.log('🎤 Sending audio message...', { filename, correctAnswer });
      
      // Convert audio blob to data URL so it can be rendered on other devices
      const dataUrl: string = await new Promise((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        } catch (e) {
          reject(e);
        }
      });

      const messageData = {
        type: 'audio-challenge',
        // Use data URL for cross-device compatibility
        audioData: dataUrl,
        filename,
        correctAnswer,
        timestamp: new Date().toISOString(),
      };

      const messageText = JSON.stringify(messageData);
      console.log('📤 Sending message:', messageText);
      
      await conversation.send(messageText);
      console.log('✅ Audio message sent successfully');
    } catch (error) {
      console.error('❌ Failed to send audio message:', error);
      throw error;
    }
  }

  async sendTextMessage(conversation: any, text: string): Promise<void> {
    if (!this.isConnectedState) throw new Error('Client not connected');
    try {
      const payload = {
        type: 'text',
        text,
        timestamp: new Date().toISOString(),
      };
      const messageText = JSON.stringify(payload);
      console.log('💬 Sending text message:', messageText);
      await conversation.send(messageText);
      console.log('✅ Text message sent');
    } catch (error) {
      console.error('❌ Failed to send text message:', error);
      throw error;
    }
  }

  async sendGuess(
    conversation: any,
    guess: string,
    originalMessageId: string
  ): Promise<void> {
    try {
      console.log('🤔 Sending guess...', { guess, originalMessageId });
      
      const guessMessage = {
        type: 'guess',
        guess,
        originalMessageId,
        timestamp: new Date().toISOString(),
      };

      const messageText = JSON.stringify(guessMessage);
      console.log('📤 Sending guess message:', messageText);
      
      await conversation.send(messageText);
      console.log('✅ Guess sent successfully');
    } catch (error) {
      console.error('❌ Failed to send guess:', error);
      throw error;
    }
  }

  async listenToMessages(
    conversation: any,
    onMessage: (message: AudioMessage) => void
  ): Promise<() => void> {
    try {
      console.log('👂 Setting up message listener for conversation...');

      const conversationId = conversation?.id || conversation?.conversationId;
      const peerAddress = conversation?.peerAddress || conversation?.peerInboxId;
      console.log('🧭 Listener target', { conversationId, peerAddress });

      // Fallback to streaming all messages and filtering by conversation id/peer
      const stream = await this.client.conversations.streamAllMessages({
        onValue: (message: any) => {
          try {
            const inSameConversation = conversationId
              ? message.conversationId === conversationId
              : peerAddress
                ? (message.senderAddress === peerAddress || message.recipientAddress === peerAddress)
                : true;

            if (!inSameConversation) return;

            console.log('📨 Received message (filtered):', message);
            const content = message.content ?? message;
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;

            if (parsed?.type === 'audio-challenge') {
              const audioMessage: AudioMessage = {
                id: message.id || message.messageId || Date.now().toString(),
                audioUrl: parsed.audioUrl || parsed.audioData,
                filename: parsed.filename,
                timestamp: new Date(parsed.timestamp || Date.now()),
                sender: message.senderAddress || message.senderInboxId || message.from || 'unknown',
                correctAnswer: parsed.correctAnswer,
                type: 'audio',
              };
              onMessage(audioMessage);
            } else if (parsed?.type === 'text') {
              const textMessage: AudioMessage = {
                id: message.id || message.messageId || Date.now().toString(),
                text: parsed.text,
                timestamp: new Date(parsed.timestamp || Date.now()),
                sender: message.senderAddress || message.senderInboxId || message.from || 'unknown',
                type: 'text',
              };
              onMessage(textMessage);
            } else if (parsed?.type === 'guess') {
              const guessUpdate: AudioMessage = {
                id: parsed.originalMessageId,
                guess: parsed.guess,
                timestamp: new Date(parsed.timestamp || Date.now()),
                sender: message.senderAddress || message.senderInboxId || message.from || 'unknown',
                type: 'guess',
              };
              onMessage(guessUpdate);
            }
          } catch (err) {
            console.error('❌ Failed to process streamed message:', err);
          }
        },
        onError: (err: any) => {
          console.error('❌ Stream error:', err);
        },
      });

      console.log('✅ Message listener set up successfully (global stream with filter)');
      return () => {
        try { stream.end?.(); } catch {}
      };
    } catch (error) {
      console.error('❌ Failed to set up message listener:', error);
      throw error;
    }
  }

  async setupGlobalMessageListener(onNewMessage: (message: AudioMessage) => void) {
    if (!this.client) {
      console.log('❌ Client not connected, cannot setup global listener');
      return;
    }

    try {
      console.log('🌐 Setting up global message listener...');
      
      // Stream all messages from all conversations
      const stream = await this.client.conversations.streamAllMessages({
        onValue: (message: any) => {
          console.log('🌐 Global message received:', message);
          this.handleIncomingMessage(message, onNewMessage);
        },
        onError: (error: any) => {
          console.error('❌ Global message stream error:', error);
        }
      });
      
      console.log('✅ Global message listener set up');
      return stream;
    } catch (error) {
      console.error('❌ Failed to setup global message listener:', error);
    }
  }

  private handleIncomingMessage(message: any, onNewMessage: (message: AudioMessage) => void) {
    try {
      const content = message.content || message;
      console.log('📄 Processing global message content:', content);
      
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      console.log('🔍 Parsed global message:', parsed);
      
      if (parsed.type === 'audio-challenge') {
        console.log('🎤 Processing global audio challenge');
        const audioMessage: AudioMessage = {
          id: message.id || message.messageId || Date.now().toString(),
          audioUrl: parsed.audioUrl || parsed.audioData,
          filename: parsed.filename,
          timestamp: new Date(parsed.timestamp || Date.now()),
          sender: message.senderAddress || message.senderInboxId || message.from || 'unknown',
          correctAnswer: parsed.correctAnswer,
          type: 'audio',
        };
        console.log('✅ Created global audio message:', audioMessage);
        onNewMessage(audioMessage);
      } else if (parsed.type === 'text') {
        const textMessage: AudioMessage = {
          id: message.id || message.messageId || Date.now().toString(),
          text: parsed.text,
          timestamp: new Date(parsed.timestamp || Date.now()),
          sender: message.senderAddress || message.senderInboxId || message.from || 'unknown',
          type: 'text',
        };
        onNewMessage(textMessage);
      } else if (parsed.type === 'guess') {
        const guessUpdate: AudioMessage = {
          id: parsed.originalMessageId,
          guess: parsed.guess,
          timestamp: new Date(parsed.timestamp || Date.now()),
          sender: message.senderAddress || message.senderInboxId || message.from || 'unknown',
          type: 'guess',
        };
        onNewMessage(guessUpdate);
      }
    } catch (error) {
      console.error('❌ Failed to process global message:', error);
    }
  }

  isConnected(): boolean {
    return this.isConnectedState;
  }

  getClient(): any {
    return this.client;
  }
}

export const xmtpGameClient = new XMTPGameClient(); 