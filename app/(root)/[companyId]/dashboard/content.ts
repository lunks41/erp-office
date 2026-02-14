/**
 * Dashboard content: quotes (100–150 with author), affirmations, tips of the day, one thing today.
 * Used for random rotation every 50–60 seconds.
 */

export interface QuoteItem {
  quote: string
  author: string
}

export const QUOTES: QuoteItem[] = [
  {
    quote:
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    quote: "We may encounter many defeats but we must not be defeated.",
    author: "Maya Angelou",
  },
  {
    quote: "The key to success is to focus on goals, not obstacles.",
    author: "Unknown",
  },
  { quote: "Dream it. Believe it. Build it.", author: "Unknown" },
  {
    quote: "Life is 10% what happens to you and 90% how you react to it.",
    author: "Charles R. Swindoll",
  },
  {
    quote:
      "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  {
    quote: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
  },
  {
    quote: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
  },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
  },
  {
    quote: "Don't let yesterday take up too much of today.",
    author: "Will Rogers",
  },
  {
    quote: "Whether you think you can or you think you can't, you're right.",
    author: "Henry Ford",
  },
  {
    quote: "It is never too late to be what you might have been.",
    author: "George Eliot",
  },
  { quote: "You become what you believe.", author: "Oprah Winfrey" },
  {
    quote:
      "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    quote: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
  },
  {
    quote: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
  },
  {
    quote: "The world is changed by your example, not by your opinion.",
    author: "Paulo Coelho",
  },
  {
    quote:
      "Life isn't about finding yourself. Life is about creating yourself.",
    author: "George Bernard Shaw",
  },
  {
    quote:
      "Success is walking from failure to failure with no loss of enthusiasm.",
    author: "Winston Churchill",
  },
  {
    quote: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
  },
  {
    quote:
      "Our greatest weakness lies in giving up. The most certain way to succeed is to try just one more time.",
    author: "Thomas A. Edison",
  },
  {
    quote: "Have the courage to follow your heart and intuition.",
    author: "Steve Jobs",
  },
  {
    quote: "Darkness cannot drive out darkness; only light can do that.",
    author: "Martin Luther King Jr.",
  },
  {
    quote:
      "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson",
  },
  {
    quote:
      "Go confidently in the direction of your dreams. Live the life you have imagined.",
    author: "Henry David Thoreau",
  },
  { quote: "If you can dream it, you can do it.", author: "Walt Disney" },
  {
    quote:
      "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau",
  },
  {
    quote: "Don't be afraid to give up the good to go for the great.",
    author: "John D. Rockefeller",
  },
  {
    quote:
      "Innovation is the ability to see change as an opportunity—not a threat.",
    author: "Steve Jobs",
  },
  {
    quote: "People rarely succeed unless they have fun in what they are doing.",
    author: "Dale Carnegie",
  },
  { quote: "There is no substitute for hard work.", author: "Thomas Edison" },
  {
    quote: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
  {
    quote: "Push yourself, because no one else is going to do it for you.",
    author: "Unknown",
  },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  {
    quote: "Success doesn't just find you. You have to go out and get it.",
    author: "Unknown",
  },
  {
    quote:
      "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown",
  },
  { quote: "Dream bigger. Do bigger.", author: "Unknown" },
  {
    quote: "Don't stop when you're tired. Stop when you're done.",
    author: "Unknown",
  },
  {
    quote: "Wake up with determination. Go to bed with satisfaction.",
    author: "Unknown",
  },
  {
    quote: "Do something today that your future self will thank you for.",
    author: "Unknown",
  },
  { quote: "Little things make big things happen.", author: "John Wooden" },
  {
    quote: "It's going to be hard, but hard does not mean impossible.",
    author: "Unknown",
  },
  { quote: "Don't wait for opportunity. Create it.", author: "Unknown" },
  {
    quote:
      "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    author: "Unknown",
  },
  {
    quote:
      "Knowing is not enough; we must apply. Wishing is not enough; we must do.",
    author: "Johann Wolfgang von Goethe",
  },
  {
    quote: "We generate fears while we sit. We overcome them by action.",
    author: "Dr. Henry Link",
  },
  {
    quote:
      "The person who says it cannot be done should not interrupt the person doing it.",
    author: "Chinese Proverb",
  },
  {
    quote: "There are no traffic jams along the extra mile.",
    author: "Roger Staubach",
  },
  {
    quote: "I would rather die of passion than of boredom.",
    author: "Vincent van Gogh",
  },
  {
    quote: "A person who never made a mistake never tried anything new.",
    author: "Albert Einstein",
  },
  {
    quote:
      "Certain things catch your eye, but pursue only those that capture the heart.",
    author: "Ancient Indian Proverb",
  },
  {
    quote: "Believe in yourself! Have faith in your abilities!",
    author: "Norman Vincent Peale",
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
  },
  {
    quote:
      "If you are working on something exciting that you really care about, you don't have to be pushed.",
    author: "Steve Jobs",
  },
  {
    quote:
      "People who are crazy enough to think they can change the world are the ones who do.",
    author: "Rob Siltanen",
  },
  {
    quote:
      "Failure will never overtake me if my determination to succeed is strong enough.",
    author: "Og Mandino",
  },
  {
    quote:
      "Entrepreneurs are great at dealing with uncertainty and minimizing risk.",
    author: "Mohanbir Sawhney",
  },
  {
    quote:
      "Imagine your life is perfect in every respect; what would it look like?",
    author: "Brian Tracy",
  },
  {
    quote:
      "Few things can help an individual more than to place responsibility on him.",
    author: "Booker T. Washington",
  },
  {
    quote:
      "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  {
    quote:
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    quote: "It's not whether you get knocked down; it's whether you get up.",
    author: "Vince Lombardi",
  },
  { quote: "The best revenge is massive success.", author: "Frank Sinatra" },
  {
    quote: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein",
  },
  {
    quote:
      "I am not a product of my circumstances. I am a product of my decisions.",
    author: "Stephen Covey",
  },
  {
    quote:
      "Every child is an artist. The problem is staying an artist when you grow up.",
    author: "Pablo Picasso",
  },
  {
    quote: "You can't use up creativity. The more you use, the more you have.",
    author: "Maya Angelou",
  },
  {
    quote:
      "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
  },
  {
    quote: "Do what you can, with what you have, where you are.",
    author: "Theodore Roosevelt",
  },
  {
    quote: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
  },
  {
    quote:
      "Success is not the key to happiness. Happiness is the key to success.",
    author: "Albert Schweitzer",
  },
  {
    quote:
      "Try not to become a person of success, but rather try to become a person of value.",
    author: "Albert Einstein",
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    quote:
      "The only way to achieve the impossible is to believe it is possible.",
    author: "Charles Kingsleigh",
  },
  {
    quote:
      "What you get by achieving your goals is not as important as what you become.",
    author: "Zig Ziglar",
  },
  {
    quote: "The mind is everything. What you think you become.",
    author: "Buddha",
  },
  {
    quote: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
  },
  {
    quote: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis",
  },
  {
    quote: "Act as if what you do makes a difference. It does.",
    author: "William James",
  },
  {
    quote:
      "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson",
  },
  {
    quote: "The only thing we have to fear is fear itself.",
    author: "Franklin D. Roosevelt",
  },
  {
    quote: "When you have a dream, you've got to grab it and never let go.",
    author: "Carol Burnett",
  },
  {
    quote: "Nothing is impossible. The word itself says 'I'm possible!'",
    author: "Audrey Hepburn",
  },
  {
    quote: "There is nothing impossible to they who will try.",
    author: "Alexander the Great",
  },
  {
    quote: "The only bad workout is the one that didn't happen.",
    author: "Unknown",
  },
  {
    quote:
      "You don't have to see the whole staircase, just take the first step.",
    author: "Martin Luther King Jr.",
  },
  {
    quote: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
  },
  {
    quote: "Opportunities don't happen. You create them.",
    author: "Chris Grosser",
  },
  {
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
  },
  { quote: "Everything you can imagine is real.", author: "Pablo Picasso" },
  { quote: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  {
    quote: "We need to give each other the space to grow.",
    author: "Fred Rogers",
  },
  { quote: "Be so good they can't ignore you.", author: "Steve Martin" },
  {
    quote:
      "The only place where success comes before work is in the dictionary.",
    author: "Vidal Sassoon",
  },
  {
    quote: "I find that the harder I work, the more luck I seem to have.",
    author: "Thomas Jefferson",
  },
  {
    quote: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    quote: "Don't wish it were easier. Wish you were better.",
    author: "Jim Rohn",
  },
  {
    quote:
      "The struggle you're in today is developing the strength you need tomorrow.",
    author: "Unknown",
  },
  {
    quote:
      "You are braver than you believe, stronger than you seem, and smarter than you think.",
    author: "A.A. Milne",
  },
  { quote: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { quote: "The expert in anything was once a beginner.", author: "Unknown" },
  {
    quote: "Do one thing every day that scares you.",
    author: "Eleanor Roosevelt",
  },
  {
    quote:
      "Happiness is not something ready made. It comes from your own actions.",
    author: "Dalai Lama",
  },
  {
    quote: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
  },
  {
    quote: "Change your thoughts and you change your world.",
    author: "Norman Vincent Peale",
  },
  {
    quote: "The best preparation for tomorrow is doing your best today.",
    author: "H. Jackson Brown Jr.",
  },
  {
    quote:
      "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
  },
  {
    quote: "Believe in yourself. You are braver than you think.",
    author: "Unknown",
  },
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    quote:
      "Success is not the key to happiness. Happiness is the key to success.",
    author: "Albert Schweitzer",
  },
  {
    quote: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
  },
  {
    quote: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
  },
  {
    quote:
      "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
  },
  {
    quote: "In the end, we only regret the chances we didn't take.",
    author: "Unknown",
  },
  {
    quote:
      "The only thing standing between you and your goal is the story you keep telling yourself.",
    author: "Jordan Belfort",
  },
  {
    quote: "You are what you do, not what you say you'll do.",
    author: "Carl Jung",
  },
  {
    quote: "The best way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
  },
  {
    quote:
      "Success seems to be connected with action. Successful people keep moving.",
    author: "Conrad Hilton",
  },
  {
    quote: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
  },
  {
    quote:
      "The only limit to our realization of tomorrow is our doubts of today.",
    author: "Franklin D. Roosevelt",
  },
  { quote: "You don't have to be perfect to be amazing.", author: "Unknown" },
  {
    quote:
      "The only way to achieve the impossible is to believe it is possible.",
    author: "Charles Kingsleigh",
  },
  { quote: "Make each day your masterpiece.", author: "John Wooden" },
  {
    quote: "Where there is no struggle, there is no strength.",
    author: "Oprah Winfrey",
  },
  {
    quote: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis",
  },
  {
    quote:
      "The only person you should try to be better than is who you were yesterday.",
    author: "Unknown",
  },
  {
    quote: "Do what you feel in your heart to be right.",
    author: "Eleanor Roosevelt",
  },
  {
    quote:
      "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  { quote: "Nothing will work unless you do.", author: "Maya Angelou" },
  {
    quote:
      "I learned that courage was not the absence of fear, but the triumph over it.",
    author: "Nelson Mandela",
  },
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    quote:
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    quote:
      "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    quote:
      "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
  },
  {
    quote: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
  },
  {
    quote: "Whether you think you can or you think you can't, you're right.",
    author: "Henry Ford",
  },
  {
    quote: "The mind is everything. What you think you become.",
    author: "Buddha",
  },
  { quote: "The best revenge is massive success.", author: "Frank Sinatra" },
  {
    quote: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein",
  },
  {
    quote: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
  },
  { quote: "Spread love everywhere you go.", author: "Mother Teresa" },
  {
    quote: "The only thing we have to fear is fear itself.",
    author: "Franklin D. Roosevelt",
  },
  {
    quote: "Darkness cannot drive out darkness; only light can do that.",
    author: "Martin Luther King Jr.",
  },
  {
    quote: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
  },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
  },
  { quote: "If you can dream it, you can do it.", author: "Walt Disney" },
  {
    quote: "Do one thing every day that scares you.",
    author: "Eleanor Roosevelt",
  },
  {
    quote:
      "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
  },
  {
    quote:
      "The only place where success comes before work is in the dictionary.",
    author: "Vidal Sassoon",
  },
  {
    quote: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    quote:
      "The struggle you're in today is developing the strength you need tomorrow.",
    author: "Unknown",
  },
  {
    quote: "You are braver than you believe, stronger than you seem.",
    author: "A.A. Milne",
  },
  { quote: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  {
    quote:
      "Happiness is not something ready made. It comes from your own actions.",
    author: "Dalai Lama",
  },
  {
    quote: "Change your thoughts and you change your world.",
    author: "Norman Vincent Peale",
  },
  {
    quote: "The best preparation for tomorrow is doing your best today.",
    author: "H. Jackson Brown Jr.",
  },
  {
    quote: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
  },
  { quote: "Make each day your masterpiece.", author: "John Wooden" },
  { quote: "Nothing will work unless you do.", author: "Maya Angelou" },
  {
    quote:
      "I learned that courage was not the absence of fear, but the triumph over it.",
    author: "Nelson Mandela",
  },
]

export const AFFIRMATIONS: string[] = [
  "You're capable of more than you know.",
  "Small steps still move you forward.",
  "Today is a fresh chance to make progress.",
  "Your effort compounds. Keep going.",
  "One focused hour beats a scattered day.",
  "You have everything you need to succeed.",
  "Your potential is limitless.",
  "You are worthy of your goals.",
  "Every day you get a little stronger.",
  "You choose how you respond to today.",
  "You are enough, exactly as you are.",
  "Progress over perfection.",
  "You deserve rest and respect.",
  "Your ideas matter.",
  "You can handle what comes today.",
  "You are building something meaningful.",
  "Trust the process.",
  "You are braver than you think.",
  "One task at a time is enough.",
  "You are allowed to take breaks.",
  "Your voice and work have value.",
  "You are not defined by one bad day.",
  "You can learn from every outcome.",
  "You are focused and capable.",
  "You deserve to feel proud of your progress.",
  "You can start again anytime.",
  "You are resilient.",
  "You are making a difference.",
  "You belong where you are going.",
  "You can do hard things.",
  "You are allowed to ask for help.",
  "You are growing every day.",
  "You are more than your mistakes.",
  "You can change your mind and your path.",
  "You are worthy of good things.",
  "You bring something unique to the world.",
  "You can finish what you start.",
  "You are allowed to say no.",
  "You are becoming who you want to be.",
  "You can take the next small step.",
  "You are not behind; you are on your own path.",
  "You have the power to choose your focus.",
  "You are allowed to celebrate small wins.",
  "You can rest and still be productive.",
  "You are capable of calm and clarity.",
  "You are building habits that last.",
  "You deserve to feel good about your work.",
  "You can try again with more knowledge.",
  "You are enough for today.",
  "You are creating the life you want.",
]

export const TIPS_OF_DAY: string[] = [
  "Tackle your hardest task in the first 90 minutes—your focus is highest then.",
  "Batch similar work (emails, calls) into blocks instead of scattering them.",
  "Write down one 'must ship' outcome for today before opening other tabs.",
  "Take a 5-minute walk after 90 minutes of deep work to reset attention.",
  "End the day by noting 3 wins—big or small—to build momentum.",
  "Turn off non-urgent notifications during focus blocks.",
  "Start meetings with 'What's the one decision we need from this?'",
  "Use the 2-minute rule: if it takes under 2 minutes, do it now.",
  "Schedule your most important task when your energy is highest.",
  "Review your top 3 priorities each morning.",
  "Block calendar time for deep work before others fill it.",
  "Reply to the most important email first, then batch the rest.",
  "Take one real break every 2 hours—stand, stretch, or step outside.",
  "Say no to one thing today that doesn't align with your goals.",
  "Write tomorrow's top 3 tasks before you leave today.",
  "Do the ugliest task before lunch so it doesn't drag on.",
  "Put your phone in another room during focus time.",
  "Start with 10 minutes: often that's enough to build momentum.",
  "Delegate or delete one task that doesn't need you.",
  "Use a single to-do list and pick from the top.",
  "Check email at set times (e.g. 10am and 3pm) only.",
  "Before a meeting, write down the one outcome you need.",
  "After a call, note the one action item before moving on.",
  "Use a timer for focused work (e.g. 25 or 50 minutes).",
  "Declutter one surface or one folder today.",
  "Tell someone your one priority so you're accountable.",
  "Spend 5 minutes planning before diving into work.",
  "Finish one small task completely before starting another.",
  "Pause before saying yes to a new request.",
  "Write down what 'done' looks like before starting a task.",
  "Use one place for notes and tasks instead of many apps.",
  "End meetings 5 minutes early to capture actions.",
  "Do your most creative work when you're freshest.",
  "Batch admin tasks (expenses, forms) into one slot.",
  "Set one boundary today (e.g. no meetings after 4pm).",
  "Celebrate one completion before adding the next task.",
  "Ask 'Is this the best use of my time right now?'",
  "Close extra browser tabs and work in one window.",
  "Reply to one overdue message today.",
  "Leave 10 minutes between meetings when you can.",
  "Define 'done' for each task before you start—stops scope creep.",
  "Do the one thing that makes everything else easier or unnecessary.",
  "Say no to one request today that doesn't align with your priorities.",
  "Write tomorrow's top 3 tasks before you leave today.",
  "Use a single to-do list and work from the top; avoid list sprawl.",
  "Pause 10 seconds before replying to non-urgent messages.",
]

export const ONE_THING_TODAY: string[] = [
  "What's the one thing that would make today a win?",
  "If you could only do one thing today, what would it be?",
  "What's the single most important task for today?",
  "What one task would remove the most stress if done first?",
  "What's the one thing only you can do today?",
  "Which one outcome would make today feel successful?",
  "What's the one call or email you've been putting off?",
  "What one decision would unblock everything else?",
  "What's the one thing your future self will thank you for?",
  "If today had one win, what would it be?",
  "What's the one task that would make tomorrow easier?",
  "What one thing deserves your full focus today?",
  "What's the single action that would move your goal forward?",
  "Which one thing would you do if you had no fear?",
  "What's the one deliverable that matters most today?",
  "What one conversation do you need to have today?",
  "What's the one item on your list that has the biggest impact?",
  "If you could only finish one thing, what would it be?",
  "What's the one thing that would make you proud tonight?",
  "What one step would get you closer to your goal?",
  "What's the one task you've been avoiding?",
  "What one thing would simplify your week if done today?",
  "What's the single most valuable use of your next hour?",
  "What one commitment would you make to yourself today?",
  "What's the one thing that would make today meaningful?",
]
