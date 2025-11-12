import { Quote, Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Install uuid for generating IDs
// npm install uuid && npm install -D @types/uuid

const now = new Date();

export const categories: Category[] = [
  {
    id: uuidv4(),
    name: 'Wisdom',
    description: 'Timeless wisdom and life lessons',
    color: '#8B5CF6',
    createdAt: now
  },
  {
    id: uuidv4(),
    name: 'Motivation',
    description: 'Inspiring quotes to fuel your journey',
    color: '#06B6D4',
    createdAt: now
  },
  {
    id: uuidv4(),
    name: 'Philosophy',
    description: 'Deep thoughts and philosophical insights',
    color: '#F59E0B',
    createdAt: now
  },
  {
    id: uuidv4(),
    name: 'Success',
    description: 'Keys to achievement and excellence',
    color: '#10B981',
    createdAt: now
  }
];

export const sampleQuotes: Quote[] = [
  {
    id: uuidv4(),
    text: "The only way to do great work is to love what you do.",
    author: 'Steve Jobs',
    category: 'Success',
    tags: ['work', 'passion', 'excellence'],
    createdAt: new Date('2025-10-24'),
    updatedAt: new Date('2025-10-24'),
    source: 'Stanford Commencement Address, 2005',
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "The unexamined life is not worth living.",
    author: 'Socrates',
    category: 'Philosophy',
    tags: ['self-reflection', 'philosophy', 'wisdom'],
    createdAt: new Date('2025-10-24'),
    updatedAt: new Date('2025-10-24'),
    source: 'Plato\'s Apology',
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "In the middle of difficulty lies opportunity.",
    author: 'Albert Einstein',
    category: 'Motivation',
    tags: ['opportunity', 'challenges', 'perspective'],
    createdAt: new Date('2025-10-24'),
    updatedAt: new Date('2025-10-24'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "The journey of a thousand miles begins with one step.",
    author: 'Laozi',
    category: 'Wisdom',
    tags: ['beginnings', 'progress', 'action'],
    createdAt: new Date('2025-10-25'),
    updatedAt: new Date('2025-10-25'),
    source: 'Tao Te Ching',
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "Without music, life would be a mistake.",
    author: 'Friedrich Nietzsche',
    category: 'Philosophy',
    tags: ['music', 'life', 'philosophy'],
    createdAt: new Date('2025-10-26'),
    updatedAt: new Date('2025-10-26'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "Life isn't about finding yourself. Life is about creating yourself.",
    author: 'George Bernard Shaw',
    category: 'Motivation',
    tags: ['self-discovery', 'personal-growth', 'motivation'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "There is no friend as loyal as a book.",
    author: 'Ernest Hemingway',
    category: 'Wisdom',
    tags: ['books', 'friendship', 'loyalty'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "Do what you can, with what you have, where you are.",
    author: 'Theodore Roosevelt',
    category: 'Motivation',
    tags: ['action', 'determination', 'motivation'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "Darkness cannot drive out darkness: only light can do that. Hate cannot drive out hate: only love can do that.",
    author: 'Martin Luther King Jr.',
    category: 'Wisdom',
    tags: ['love', 'light', 'hate'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    source: 'Strength to Love, 1963',
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "Be yourself; everyone else is already taken.",
    author: 'Oscar Wilde',
    category: 'Wisdom',
    tags: ['self-acceptance', 'authenticity'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: 'Ralph Waldo Emerson',
    category: 'Philosophy',
    tags: ['self-reliance', 'individuality', 'philosophy'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "The fear of death follows from the fear of life. A man who lives fully is prepared to die at any time.",
    author: 'Mark Twain',
    category: 'Philosophy',
    tags: ['life', 'death', 'fear'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    isPublic: true
  },
  {
    id: uuidv4(),
    text: "Music expresses that which cannot be put into words and that which cannot remain silent.",
    author: 'Victor Hugo',
    category: 'Wisdom',
    tags: ['music', 'expression', 'emotion'],
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date('2025-11-12'),
    isPublic: true
  }
];
