import type { Story } from '../App';

export const MOCK_STORIES: Story[] = [
  {
    id: '1',
    title: 'The Day I Became a Teacher',
    transcript: `I remember it was a beautiful summer day in 1965. I was just 23 years old, and I had just started my first teaching job at the elementary school in my hometown. The children were so eager to learn, and I felt this overwhelming sense of purpose.

My mother had always told me that teaching was a noble profession, and standing there in that classroom, I finally understood what she meant. The smell of chalk dust, the sound of children's laughter - these became the soundtrack of my life for the next 40 years.

One student in particular, little Anna, reminded me why I chose this path. She struggled with reading at first, but with patience and encouragement, she blossomed. Years later, she became a teacher herself and told me I had inspired her. That moment made everything worthwhile.

I wouldn't trade those memories for anything in the world. Teaching wasn't just my job; it was my calling, my passion, my life's greatest adventure.`,
    ageRange: '78',
    city: 'Helsinki',
    tags: ['Work', 'Wisdom'],
    isAnonymous: true,
    reactions: { moved: 142, thankYou: 89, favorite: 56 },
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Meeting My Beloved',
    transcript: `It was at a dance hall in the old town. The music was playing, and everyone was dressed in their finest clothes. I was nervous - it was my first time at such an event.

Then I saw him across the room. He had the kindest eyes I'd ever seen. When he asked me to dance, my heart skipped a beat. We talked all night about everything and nothing.

That was 50 years ago, and we're still dancing together. He's the love of my life, my best friend, my everything.`,
    ageRange: '72',
    city: 'Stockholm',
    tags: ['Love', 'Childhood'],
    isAnonymous: true,
    reactions: { moved: 234, thankYou: 145, favorite: 98 },
    createdAt: new Date('2024-01-20')
  },
  {
    id: '3',
    title: 'Journey to a New Land',
    transcript: `Leaving everything behind was the hardest decision of my life. I packed a single suitcase with my most precious belongings - a photo of my mother, my father's watch, and a worn book of poems.

The ship journey took three weeks. I was sick most of the time, but the hope of a new beginning kept me going. When I first saw the coastline of my new home, I cried tears of both sadness and joy.

The first years were difficult. The language was strange, the customs unfamiliar. But I worked hard, learned quickly, and eventually built a life I'm proud of. Now, 60 years later, this land is my home, though a part of my heart will always belong to the place I left behind.`,
    ageRange: '85',
    city: 'Toronto',
    tags: ['Migration', 'Family'],
    isAnonymous: true,
    reactions: { moved: 189, thankYou: 156, favorite: 78 },
    createdAt: new Date('2024-02-01')
  },
  {
    id: '4',
    title: 'My First Bicycle',
    transcript: `I must have been seven or eight years old. My father brought home this shiny red bicycle, and my heart nearly burst with joy. It was the most beautiful thing I had ever seen.

He taught me to ride in the park every evening after work. I fell so many times, scraped my knees, but I never gave up. The day I finally rode without his hand on the seat, I felt like I was flying.

That bicycle represented freedom to me. I rode it everywhere - to school, to my friends' houses, to the corner store. It was my most prized possession for years. Sometimes I still dream about that feeling of the wind in my hair as I pedaled down the hill.`,
    ageRange: '69',
    city: 'Oslo',
    tags: ['Childhood', 'Family'],
    isAnonymous: true,
    reactions: { moved: 167, thankYou: 98, favorite: 92 },
    createdAt: new Date('2024-02-10')
  },
  {
    id: '5',
    title: 'Building Our Dream Home',
    transcript: `We saved for twenty years to buy that little plot of land. Every brick, every nail, we put in ourselves with our own hands. My husband would work his day job, then come home and build until dark.

I remember mixing cement while heavily pregnant with our second child. Our neighbors thought we were crazy, but we had a vision. We wanted to create a home filled with love, where our children and grandchildren would gather.

It took us five years to finish, but when we finally moved in, it was perfect. Not because it was fancy - it wasn't - but because every corner held our sweat, our dreams, our love. That house has seen three generations now, and the walls still echo with laughter.`,
    ageRange: '81',
    city: 'Copenhagen',
    tags: ['Family', 'Work'],
    isAnonymous: true,
    reactions: { moved: 198, thankYou: 134, favorite: 87 },
    createdAt: new Date('2024-02-15')
  }
];

export const MY_STORIES: Story[] = [
  {
    id: '101',
    title: 'Saturdays at the Market',
    transcript:
      `Every Saturday for thirty years I opened my small flower stall before sunrise. The regulars would wander over with their coffee and I would tuck a sprig of lavender into their bags. When my granddaughter was born she would nap behind the counter while I arranged peonies. Those mornings taught me how community is stitched together—one small kindness at a time.`,
    ageRange: '76',
    city: 'Lisbon',
    tags: ['Work', 'Family'],
    isAnonymous: false,
    reactions: { moved: 42, thankYou: 28, favorite: 18 },
    createdAt: new Date('2024-02-20'),
    audioUrl: undefined,
    shareToken: 'markets-101'
  },
  {
    id: '102',
    title: 'Letters Across the Ocean',
    transcript:
      `My brother left for Canada in 1954 and for years our only connection was handwritten letters. I kept them all in a biscuit tin. When phones finally became affordable, we still wrote because ink captured the tiny details. Last autumn I finally visited him and we opened that tin together. We laughed, we cried, and felt like no time had passed at all.`,
    ageRange: '82',
    city: 'Naples',
    tags: ['Family', 'Migration'],
    isAnonymous: true,
    reactions: { moved: 67, thankYou: 41, favorite: 23 },
    createdAt: new Date('2024-03-02'),
    audioUrl: undefined,
    shareToken: 'letters-102'
  }
];
