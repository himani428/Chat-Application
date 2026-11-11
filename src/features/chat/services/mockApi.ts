import { ME, type ChatData, type Message, type User } from '../types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const user = (id: string, name: string, img: number, online: boolean): User => ({
  id, name, online, avatar: `https://i.pravatar.cc/120?img=${img}`,
});

type Line = [sender: string, text: string, minutesAgo: number];

export function buildSeed(now = Date.now()): ChatData {
  const list = [
    user(ME, 'You', 12, true), user('u1', 'Himani Soni', 47, true), user('u2', 'Aman Verma', 33, true),
    user('u3', 'Mahima Gupta', 45, false), user('u4', 'Rohan Mehta', 15, true), user('u5', 'Priya Nair', 44, false),
    user('u6', 'Karan Malhotra', 52, true), user('u7', 'Ananya Iyer', 49, false), user('u8', 'Vikram Singh', 59, true),
  ];
  const users = Object.fromEntries(list.map((u) => [u.id, u]));

  const threads: Record<string, Line[]> = {
    d1: [
      ['me', 'Did the contrast fixes make it into the build?', 1500],
      ['u1', 'Yes, merged this morning. Blue and cream everywhere now.', 1490],
      ['me', 'Perfect. Can you check the focus rings on the settings page?', 1480],
      ['u1', 'On it. Also, lunch Thursday?', 40],
      ['u1', 'There is a new chai place near the office.', 38],
    ],
    d2: [
      ['u2', 'Pushed the typing indicator hook, review when you can.', 300],
      ['me', 'Looking now. Does it clean up its timers on unmount?', 290],
      ['u2', 'It does. Added a test for it too.', 285],
      ['me', 'Great, approving.', 280],
    ],
    d3: [
      ['me', 'Mahima, are the new icons exported?', 2900],
      ['u3', 'Exported as SVG, stroke width 1.5.', 2880],
      ['u3', 'Sent them to the shared folder.', 120],
    ],
    d4: [
      ['u5', 'Can you send the onboarding copy?', 4400],
      ['me', 'Sending it over tonight.', 4390],
      ['u5', 'No rush.', 4380],
    ],
    g1: [
      ['u1', 'Crit starts at 3. Bring one thing you are unsure about.', 2000],
      ['u3', 'Mine is the empty state on the inbox.', 1990],
      ['u5', 'Mine is the spacing scale. Too many steps.', 1985],
      ['me', 'I will bring the sidebar density question.', 1970],
      ['u7', 'Notes doc is pinned.', 1960],
    ],
    g2: [
      ['u4', 'Release branch is cut.', 200],
      ['u6', 'QA signed off on mobile.', 150],
      ['me', 'Great. Anything blocking?', 140],
      ['u8', 'Only the changelog.', 60],
      ['u2', 'I will write it after standup.', 55],
      ['u4', 'Ship at 5? Chai on me.', 20],
    ],
    g3: [
      ['u7', 'Saturday forecast looks clear for Triund.', 6000],
      ['u4', 'I can drive, room for three.', 5990],
      ['me', 'Count me in.', 5980],
    ],
  };
  const unread: Record<string, number> = { d1: 2, d3: 1, g2: 3 };
  const meta: Array<[string, 'direct' | 'group', string, string[]]> = [
    ['d1', 'direct', 'Himani Soni', [ME, 'u1']], ['d2', 'direct', 'Aman Verma', [ME, 'u2']],
    ['d3', 'direct', 'Mahima Gupta', [ME, 'u3']], ['d4', 'direct', 'Priya Nair', [ME, 'u5']],
    ['g1', 'group', 'Design Crit', [ME, 'u1', 'u3', 'u5', 'u7']],
    ['g2', 'group', 'Launch Crew', [ME, 'u2', 'u4', 'u6', 'u8']],
    ['g3', 'group', 'Weekend Hikers', [ME, 'u4', 'u7']],
  ];

  const messages: Record<string, Message[]> = {};
  for (const [cid, lines] of Object.entries(threads)) {
    messages[cid] = lines.map(([senderId, text, m], i) => ({
      id: `${cid}-${i}`, conversationId: cid, senderId, text,
      createdAt: now - m * 6e4, status: 'read', reactions: {},
    }));
  }
  messages.d2[2].replyToId = 'd2-1';
  messages.g1[1].reactions = { '👍': ['u1', 'u5'] };

  const conversations = meta.map(([id, type, name, memberIds]) => ({
    id, type, name, memberIds, unread: unread[id] ?? 0,
    lastMessageAt: messages[id].at(-1)!.createdAt,
  }));
  return { users, conversations, messages };
}

/** Mock network call. Append `?fail` to the URL to preview the error state. */
export async function fetchChatData(): Promise<ChatData> {
  await wait(700);
  if (new URLSearchParams(window.location.search).has('fail')) {
    throw new Error('Could not reach the message service.');
  }
  return buildSeed();
}

export const REPLIES = [
  'Got it.', 'Makes sense.', 'Sounds good to me.', 'Noted, I will get back to you on this.',
];
const RULES: Array<[RegExp, string[]]> = [
  [/\b(how are you|kaise ho|how r u|how's it going)\b/i, ['Doing well, thanks! You?', 'All good, bas kaam chal raha hai. You?']],
  [/\b(hi+|hello|hey+|namaste)\b/i, ['Hey! Kaise ho?', 'Hi! What is up?', 'Hello! All good here.']],
  [/\b(question|doubt)\b|can i ask|ask you/i, ['Sure, go ahead.', 'Of course, ask away.']],
  [/\b(thanks|thank you|thx)\b/i, ['Anytime!', 'No problem at all.']],
  [/\b(lunch|dinner|food|chai|coffee|eat|snacks)\b/i, ['Sounds good, what time?', 'Count me in! Where should we go?']],
  [/\b(meet|call|tomorrow|tonight|schedule|meeting)\b/i, ['Works for me. What time?', 'Sure, send me an invite.']],
  [/\b(bye|good night|see you|ttyl)\b/i, ['Bye! Talk soon.', 'Good night!']],
  [/\b(ok|okay|done|great|cool|nice|perfect)\b/i, ['Great!', 'Perfect.']],
  [/\?\s*$/, ['Good question, let me check and get back to you.', 'I think yes, let me confirm.']],
];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Picks a reply that fits what was actually said, falling back to a neutral acknowledgement. */
export function generateReply(text: string): string {
  const rule = RULES.find(([re]) => re.test(text));
  return pick(rule ? rule[1] : REPLIES);
}
export const INCOMING = [
  'Quick question when you have a second.', 'Just pushed an update.', 'Did you see the latest thread?',
  'Reminder: sync at 4.', 'Nice work on that, by the way.',
];
