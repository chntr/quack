"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { 
  Mic, 
  Play, 
  Settings, 
  Plus, 
  User, 
  Volume2, 
  X, 
  Send,
  ChevronLeft,
  Gamepad2,
  Trophy,
  Users
} from 'lucide-react';
import { xmtpGameClient, AudioMessage } from '../../lib/xmtp-client';
import { getRandomSound, Sound } from '../../lib/sound-library';
import { Button } from './Button';

interface Game {
  id: string;
  peerAddress: string;
  peerName: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface MobileGameProps {
  // Component props can be added here in the future
}

export function MobileGame({}: MobileGameProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [currentView, setCurrentView] = useState<'main' | 'new-game' | 'game' | 'settings'>('main');
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [currentConversation, setCurrentConversation] = useState<unknown>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Game[]>([]);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [assignedSound, setAssignedSound] = useState<Sound | null>(null);
  const [guess, setGuess] = useState('');
  
  // New game state
  const [newPeerAddress, setNewPeerAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectedToXMTP, setIsConnectedToXMTP] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add debug log
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setDebugInfo(prev => [...prev.slice(-9), logEntry]); // Keep last 10 logs
  }, []);

  // Load games from localStorage
  const loadGamesFromStorage = useCallback(() => {
    try {
      addDebugLog('Loading games from localStorage');
      const storedGames = localStorage.getItem('glorp-games');
      if (storedGames) {
        const parsedGames = JSON.parse(storedGames);
        setGames(parsedGames);
        addDebugLog(`Loaded ${parsedGames.length} games from storage`);
      }
      
      const storedMessages = localStorage.getItem('glorp-messages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages);
        addDebugLog(`Loaded ${parsedMessages.length} messages from storage`);
      }
    } catch (error) {
      console.error('Failed to load games from storage:', error);
      addDebugLog(`Error loading from storage: ${error}`);
    }
  }, [addDebugLog]);

  // Save games to localStorage
  const saveGamesToStorage = useCallback((gameList: Game[]) => {
    try {
      localStorage.setItem('glorp-games', JSON.stringify(gameList));
    } catch (error) {
      console.error('Failed to save games to storage:', error);
    }
  }, []);

  // Save messages to localStorage
  const saveMessagesToStorage = useCallback((messageList: AudioMessage[]) => {
    try {
      localStorage.setItem('glorp-messages', JSON.stringify(messageList));
    } catch (error) {
      console.error('Failed to save messages to storage:', error);
    }
  }, []);

  // Connect to XMTP
  const connectToXMTP = useCallback(async () => {
    if (!walletClient || !address) {
      console.log('❌ Cannot connect: missing walletClient or address', { 
        hasWalletClient: !!walletClient, 
        hasAddress: !!address 
      });
      return;
    }

    try {
      addDebugLog('🚀 Starting XMTP connection...');
      setIsLoading(true);
      await xmtpGameClient.connect(walletClient);
      setIsConnectedToXMTP(true);
      addDebugLog('✅ XMTP connection successful');
      
      // Load existing conversations from XMTP
      addDebugLog('📋 Loading conversations from XMTP...');
            const conversations = await xmtpGameClient.getConversations();
      addDebugLog(`📋 Found ${conversations.length} conversations`);

      // Normalize conversations to a single DM per peer (dedupe by DM id or peer id)
      const normalizedById = new Map<string, Game>();
      const normalizedByPeer = new Map<string, Game>();

      conversations.forEach((conv: any) => {
        const idCandidate = String(
          conv?.dmId || conv?.id || conv?.conversationId || conv?.topic || conv?.groupId || conv?.inboxId || conv?.peerInboxId || ''
        );
        const peerCandidate = String(conv?.peerInboxId || conv?.peerAddress || conv?.inboxId || '');
        const labelSource = peerCandidate || idCandidate || 'Unknown';
        const isHexLike = labelSource.startsWith('0x') && labelSource.length >= 10;
        const peerName = isHexLike ? `${labelSource.slice(0, 6)}...${labelSource.slice(-4)}` : labelSource;
        const game: Game = {
          id: idCandidate || peerCandidate || `conv_${Date.now()}`,
          peerAddress: peerCandidate || 'unknown',
          peerName,
          unreadCount: 0,
        };
        if (game.id) normalizedById.set(game.id, game);
        if (game.peerAddress && game.peerAddress !== 'unknown') normalizedByPeer.set(game.peerAddress, game);
      });

      const xmtpGameList: Game[] = Array.from(
        new Map(
          [...normalizedById.values(), ...normalizedByPeer.values()].map((v) => [v.id + '::' + v.peerAddress, v])
        ).values()
      );

      // Merge with local games (by id+peer combo)
      const mergedGames = [...games];
      xmtpGameList.forEach(xmtpGame => {
        const exists = mergedGames.some(g => g.id === xmtpGame.id || g.peerAddress === xmtpGame.peerAddress);
        if (!exists) mergedGames.push(xmtpGame);
      });
      
      setGames(mergedGames);
      saveGamesToStorage(mergedGames);
      
      // Setup global message listener for new invitations
      addDebugLog('🌐 Setting up global message listener...');
      await xmtpGameClient.setupGlobalMessageListener((message) => {
        addDebugLog(`🎯 Global message received from ${message.sender}`);
        
        // Check if this is a new game invitation
        const isNewGame = !mergedGames.find(g => g.peerAddress === message.sender);
        console.log('🔍 Checking if new game:', { 
          isNewGame, 
          sender: message.sender, 
          currentAddress: address,
          existingGames: mergedGames.map(g => g.peerAddress)
        });
        
        if (isNewGame && message.sender !== address) {
          addDebugLog('🎉 New game invitation detected!');
          const newInvitation: Game = {
            id: `invite_${Date.now()}`,
            peerAddress: message.sender,
            peerName: `${message.sender.slice(0, 6)}...${message.sender.slice(-4)}`,
            unreadCount: 1,
          };
          addDebugLog(`📝 Adding new invitation from ${newInvitation.peerName}`);
          setPendingInvitations(prev => [...prev, newInvitation]);
        } else {
          addDebugLog('📝 Message from existing game');
          // Update unread count for existing game
          const updatedGames = mergedGames.map(game => 
            game.peerAddress === message.sender 
              ? { ...game, unreadCount: game.unreadCount + 1 }
              : game
          );
          setGames(updatedGames);
          saveGamesToStorage(updatedGames);
        }
      });
      addDebugLog('✅ Global message listener setup complete');
    } catch (error) {
      console.error('Failed to connect to XMTP:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, games, saveGamesToStorage]);

  useEffect(() => {
    // Load games from localStorage on mount
    loadGamesFromStorage();
  }, [loadGamesFromStorage]);

  useEffect(() => {
    if (walletClient && address && !isConnectedToXMTP) {
      connectToXMTP();
    }
  }, [walletClient, address, isConnectedToXMTP, connectToXMTP]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play audio
  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  // Create new game
  const createNewGame = async () => {
    if (!newPeerAddress.trim()) return;

    try {
      setIsLoading(true);
      const conversation = await xmtpGameClient.getOrCreateConversation(newPeerAddress);

      const newId = String(conversation?.id || conversation?.conversationId || conversation?.dmId || newPeerAddress);
      const newPeer = String(newPeerAddress);
      const peerName = `${newPeer.slice(0, 6)}...${newPeer.slice(-4)}`;
      const newGame: Game = {
        id: newId,
        peerAddress: newPeer,
        peerName,
        unreadCount: 0,
      };
      
      const updatedGames = [...games, newGame];
      setGames(updatedGames);
      saveGamesToStorage(updatedGames);
      setNewPeerAddress('');
      setCurrentView('main');
    } catch (error) {
      console.error('Failed to create game:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create conversation. The peer may not be registered on XMTP.'
      );
    } finally {
      setIsLoading(false);
    }
  };


  // Start a game
  const startGame = async (game: Game) => {
    try {
      setIsLoading(true);
      const conversation = await xmtpGameClient.getOrCreateConversation(game.peerAddress);
      setCurrentConversation(conversation);
      // Update selected game with the resolved id if present
      const resolvedId = String(conversation?.id || conversation?.conversationId || conversation?.dmId || game.id);
      setSelectedGame({ ...game, id: resolvedId });
      
      // Clear unread count for this game
      const updatedGames = games.map(g => 
        g.peerAddress === game.peerAddress 
          ? { ...g, unreadCount: 0 }
          : g
      );
      setGames(updatedGames);
      saveGamesToStorage(updatedGames);
      
      // Listen for messages
      await xmtpGameClient.listenToMessages(conversation, (message) => {
        const updatedMessages = [...messages, message];
        setMessages(updatedMessages);
        saveMessagesToStorage(updatedMessages);
        
        // Check if this is a new game invitation
        const isNewGame = !games.find(g => g.peerAddress === message.sender);
        if (isNewGame && message.sender !== address) {
          const newInvitation: Game = {
            id: `invite_${Date.now()}`,
            peerAddress: message.sender,
            peerName: `${message.sender.slice(0, 6)}...${message.sender.slice(-4)}`,
            unreadCount: 1,
          };
          setPendingInvitations(prev => [...prev, newInvitation]);
        } else {
          // Update unread count for existing game
          const updatedGames = games.map(game => 
            game.peerAddress === message.sender 
              ? { ...game, unreadCount: game.unreadCount + 1 }
              : game
          );
          setGames(updatedGames);
          saveGamesToStorage(updatedGames);
        }
      });
      
      setCurrentView('game');
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send audio challenge
  const sendAudioChallenge = async () => {
    if (!audioBlob || !currentConversation || !assignedSound) return;

    try {
      setIsLoading(true);
      await xmtpGameClient.sendAudioMessage(
        currentConversation,
        audioBlob,
        `audio_${Date.now()}.wav`,
        assignedSound.name
      );
      
      // Clear the form
      setAudioBlob(null);
      setAudioUrl(null);
      setAssignedSound(null);
      
      // Add to local messages
      const newMessage: AudioMessage = {
        id: Date.now().toString(),
        audioUrl: audioUrl!,
        filename: `audio_${Date.now()}.wav`,
        timestamp: new Date(),
        sender: address!,
        correctAnswer: assignedSound.name,
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      saveMessagesToStorage(updatedMessages);
    } catch (error) {
      console.error('Failed to send audio message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send guess
  const sendGuess = async (messageId: string) => {
    if (!guess.trim() || !currentConversation) return;

    try {
      setIsLoading(true);
      await xmtpGameClient.sendGuess(currentConversation, guess, messageId);
      setGuess('');
    } catch (error) {
      console.error('Failed to send guess:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get random sound for challenge
  const getNewSoundChallenge = () => {
    const sound = getRandomSound();
    setAssignedSound(sound);
  };

  // Main screen
  if (currentView === 'main') {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-gray-900">Glorp</h1>
            <Wallet className="z-10">
              <ConnectWallet>
                <Name className="text-inherit text-sm" />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('settings')}
            className="p-2"
          >
            <Settings size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isConnected ? (
            <div className="text-center py-12">
              <Gamepad2 size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Glorp!</h2>
              <p className="text-gray-600 mb-6">Connect your wallet in the header to start playing</p>
            </div>
          ) : (
            <>
              {/* New Game Button */}
              <Button
                onClick={() => setCurrentView('new-game')}
                className="w-full mb-6 bg-blue-500 text-white py-4 text-lg font-semibold"
                icon={<Plus size={20} />}
              >
                Start New Game
              </Button>

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">New Invitations</h2>
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{invitation.peerName}</h3>
                            <p className="text-sm text-yellow-700">Wants to play Glorp with you!</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setPendingInvitations(prev => prev.filter(i => i.id !== invitation.id));
                            const updatedGames = [...games, invitation];
                            setGames(updatedGames);
                            saveGamesToStorage(updatedGames);
                          }}
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Games List */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Games</h2>
                {games.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No active games</p>
                    <p className="text-sm text-gray-600">Start a new game to begin playing!</p>
                  </div>
                ) : (
                  games.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => startGame(game)}
                      className="bg-white rounded-lg p-4 border border-gray-200 active:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{game.peerName}</h3>
                                                <p className="text-sm text-gray-600">
                      {game.lastMessage || 'No messages yet'}
                    </p>
                          </div>
                        </div>
                        {game.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {game.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // New game screen
  if (currentView === 'new-game') {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('main')}
            className="mr-3"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold">New Game</h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Enter Friend&apos;s Address</h2>
            <input
              type="text"
              placeholder="0x..."
              value={newPeerAddress}
              onChange={(e) => setNewPeerAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 bg-white text-gray-900"
            />
            <Button
              onClick={createNewGame}
              disabled={!newPeerAddress.trim() || isLoading}
              className="w-full bg-blue-500 text-white py-3"
            >
              {isLoading ? 'Creating...' : 'Start Game'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  if (currentView === 'game' && selectedGame) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('main')}
            className="mr-3"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="font-semibold">{selectedGame.peerName}</h1>
            <p className="text-sm text-gray-600">Glorp</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Trophy size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No challenges yet</p>
                                  <p className="text-sm text-gray-600">Record a sound to start!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === address ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.sender === address
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Button
                      onClick={() => playAudio(message.audioUrl)}
                      disabled={isPlaying}
                      variant="outline"
                      size="sm"
                      className={message.sender === address ? 'text-white border-white' : ''}
                    >
                      <Volume2 size={16} />
                      <span>Play</span>
                    </Button>
                  </div>
                  
                  {message.sender !== address && !message.guess && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="What do you think this is?"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none bg-white text-gray-900"
                      />
                      <Button
                        onClick={() => sendGuess(message.id)}
                        disabled={!guess.trim() || isLoading}
                        size="sm"
                        className="w-full"
                      >
                        Send Guess
                      </Button>
                    </div>
                  )}

                  {message.guess && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border">
                      <p className="text-sm">
                        <strong>Guess:</strong> {message.guess}
                      </p>
                      {message.correctAnswer && (
                        <p className="text-sm mt-1">
                          <strong>Answer:</strong> {message.correctAnswer}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recording Section */}
        <div className="bg-white border-t border-gray-200 p-4">
          {!assignedSound ? (
            <Button
              onClick={getNewSoundChallenge}
              className="w-full bg-green-500 text-white py-4 text-lg font-semibold"
            >
              Get Sound Challenge
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-semibold text-blue-900">Your Challenge:</h3>
                <p className="text-blue-800">{assignedSound.name}</p>
                <p className="text-sm text-blue-600">{assignedSound.description}</p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  className={`flex items-center space-x-2 px-6 py-3 ${
                    isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  <Mic size={20} />
                  <span>{isRecording ? 'Stop' : 'Record'}</span>
                </Button>
                
                {audioUrl && (
                  <>
                    <Button
                      onClick={() => playAudio(audioUrl)}
                      disabled={isPlaying}
                      variant="outline"
                      size="sm"
                      className="px-4 py-3"
                    >
                      <Play size={20} />
                    </Button>
                    <Button
                      onClick={() => {
                        setAudioBlob(null);
                        setAudioUrl(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="px-4 py-3"
                    >
                      <X size={20} />
                    </Button>
                  </>
                )}
              </div>
              
              {audioUrl && (
                <Button
                  onClick={sendAudioChallenge}
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white py-3"
                  icon={<Send size={20} />}
                >
                  {isLoading ? 'Sending...' : 'Send Challenge'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    );
  }

  // Settings screen
  if (currentView === 'settings') {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('main')}
            className="mr-3"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Game Settings</h2>
            <p className="text-gray-600 mb-4">
              Glorp is a fun game where you record sounds and challenge friends to guess what they are!
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-black">Connected to XMTP</span>
                <span className={isConnectedToXMTP ? 'text-green-500' : 'text-red-500'}>
                  {isConnectedToXMTP ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-black">Active Games</span>
                <span className="font-semibold text-black">{games.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-black">Pending Invitations</span>
                <span className="font-semibold text-black">{pendingInvitations.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-black">Total Messages</span>
                <span className="font-semibold text-black">{messages.length}</span>
              </div>
            </div>
            
            {/* Debug Panel */}
            <div className="border-t pt-4">
              <h3 className="text-md font-semibold mb-2">Debug Logs</h3>
              <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
                {debugInfo.length === 0 ? (
                  <div className="text-gray-500">No debug logs yet...</div>
                ) : (
                  debugInfo.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                )}
              </div>
              <Button
                onClick={() => setDebugInfo([])}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 