export interface Sound {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const SOUND_LIBRARY: Sound[] = [
  // Animal Sounds
  { id: 'elephant', name: 'Elephant', category: 'Animals', description: 'Trumpeting elephant sound', difficulty: 'easy' },
  { id: 'lion', name: 'Lion', category: 'Animals', description: 'Lion roaring', difficulty: 'easy' },
  { id: 'cat', name: 'Cat', category: 'Animals', description: 'Cat meowing', difficulty: 'easy' },
  { id: 'dog', name: 'Dog', category: 'Animals', description: 'Dog barking', difficulty: 'easy' },
  { id: 'cow', name: 'Cow', category: 'Animals', description: 'Cow mooing', difficulty: 'easy' },
  { id: 'pig', name: 'Pig', category: 'Animals', description: 'Pig oinking', difficulty: 'easy' },
  { id: 'sheep', name: 'Sheep', category: 'Animals', description: 'Sheep bleating', difficulty: 'easy' },
  { id: 'horse', name: 'Horse', category: 'Animals', description: 'Horse neighing', difficulty: 'medium' },
  { id: 'chicken', name: 'Chicken', category: 'Animals', description: 'Chicken clucking', difficulty: 'easy' },
  { id: 'duck', name: 'Duck', category: 'Animals', description: 'Duck quacking', difficulty: 'easy' },
  { id: 'owl', name: 'Owl', category: 'Animals', description: 'Owl hooting', difficulty: 'medium' },
  { id: 'wolf', name: 'Wolf', category: 'Animals', description: 'Wolf howling', difficulty: 'medium' },
  { id: 'monkey', name: 'Monkey', category: 'Animals', description: 'Monkey chattering', difficulty: 'medium' },
  { id: 'frog', name: 'Frog', category: 'Animals', description: 'Frog croaking', difficulty: 'easy' },
  { id: 'bee', name: 'Bee', category: 'Animals', description: 'Bee buzzing', difficulty: 'easy' },
  { id: 'snake', name: 'Snake', category: 'Animals', description: 'Snake hissing', difficulty: 'medium' },
  { id: 'dolphin', name: 'Dolphin', category: 'Animals', description: 'Dolphin clicking', difficulty: 'hard' },
  { id: 'whale', name: 'Whale', category: 'Animals', description: 'Whale singing', difficulty: 'hard' },

  // Vehicle Sounds
  { id: 'car_horn', name: 'Car Horn', category: 'Vehicles', description: 'Car horn honking', difficulty: 'easy' },
  { id: 'ambulance', name: 'Ambulance', category: 'Vehicles', description: 'Ambulance siren', difficulty: 'easy' },
  { id: 'fire_truck', name: 'Fire Truck', category: 'Vehicles', description: 'Fire truck siren', difficulty: 'easy' },
  { id: 'police_car', name: 'Police Car', category: 'Vehicles', description: 'Police car siren', difficulty: 'easy' },
  { id: 'motorcycle', name: 'Motorcycle', category: 'Vehicles', description: 'Motorcycle engine', difficulty: 'medium' },
  { id: 'truck', name: 'Truck', category: 'Vehicles', description: 'Truck horn', difficulty: 'easy' },
  { id: 'train', name: 'Train', category: 'Vehicles', description: 'Train whistle', difficulty: 'medium' },
  { id: 'airplane', name: 'Airplane', category: 'Vehicles', description: 'Airplane engine', difficulty: 'medium' },
  { id: 'helicopter', name: 'Helicopter', category: 'Vehicles', description: 'Helicopter blades', difficulty: 'medium' },
  { id: 'boat', name: 'Boat', category: 'Vehicles', description: 'Boat horn', difficulty: 'easy' },
  { id: 'subway', name: 'Subway', category: 'Vehicles', description: 'Subway train', difficulty: 'medium' },

  // Musical Instruments
  { id: 'guitar', name: 'Guitar', category: 'Instruments', description: 'Guitar strumming', difficulty: 'medium' },
  { id: 'piano', name: 'Piano', category: 'Instruments', description: 'Piano keys', difficulty: 'medium' },
  { id: 'drums', name: 'Drums', category: 'Instruments', description: 'Drum beat', difficulty: 'easy' },
  { id: 'violin', name: 'Violin', category: 'Instruments', description: 'Violin playing', difficulty: 'hard' },
  { id: 'trumpet', name: 'Trumpet', category: 'Instruments', description: 'Trumpet blast', difficulty: 'medium' },
  { id: 'saxophone', name: 'Saxophone', category: 'Instruments', description: 'Saxophone jazz', difficulty: 'medium' },
  { id: 'flute', name: 'Flute', category: 'Instruments', description: 'Flute melody', difficulty: 'hard' },
  { id: 'harmonica', name: 'Harmonica', category: 'Instruments', description: 'Harmonica blues', difficulty: 'medium' },
  { id: 'accordion', name: 'Accordion', category: 'Instruments', description: 'Accordion polka', difficulty: 'medium' },
  { id: 'bagpipes', name: 'Bagpipes', category: 'Instruments', description: 'Bagpipes drone', difficulty: 'hard' },

  // Household Items
  { id: 'doorbell', name: 'Doorbell', category: 'Household', description: 'Doorbell ringing', difficulty: 'easy' },
  { id: 'phone', name: 'Phone', category: 'Household', description: 'Phone ringing', difficulty: 'easy' },
  { id: 'alarm_clock', name: 'Alarm Clock', category: 'Household', description: 'Alarm clock beeping', difficulty: 'easy' },
  { id: 'microwave', name: 'Microwave', category: 'Household', description: 'Microwave ding', difficulty: 'easy' },
  { id: 'blender', name: 'Blender', category: 'Household', description: 'Blender whirring', difficulty: 'medium' },
  { id: 'vacuum', name: 'Vacuum', category: 'Household', description: 'Vacuum cleaner', difficulty: 'medium' },
  { id: 'washing_machine', name: 'Washing Machine', category: 'Household', description: 'Washing machine cycle', difficulty: 'medium' },
  { id: 'dishwasher', name: 'Dishwasher', category: 'Household', description: 'Dishwasher running', difficulty: 'medium' },
  { id: 'toaster', name: 'Toaster', category: 'Household', description: 'Toaster pop', difficulty: 'easy' },
  { id: 'coffee_maker', name: 'Coffee Maker', category: 'Household', description: 'Coffee brewing', difficulty: 'medium' },
  { id: 'refrigerator', name: 'Refrigerator', category: 'Household', description: 'Refrigerator hum', difficulty: 'medium' },

  // Nature Sounds
  { id: 'thunder', name: 'Thunder', category: 'Nature', description: 'Thunder clap', difficulty: 'easy' },
  { id: 'rain', name: 'Rain', category: 'Nature', description: 'Rain falling', difficulty: 'medium' },
  { id: 'wind', name: 'Wind', category: 'Nature', description: 'Wind blowing', difficulty: 'medium' },
  { id: 'waves', name: 'Ocean Waves', category: 'Nature', description: 'Ocean waves crashing', difficulty: 'medium' },
  { id: 'waterfall', name: 'Waterfall', category: 'Nature', description: 'Waterfall rushing', difficulty: 'medium' },
  { id: 'stream', name: 'Stream', category: 'Nature', description: 'Stream bubbling', difficulty: 'hard' },
  { id: 'fire', name: 'Fire', category: 'Nature', description: 'Fire crackling', difficulty: 'medium' },
  { id: 'volcano', name: 'Volcano', category: 'Nature', description: 'Volcano rumbling', difficulty: 'hard' },
  { id: 'avalanche', name: 'Avalanche', category: 'Nature', description: 'Avalanche crashing', difficulty: 'hard' },

  // Human Sounds
  { id: 'sneeze', name: 'Sneeze', category: 'Human', description: 'Person sneezing', difficulty: 'easy' },
  { id: 'cough', name: 'Cough', category: 'Human', description: 'Person coughing', difficulty: 'easy' },
  { id: 'laugh', name: 'Laugh', category: 'Human', description: 'Person laughing', difficulty: 'easy' },
  { id: 'cry', name: 'Cry', category: 'Human', description: 'Person crying', difficulty: 'medium' },
  { id: 'whistle', name: 'Whistle', category: 'Human', description: 'Person whistling', difficulty: 'medium' },
  { id: 'clap', name: 'Clap', category: 'Human', description: 'Hands clapping', difficulty: 'easy' },
  { id: 'footsteps', name: 'Footsteps', category: 'Human', description: 'Footsteps walking', difficulty: 'medium' },
  { id: 'heartbeat', name: 'Heartbeat', category: 'Human', description: 'Heart beating', difficulty: 'hard' },
  { id: 'snore', name: 'Snore', category: 'Human', description: 'Person snoring', difficulty: 'easy' },
  { id: 'hiccup', name: 'Hiccup', category: 'Human', description: 'Person hiccuping', difficulty: 'medium' },

  // Machine Sounds
  { id: 'chainsaw', name: 'Chainsaw', category: 'Machines', description: 'Chainsaw cutting', difficulty: 'medium' },
  { id: 'lawn_mower', name: 'Lawn Mower', category: 'Machines', description: 'Lawn mower running', difficulty: 'medium' },
  { id: 'jackhammer', name: 'Jackhammer', category: 'Machines', description: 'Jackhammer drilling', difficulty: 'medium' },
  { id: 'drill', name: 'Drill', category: 'Machines', description: 'Power drill', difficulty: 'medium' },
  { id: 'saw', name: 'Saw', category: 'Machines', description: 'Circular saw cutting', difficulty: 'medium' },
  { id: 'generator', name: 'Generator', category: 'Machines', description: 'Generator running', difficulty: 'medium' },
  { id: 'air_compressor', name: 'Air Compressor', category: 'Machines', description: 'Air compressor', difficulty: 'medium' },
  { id: 'conveyor_belt', name: 'Conveyor Belt', category: 'Machines', description: 'Conveyor belt moving', difficulty: 'hard' },
  { id: 'printing_press', name: 'Printing Press', category: 'Machines', description: 'Printing press', difficulty: 'hard' },
  { id: 'cash_register', name: 'Cash Register', category: 'Machines', description: 'Cash register ding', difficulty: 'easy' },

  // Sports & Recreation
  { id: 'basketball', name: 'Basketball', category: 'Sports', description: 'Basketball bouncing', difficulty: 'easy' },
  { id: 'tennis', name: 'Tennis', category: 'Sports', description: 'Tennis ball hit', difficulty: 'medium' },
  { id: 'golf', name: 'Golf', category: 'Sports', description: 'Golf club swing', difficulty: 'medium' },
  { id: 'bowling', name: 'Bowling', category: 'Sports', description: 'Bowling ball rolling', difficulty: 'medium' },
  { id: 'ping_pong', name: 'Ping Pong', category: 'Sports', description: 'Ping pong ball', difficulty: 'medium' },
  { id: 'pool', name: 'Pool', category: 'Sports', description: 'Pool ball hitting', difficulty: 'medium' },
  { id: 'archery', name: 'Archery', category: 'Sports', description: 'Bow and arrow', difficulty: 'hard' },
  { id: 'fishing', name: 'Fishing', category: 'Sports', description: 'Fishing line cast', difficulty: 'hard' },
  { id: 'skateboard', name: 'Skateboard', category: 'Sports', description: 'Skateboard rolling', difficulty: 'medium' },
  { id: 'roller_skates', name: 'Roller Skates', category: 'Sports', description: 'Roller skates', difficulty: 'medium' },
];

export function getRandomSound(): Sound {
  const randomIndex = Math.floor(Math.random() * SOUND_LIBRARY.length);
  return SOUND_LIBRARY[randomIndex];
}

export function getSoundsByCategory(category: string): Sound[] {
  return SOUND_LIBRARY.filter(sound => sound.category === category);
}

export function getSoundsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Sound[] {
  return SOUND_LIBRARY.filter(sound => sound.difficulty === difficulty);
}

export const SOUND_CATEGORIES = Array.from(new Set(SOUND_LIBRARY.map(sound => sound.category))); 