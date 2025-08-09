# Audio Guessing Game

A fun audio guessing game built with XMTP messaging and Base MiniKit! Record sounds and challenge your friends to guess what they are.

## Features

- 🎤 **Audio Recording**: Record sounds directly in the browser
- 🎮 **1-on-1 Games**: Play with friends using their wallet addresses
- 🔐 **Secure Messaging**: Built on XMTP for encrypted communication
- 📱 **Mobile Friendly**: Works great on mobile devices
- 🎯 **Guessing System**: Send and receive audio challenges with guessing

## How to Play

1. **Connect Your Wallet**: Use any Web3 wallet (MetaMask, Coinbase Wallet, etc.)
2. **Start a Game**: Enter your friend's wallet address to start a new game
3. **Record a Sound**: Click the microphone button and record a sound (e.g., animal noises, car horns, etc.)
4. **Send Challenge**: Add a description of what the sound is and send it to your friend
5. **Guess Away**: Your friend receives the audio and can guess what it is
6. **Keep Playing**: Games can go on forever with back-and-forth challenges!

## Technical Stack

- **Frontend**: Next.js 15 with React 18
- **Styling**: Tailwind CSS
- **Wallet Integration**: Wagmi + Viem
- **Messaging**: XMTP Browser SDK
- **Deployment**: Base MiniKit

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Game Flow

1. **Connect**: Connect your wallet to access the game
2. **Find Friends**: Enter a friend's wallet address to start a conversation
3. **Record**: Use the microphone to record your sound
4. **Describe**: Tell the app what sound you're making (this is the correct answer)
5. **Send**: Send the audio challenge to your friend
6. **Guess**: Your friend listens and tries to guess what it is
7. **Repeat**: Keep the game going with new challenges!

## Audio Recording Tips

- **Clear Sounds**: Make sure your recording environment is quiet
- **Be Creative**: Try different types of sounds - animals, vehicles, instruments, etc.
- **Keep it Short**: 3-5 seconds is usually perfect for guessing games
- **Have Fun**: The sillier the sound, the more fun the guessing!

## Privacy & Security

- All audio is encrypted using XMTP's secure messaging protocol
- Audio files are stored locally and not uploaded to any servers
- Wallet addresses are used only for message routing
- No personal data is collected or stored

## Future Enhancements

- [ ] Real-time audio streaming
- [ ] Group games with multiple players
- [ ] Score tracking and leaderboards
- [ ] Sound effects and animations
- [ ] Integration with other messaging platforms

## Contributing

This is a demo project built with Base MiniKit. Feel free to fork and enhance it with your own features!

## License

MIT License - feel free to use this code for your own projects.
