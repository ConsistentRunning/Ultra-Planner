
import { GpxData, GpxPoint, Profile, ChartDataPoint, Terrain, SupportNote } from './types';

export const SEGMENT_LENGTH_M = 25;

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export const fmtTime = (s: number) => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v, i) => (i === 0 ? String(v) : String(v).padStart(2, '0'))).join(':');
};

export const formatMinutes = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let str = '';
    if (h > 0) str += `${h}h`;
    if (m > 0) str += ` ${m}m`;
    return str.trim();
};

export const getFatigueReset = (minutes: number): number => {
    minutes = minutes || 0;
    if (minutes <= 0) return 0;
    if (minutes <= 30) return (minutes / 30) * 0.20; // 0-20%
    if (minutes <= 90) return 0.20 + ((minutes - 30) / 60) * 0.30; // 20-50%
    if (minutes <= 180) return 0.50 + ((minutes - 90) / 90) * 0.30; // 50-80%
    if (minutes < 270) return 0.80 + ((minutes - 180) / 90) * 0.15; // 80-95%
    return 0.95;
};

export const getMuscularFatigueReset = (minutes: number): number => {
    minutes = minutes || 0;
    if (minutes <= 0) return 0;
    if (minutes <= 30) return (minutes / 30) * 0.05; // 0-5%
    if (minutes <= 60) return 0.05 + ((minutes - 30) / 30) * 0.05; // 5-10%
    if (minutes <= 90) return 0.10 + ((minutes - 60) / 30) * 0.10; // 10-20%
    if (minutes <= 180) return 0.20 + ((minutes - 90) / 90) * 0.10; // 20-30%
    return 0.30;
};

export const haversine = (a: { lat: number, lon: number }, b: { lat: number, lon: number }): number => {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const dφ = toRad(b.lat - a.lat), dλ = toRad(b.lon - a.lon);
  const s = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

export const parseGPX = (text: string): GpxData | null => {
  try {
    const xml = new DOMParser().parseFromString(text, "text/xml");
    const pts: Omit<GpxPoint, 'cum'>[] = Array.from(xml.querySelectorAll("trkpt")).map(pt => ({
      lat: +pt.getAttribute("lat")!,
      lon: +pt.getAttribute("lon")!,
      ele: +(pt.querySelector("ele")?.textContent || 0),
      time: pt.querySelector("time")?.textContent || undefined
    }));

    if (pts.length < 2) return null;

    let dist = 0, gain = 0, loss = 0;
    const finalPts: GpxPoint[] = [{ ...pts[0], cum: 0 }];

    for (let i = 1; i < pts.length; i++) {
        const d = haversine(pts[i - 1], pts[i]);
        dist += d;
        const dEle = pts[i].ele - pts[i - 1].ele;
        if (dEle > 0) gain += dEle;
        else loss -= dEle;
        finalPts.push({ ...pts[i], cum: dist });
    }

    return { pts: finalPts, dist_m: dist, gain_m: gain, loss_m: loss };
  } catch (e) {
    console.error("Error parsing GPX file", e);
    return null;
  }
};

export const getElevationAtDistanceM = (distM: number, pts: GpxPoint[]): number => {
    if (pts.length === 0) return 0;
    const p2 = pts.find(p => p.cum >= distM);
    if (!p2) return pts[pts.length - 1].ele;
    const p1 = pts[pts.lastIndexOf(p2) - 1];
    if (!p1) return p2.ele;
    const ratio = (distM - p1.cum) / (p2.cum - p1.cum);
    return p1.ele + (p2.ele - p1.ele) * ratio;
};

export const getElevationAtKm = (km: number, segments: ChartDataPoint[]) => {
    const distM = km * 1000;
    const segmentLength = segments[1]?.km * 1000 - segments[0]?.km * 1000;
    if (!segmentLength || segmentLength <= 0) return segments[0]?.elevation || 0;
    const index = Math.floor(distM / segmentLength);
    const p1 = segments[index];
    const p2 = segments[index + 1];
    if (!p1) return segments[0]?.elevation || 0;
    if (!p2) return p1.elevation;
    const ratio = (km - p1.km) / (p2.km - p1.km);
    return p1.elevation + (p2.elevation - p1.elevation) * ratio;
};

export const getTerrainFactor = (terrain: Terrain, profile: Profile): number => {
    switch (terrain) {
        case "road": return profile.tRoad;
        case "smooth": return profile.tSmooth;
        case "mixed": return profile.tMixed;
        case "technical": return profile.tTech;
        case "sandy": return profile.tSand;
        case "slow": return profile.tSlow;
        default: return 1.0;
    }
};

export const getWeatherFactor = (tempC: number, humPct: number, sun: string, heatAcclimation: number): number => {
    let factor = 1.0;
    if (tempC > 15) factor += ((tempC - 15) / 10) * 0.05; // 5% penalty per 10C over 15
    if (humPct > 60) factor += ((humPct - 60) / 10) * 0.01; // 1% penalty per 10% hum over 60
    if (sun === "Sunny") factor += 0.02;
    if (sun === "Overcast") factor -= 0.01;

    const heatPenalty = (factor - 1.0);
    const adjustedPenalty = heatPenalty / heatAcclimation;
    return 1.0 + adjustedPenalty;
};

export const getNightFactor = (nightConf: 'High' | 'Medium' | 'Low'): number => {
    if (nightConf === 'High') return 1.0;
    if (nightConf === 'Medium') return 1.05;
    return 1.10;
};

export const terrainColors: { [key in Terrain]: string } = {
    road: '#4ade80', // green-400
    smooth: '#60a5fa', // blue-400
    mixed: '#fb923c', // orange-400
    technical: '#f87171', // red-400
    sandy: '#facc15', // yellow-400
    slow: '#78716c', // stone-500
};

export const presets: { [key: string]: Profile } = {
  allrounder: { heat: 1.0, fadePer10k: 1.0, nightConf: 'Medium', upCostPct: 2.8, downBenefitPct: 1.0, downPenaltyPct: 1.2, tRoad: 1.0, tSmooth: 1.0, tMixed: 1.05, tTech: 1.15, tSand: 1.20, tSlow: 1.25, hike: true, hikeThr: 15, vam: 800, poles: true, packKg: 2, muscularResilience: 0.003, hikingEconomyFactor: 0.085 },
  mountain: { heat: 1.0, fadePer10k: 1.2, nightConf: 'High', upCostPct: 2.5, downBenefitPct: 1.2, downPenaltyPct: 1.0, tRoad: 1.02, tSmooth: 1.0, tMixed: 1.05, tTech: 1.12, tSand: 1.25, tSlow: 1.30, hike: true, hikeThr: 12, vam: 1000, poles: true, packKg: 3, muscularResilience: 0.0015, hikingEconomyFactor: 0.085 },
  endurance: { heat: 1.0, fadePer10k: 0.8, nightConf: 'Medium', upCostPct: 2.8, downBenefitPct: 1.0, downPenaltyPct: 1.4, tRoad: 1.0, tSmooth: 1.0, tMixed: 1.05, tTech: 1.20, tSand: 1.20, tSlow: 1.25, hike: true, hikeThr: 18, vam: 700, poles: false, packKg: 1, muscularResilience: 0.004, hikingEconomyFactor: 0.085 },
  beginner: { heat: 0.9, fadePer10k: 1.5, nightConf: 'Low', upCostPct: 3.5, downBenefitPct: 0.8, downPenaltyPct: 1.8, tRoad: 1.0, tSmooth: 1.02, tMixed: 1.10, tTech: 1.25, tSand: 1.30, tSlow: 1.35, hike: true, hikeThr: 10, vam: 600, poles: false, packKg: 4, muscularResilience: 0.005, hikingEconomyFactor: 0.085 },
  undertrained: { heat: 0.85, fadePer10k: 2.5, nightConf: 'Low', upCostPct: 4.0, downBenefitPct: 0.7, downPenaltyPct: 2.5, tRoad: 1.0, tSmooth: 1.03, tMixed: 1.12, tTech: 1.30, tSand: 1.35, tSlow: 1.40, hike: true, hikeThr: 8, vam: 550, poles: false, packKg: 4, muscularResilience: 0.008, hikingEconomyFactor: 0.085 },
  crammer: { heat: 1.05, fadePer10k: 0.9, nightConf: 'Medium', upCostPct: 3.2, downBenefitPct: 0.8, downPenaltyPct: 2.8, tRoad: 1.0, tSmooth: 1.0, tMixed: 1.10, tTech: 1.28, tSand: 1.30, tSlow: 1.30, hike: true, hikeThr: 16, vam: 650, poles: false, packKg: 2, muscularResilience: 0.009, hikingEconomyFactor: 0.085 },
};

export const whyRows: [string, string, string][] = [
    ['Heat Acclimation', '1.0', 'Reduces the penalty from heat/humidity. >1.0 for well-acclimated, <1.0 for poorly-acclimated. A value of 1.2 means you are 20% better at handling heat than the average.'],
    ['Base Metabolic Fade % / 10k', '1.0%', 'The BASE rate your pace slows from metabolic fatigue, applied per 10,000 "effort-seconds". This rate is amplified by your accumulated muscular damage.'],
    ['Muscular Resilience', '0.003', 'How sensitive you are to muscular damage from downhills. A lower value means you are more resilient (e.g., an elite mountain runner). This multiplies your damage score to determine your effective fatigue rate.'],
    ['Night Confidence', 'Medium', 'Penalty applied during night hours to account for navigation and visibility challenges. High=0%, Medium=5%, Low=10%.'],
    ['Uphill Cost %', '2.8%', 'Pace penalty per 1% of positive grade. A value of 2.8 means for every 1% of incline, your effort increases by 2.8%.'],
    ['Down Benefit %', '1.0%', 'Pace bonus per 1% of negative grade on runnable downhills (up to -3%). Higher values for confident descenders.'],
    ['Down Penalty %', '1.2%', 'Pace penalty per 1% of negative grade on steep downhills (< -3%), where braking forces increase effort.'],
    ['Terrain Multipliers', 'tTech: 1.15', 'A direct multiplier on your pace for a given surface. 1.15 means you are 15% slower on technical terrain than you would be on a smooth trail.'],
    ['Terrain - Slow Going', 'tSlow: 1.25', 'Pace multiplier for overgrown or boggy sections that force a slower pace but do not increase cardiovascular effort. This penalty does NOT contribute to metabolic fatigue accumulation. Pro Tip: You can also use this to model strategic walk breaks on flat ground by fine-tuning a leg and adding short \'Slow Going\' segments.'],
    ['Power-hike VAM', '800 m/h', 'Your Vertical Ascent in Meters per hour when hiking. If enabled, the model uses this on climbs steeper than your threshold.'],
    ['Hiking Economy Bonus', '8.5%', 'The percentage of metabolic effort saved when hiking a steep climb versus running it. This directly reduces metabolic fatigue accumulation.'],
];

export const MENTAL_NOTES = {
  start: [
    "W.I.N. = What's Important Now?",
    "Run your own race. Let them go.",
    "This pace should feel 'too easy'.",
    "Bank patience, not time.",
    "Checklist: Drink. Eat. Smile."
  ],
  longGrind: [
    "Run the mile you're in.",
    "Hills are your friend. Hike with purpose.",
    "Fly down, don't fall down. Quick feet.",
    "Calories are currency. Pay yourself every 30 minutes.",
    "Smooth is fast. Fast is smooth."
  ],
  hot: [
    "Ice is your friend. Hat, bandana, wrists.",
    "Sip, don't gulp. Keep the fluids coming in.",
    "Run by effort, not pace. The heat is a hill.",
    "Salt! Are you replacing what you're sweating out?",
    "Stay cool, stay calm. This will pass."
  ],
  night: [
    "See the light. Be the light.",
    "Sunrise is coming. Run to the light.",
    "System Check: Eat? Drink? Warm?",
    "Focus on the next 20 minutes.",
    "Forward is a pace."
  ],
  painCave: [
    "This is what you came for.",
    "Dedicate this mile.",
    "You GET to do this.",
    "Be a goldfish.",
    "It never always gets worse."
  ],
  finalPush: [
    "One checkpoint at a time.",
    "Empty the tank.",
    "Pass one person.",
    "Finish with nothing left.",
    "Stronger with every step."
  ]
};

export interface HelperModule {
    name: string;
    description: string;
    notes: readonly string[];
    crewDo?: readonly string[];
    crewSay?: readonly string[];
    pacerDo?: readonly string[];
    pacerSay?: readonly string[];
}
export type HelperModuleKey = keyof typeof HELPER_NOTE_MODULES;

export const HELPER_NOTE_MODULES: { [key in 'pacingPro' | 'fuelingGuardian' | 'painResilienceCoach' | 'trailTechnician' | 'focusMaster' | 'aidStationNinja']: HelperModule } = {
  pacingPro: {
    name: 'The Pacing Pro',
    description: "For the athlete who struggles with a fast start, maintaining consistent effort, or gets caught up in the excitement.",
    notes: [
      "This should feel 'too easy'.",
      "You can't win it in the first half, but you can lose it.",
      "Run your own race. Let them go.",
      "Bank patience, not time.",
      "Smooth and steady wins the ultra.",
      "Heart rate is your governor. Keep it in the all-day zone.",
      "Adrenaline is lying to you right now. Stick to the plan.",
      "Conserve now, conquer later.",
      "Run the pace you can hold, not the pace you want to show.",
      "Every minute you go too fast now will cost you ten later.",
      "Easy on the descents. Save the quads.",
      "Is your breathing conversational? It should be.",
      "The most successful runners slow down the least.",
      "Patience is a virtue. And a strategy.",
      "Respect the distance.",
      "Don't be a hero in the first hour.",
      "Run with your head for the first third of the race.",
      "Stay relaxed. A tight body wastes energy.",
      "Effort over pace. Always.",
      "It's a long day. Settle in.",
      "The heat will dictate the pace. Listen to it.",
      "Don't try to 'beat the heat' by starting fast."
    ],
    crewDo: ["Remind them this pace is perfect.", "Discourage any surges."],
    crewSay: ["'You look smooth. Keep this effort level.'"],
    pacerDo: ["Keep the pace conversational.", "Hold them back on downhills."],
    pacerSay: ["'Easy does it. Let's save those legs.'"],
  },
  fuelingGuardian: {
    name: 'The Fueling Guardian',
    description: "For the athlete prone to nausea, stomach issues, or who forgets to eat and drink consistently, especially when fatigued.",
    notes: [
      "Most problems can be solved by eating.",
      "A steady drip prevents the crash. Sip and nibble.",
      "Your brain needs glucose to make good decisions. Feed it.",
      "250 calories per hour. Are you on schedule?",
      "Stomach turning? Slow down. Let blood return to your gut.",
      "Sick of sweet? Time for salt.",
      "Hydration is cooling. Drink to stay cool.",
      "Eat before you're hungry, drink before you're thirsty.",
      "Check your urine color at the next stop. Is it light straw?",
      "Salt is not optional. Take an electrolyte cap now.",
      "Don't let a low mood fool you. It's probably low blood sugar.",
      "Is it time for real food? Broth, potatoes, pretzels.",
      "Chew your food. Digestion starts in the mouth.",
      "Feeling nauseous? Try ginger chews or a Tums.",
      "Don't mix new foods at an aid station. Stick to the plan.",
      "Liquid calories are your friend when you can't chew.",
      "Caffeine is a tool. Use it strategically, not constantly.",
      "A full bottle is a heavy mistake. A half-empty one is worse.",
      "Your gut is a muscle. You trained it for this.",
      "No calories, no power. It's that simple.",
      "Wake up and fuel up. Restock the engine.",
      "Cool fluids, cool core."
    ],
    crewDo: ["Have multiple food options ready.", "Ask about stomach issues."],
    crewSay: ["'What sounds good? Sweet or salty?'"],
    pacerDo: ["Set a 30-min timer for fuel.", "Carry an extra gel for them."],
    pacerSay: ["'Time to eat. Let's stay on schedule.'"],
  },
  painResilienceCoach: {
    name: 'The Pain & Resilience Coach',
    description: "For the athlete who struggles with the mental aspect of pain, gets caught in negative thought loops, and needs help reframing discomfort.",
    notes: [
      "This is what you came for.",
      "Pain is temporary. Quitting lasts forever.",
      "You GET to do this. This is a privilege.",
      "It never always gets worse.",
      "Acknowledge the pain, don't argue with it. It's just information.",
      "You've been through worse. Remember [user-inputted challenge].",
      "How will you feel tomorrow if you quit now?",
      "Be a goldfish. Forget the last bad moment.",
      "This is hard, and you do hard things.",
      "Your mind will quit a thousand times before your body will.",
      "Reframe it: This pain is progress.",
      "Dedicate this mile to someone you love.",
      "You are tougher than you think.",
      "This too shall pass.",
      "Embrace the suck.",
      "You are strong. You are capable. You belong here.",
      "The body achieves what the mind believes.",
      "You are not almost there. Be here now.",
      "Just focus on your breath. In strength, out weakness.",
      "You are an articulate super unicorn."
    ],
    crewDo: ["Acknowledge their pain, don't try to fix it.", "Project calm confidence."],
    crewSay: ["'This is the hard part. You are strong enough.'"],
    pacerDo: ["Remind them of their 'why'.", "Break the next section into a tiny goal."],
    pacerSay: ["'I know it hurts. Let's just get to that tree.'"],
  },
  trailTechnician: {
    name: 'The Trail Technician',
    description: "For the athlete who loses time or confidence on technical terrain like rocky descents, root-filled singletrack, or mud.",
    notes: [
      "Quick feet, light steps.",
      "Scan ahead, not at your feet. Let your brain map the path.",
      "Flow, don't fight the trail.",
      "Use your arms like rudders for balance.",
      "Shorten your stride on the downhills.",
      "Hike with purpose. Hands on knees, drive up.",
      "Lean into the hill. Mimic the grade.",
      "Lift your feet. Don't shuffle.",
      "Stay loose. A stiff body can't react.",
      "Every uphill has a downhill.",
      "Control the descent. Don't let gravity win.",
      "Soft knees, no heel striking.",
      "Power, not pace, on the climbs.",
      "Trust your feet. You've trained for this.",
      "Center your gravity. Core tight.",
      "On mud or snow, focus on traction.",
      "Pick your line like a skier.",
      "Breathe. A calm mind sees the best path.",
      "This hill picked the wrong runner.",
      "Embrace the climb. It's where you get strong."
    ],
    crewDo: ["Ask if they need to clean mud from their shoes.", "Have a spare pair of socks ready, just in case.", "Check their pole tips if they're using them."],
    crewSay: ["'The next section is technical, take your time and be smooth.'", "'You looked strong on that last descent, keep that focus.'", "'Big climb coming up, good chance to use poles and eat.'"],
    pacerDo: ["Lead on technical descents at night.", "Point out the best line.", "Remind them to use their poles if they have them."],
    pacerSay: ["'Stay right behind me. Quick feet here.'", "'Use your arms for balance, let's flow through this.'"],
  },
  focusMaster: {
      name: 'The Focus Master',
      description: "For the athlete whose mind wanders into negative territory or gets overwhelmed by the sheer distance remaining.",
      notes: [
        "Run the mile you're in.",
        "Be where your feet are.",
        "Control the controllables.",
        "Just make it to that next tree/rock/bend.",
        "Engage your senses: 3 things you see, 2 you hear, 1 you feel.",
        "Plan your next aid station in detail.",
        "Remember your 'why'. Say it out loud.",
        "Smile. It's a proven performance enhancer.",
        "Listen to your music/podcast. Distraction is a tool.",
        "This is a moving meditation.",
        "Breathe in strength, breathe out weakness.",
        "What do I need to do right now to perform my best?",
        "Mood follows action. Just keep moving.",
        "One step at a time.",
        "You belong here. You've earned this.",
        "Trust your training.",
        "Focus on your form: Head up, shoulders back, arms pumping.",
        "Gratitude check: What are you thankful for right now?",
        "Stop calculating. Just run.",
        "You can struggle and keep moving."
      ],
      crewDo: ["Give one simple instruction at a time.", "Limit questions."],
      crewSay: ["'Just focus on drinking this. Good. Now eat.'"],
      pacerDo: ["Keep chatter to a minimum if they're focused.", "Engage them with a story if they're spiraling."],
      pacerSay: ["'Just run this mile. Nothing else matters.'"],
  },
  aidStationNinja: {
      name: 'The Aid Station Ninja',
      description: "For the athlete who loses critical time in aid stations by being distracted, sitting too long, or forgetting crucial tasks.",
      notes: [
        "What are your 3 must-do tasks here?",
        "Get in, get out. Don't sit down.",
        "Eat and drink while you walk out of the aid station.",
        "Final check: Salt? Lube? Batteries? Trash out?",
        "Thank a volunteer. It will boost your mood.",
        "The chair is lava. Avoid it.",
        "You're a shark. Sharks have to keep moving.",
        "Refill bottles first, always.",
        "Grab your pre-packed nutrition bag and go.",
        "Solve problems while moving. Tell your crew what you need as you approach.",
        "Hot day? Ice in everything: hat, bandana, sleeves.",
        "Night coming? Check your headlamp and grab your backup NOW.",
        "Feet feeling rough? Lube and a quick sock change. 3 minutes max.",
        "Don't linger. Every minute stopped is a minute you have to make up.",
        "Communicate clearly with your crew. They can't read your mind."
      ],
      crewDo: ["Have everything out of the bags, ready to grab.", "Take their trash immediately."],
      crewSay: ["'We're a pit crew. In and out in 3 minutes.'"],
      pacerDo: ["Get the plan before you arrive.", "Help them execute the plan without delay."],
      pacerSay: ["'Okay, we need water and gels. Nothing else. Let's go.'"],
  }
};


export const getRandomNote = (notes: readonly string[], exclude: string[] = []): string => {
    const availableNotes = notes.filter(n => !exclude.includes(n));
    if (availableNotes.length === 0) return notes[Math.floor(Math.random() * notes.length)]; // fallback
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
};

export const getRandomSupportNote = (notes: SupportNote[], exclude: string[] = []): SupportNote | null => {
    const availableNotes = notes.filter(n => !exclude.includes(n.do));
    if (availableNotes.length === 0) {
        return notes.length > 0 ? notes[Math.floor(Math.random() * notes.length)] : null;
    }
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
}

export const replaceRandomNote = (notes: string[], newNote: string): string[] => {
    if (notes.includes(newNote)) return notes; // Don't add duplicates
    const notesCopy = [...notes];
    if (notesCopy.length === 0) return [newNote];
    const indexToReplace = Math.floor(Math.random() * notesCopy.length);
    notesCopy[indexToReplace] = newNote;
    return notesCopy;
};

// --- Profile Slider Descriptors ---
export const getFadeDescriptor = (val: number) => {
    if (val < 0.6) return "Relentless";
    if (val < 0.9) return "Very Durable";
    if (val < 1.1) return "Average";
    if (val < 1.5) return "Fades Quickly";
    return "Hits the Wall";
};

export const getResilienceDescriptor = (val: number) => {
    if (val < 0.0015) return "Iron Quads (Elite)";
    if (val < 0.003) return "Durable (Well-Trained)";
    if (val < 0.005) return "Average";
    if (val < 0.008) return "Sensitive";
    return "Glass Cannons";
};

export const getUphillDescriptor = (val: number) => {
    if (val < 2.2) return "Mountain Goat";
    if (val < 2.8) return "Strong Climber";
    if (val < 3.4) return "Average";
    if (val < 4.2) return "Needs Practice";
    return "Road Runner";
};

export const getDownhillBenefitDescriptor = (val: number) => {
    if (val < 0.5) return "Cautious";
    if (val < 1.0) return "Controlled";
    if (val < 1.5) return "Confident";
    return "Flies Downhill";
};

export const getDownhillPenaltyDescriptor = (val: number) => {
    if (val < 1.0) return "Efficient Braking";
    if (val < 1.5) return "Average";
    if (val < 2.2) return "Heavy Braking";
    return "Uncontrolled";
};

export const getVamDescriptor = (val: number) => {
    if (val < 600) return "Strolling";
    if (val < 800) return "Steady Hike";
    if (val < 1100) return "Strong Hiker";
    return "Elite Power-Hiker";
};

export const getHeatDescriptor = (val: number) => {
    if (val < 0.9) return "Struggles in Heat";
    if (val < 1.1) return "Average";
    if (val < 1.3) return "Well-Acclimated";
    return "Desert Runner";
};

// --- Crew & Pacer Notes ---

export const COMPREHENSIVE_CREW_NOTES = {
    general: [
        { do: "Have a trash bag open and ready. Take all of your runner's trash the moment they arrive.", say: "Give me all your trash. Let's get you cleaned up and ready for the next leg." },
        { do: "Have a comfortable chair ready, but use it strategically.", say: "The chair is here if you need it for foot care, but let's try to stay standing to keep the legs from stiffening up." },
        { do: "Check your own energy and hydration levels. A depleted crew can't help a depleted runner.", say: "(To other crew) \"Have you had water in the last hour? Let's make sure we're all staying sharp.\"" },
        { do: "Have the first-aid kit open and visible with blister pads, lube, and tape easily accessible.", say: "Let me know about any hotspots or chafing. We can fix it now before it becomes a real problem." },
        { do: "Ask what they want at the next aid station, not this one. This saves time and helps them think ahead.", say: "Okay, you're all set for this leg. What's one thing you're going to be craving at [Next Location]?" },
        { do: "Be the calm in the storm. Your runner's emotional state may be volatile; your job is to be a steady anchor.", say: "You're in a tough spot, and that's okay. We're here. We've got you. Just breathe." },
        { do: "Have a small, unexpected comfort item ready (a wet wipe for their face, a toothbrush, a favorite candy).", say: "Here, a quick wipe down can feel like a total reset. You'll feel like a new person." },
        { do: "Know the distance, elevation, and terrain of the next leg. Don't guess.", say: "Okay, you've got [X miles] to the next stop with a ton of climbing. It's a grind, but it's exactly what you trained for." },
        { do: "Take a quick photo or short video if the runner is okay with it. They will appreciate it later.", say: "Let's get a quick photo. You're going to want to remember how tough you were in this moment." },
        { do: "Always be honest about distance, but frame it positively.", say: "It's 7 miles to the next aid. Let's break that down. We're just running to that next ridge line you can see." }
    ],
    pacingPro: [
        { do: "Check their split time against the plan. If they are significantly ahead, make the aid station stop calm and deliberate.", say: "You're flying right now, which is great, but we're ahead of schedule. Let's take an extra 30 seconds here to get your heart rate down and make sure you're fueled." },
        { do: "Have them verbalize how they feel using the Rate of Perceived Exertion (RPE) scale (1-10).", say: "On a scale of 1 to 10, what's your effort level right now? It should feel like a 3 or 4." },
        { do: "Remind them of the race plan's core principle.", say: "Remember the plan: run the first half with your head. The real race doesn't start until mile 50. You're doing perfectly." },
        { do: "If they arrive with other runners, gently isolate them from the frantic energy.", say: "Let's focus on our own race here. Let them go. We're running our strategy, not theirs." },
        { do: "Look at their breathing as they come in. If it's labored, make them take a few deep breaths before leaving.", say: "Your breathing is a little high. Let's take three slow, deep breaths together before you head out. Calm and controlled." },
        { do: "Before a long, runnable downhill in the first half, give a specific instruction.", say: "This next section is a long descent. Remember: soft knees, quick feet. Let's save the quads for later." },
        { do: "Frame their conservative pace as a professional strategy.", say: "All the pros are patient through here. You're running a really smart race." }
    ],
    fuelingGuardian: [
        { do: "Have a \"menu\" of 3-4 food options ready, including both sweet and savory.", say: "Your stomach is probably tired of sugar. How about some salted potatoes or warm broth?" },
        { do: "Ask direct, closed-ended questions about their intake.", say: "When was your last gel? Have you taken a salt cap in the last hour?" },
        { do: "If they feel nauseous, have ginger chews, mints, or flat coke ready.", say: "Nausea is normal. Let's try a ginger chew. And slow down for the first 10 minutes out of here to let your stomach settle." },
        { do: "Check their hydration pack/bottles. Are they empty? Still full?", say: "Your bottles are still pretty full. Let's make sure you're sipping every 15 minutes on this next leg, even if you're not thirsty." },
        { do: "Remind them of the link between mood and blood sugar.", say: "I know you're in a low spot, but 90% of the time that's just low blood sugar. Let's get 200 calories in you and I bet you'll feel like a new person in 20 minutes." },
        { do: "Prepare liquid calories if they are struggling to chew.", say: "Don't worry about solid food right now. We'll get your calories in with this recovery drink instead." },
        { do: "Before they leave, hand them a specific piece of food.", say: "Take this with you. In 30 minutes, I want you to eat it. No excuses." }
    ],
    painResilienceCoach: [
        { do: "Be relentlessly positive. Lie if you have to. Your calm and confidence are their lifeline.", say: "You look amazing. Your form is holding up so well. You're moving better than almost anyone else coming through here." },
        { do: "Acknowledge their pain, but immediately pivot to their strength. Don't commiserate.", say: "I know it hurts. This is what mile 70 is supposed to feel like. You are doing this. You are tough enough to handle this." },
        { do: "Remind them of their \"why.\" Connect their current struggle to their deeper motivation.", say: "Remember why you started this. Think about [their 'why']. All that training was for this exact moment. Don't let it go to waste." },
        { do: "Break the race down into tiny, manageable chunks.", say: "Forget the finish line. Your only job is to get to that next ridge. We're just running from this aid station to the next one. That's it." },
        { do: "If they talk about quitting, use a delay tactic.", say: "Okay, I hear you. But you are not allowed to make that decision here. Let's get you warm, get some food in you, and get you out of here. You can quit on the trail, but not in this chair." },
        { do: "Normalize their experience. Let them know they aren't alone in their suffering.", say: "Every single person coming through here is in a world of hurt. This is the part of the race where you earn it. You are handling this better than most." },
        { do: "Use specific, personal encouragement based on what you're seeing.", say: "You are climbing so strong right now." }
    ]
};

export const GENERAL_PACER_NOTES: SupportNote[] = [
    { do: "Constantly assess your runner's vibe. Are they chatty or silent? Match their energy.", say: "You're doing great. Let me know if you want to chat or just run in silence. I'm good with either." },
    { do: "Take over the mental load. Your runner's only job is to move their feet. You handle the math, the time, and the plan.", say: "Don't worry about our pace or the next aid station. I've got all of that. Just focus on this step." },
    { do: "Be a selfless partner. Your focus is entirely on your runner's needs. Be prepared for them to be cold when you're warm, or tired when you're fresh. Your role is to be the steady rock.", say: "I'm right here with you. Whatever you need to do, we'll do it together. Let's keep moving." },
    { do: "Ask about their position preference. Some runners like the pacer in front, others behind. This can change throughout a leg.", say: "Do you want me to lead for a bit, or would you rather I follow? Your call." },
    { do: "Be the designated photographer. Capture a few moments, especially at sunrise or scenic spots. They'll thank you later.", say: "Quick picture here, you look like a warrior. You'll want to remember this." },
    { do: "Manage the music or podcasts if your runner uses them and it's allowed. A timely playlist change can be a huge boost.", say: "Looks like a good spot for some pump-up music. Ready for the power playlist?" },
    { do: "Keep an eye on the time and the next cutoff. Know the buffer you have.", say: "We're looking solid. We have a [X]-minute buffer on the next cutoff. No stress, just steady." },
    { do: "Be prepared to tell stories or anecdotes if they need a distraction.", say: "So, this one time on a training run..." },
    { do: "Check in on small issues before they become big ones.", say: "Any hotspots in your feet? Let's plan to address that at the next aid station." },
    { do: "Be the voice of reason. A fatigued runner's decision-making is impaired.", say: "I know you feel like sprinting, but let's stick to the plan for one more mile. We'll open it up later." }
];

export const PACER_NOTE_MODULES = {
    pacingPro: [
        { do: "Take control of any run/walk intervals. Use your own watch.", say: "Okay, I've got the timer. We're running for four minutes, then walking for one. I'll call it out." },
        { do: "Monitor their breathing. If it becomes labored, enforce a slowdown.", say: "Your breathing is getting a little ragged. Let's pull back to a power hike for a couple of minutes and get it under control." },
        { do: "Be the objective judge of pace. A runner's perceived effort can be misleading.", say: "This pace feels good, but we're creeping a little fast. Let's dial it back just 10%." },
        { do: "Calculate the required pace to the next cutoff and communicate it simply.", say: "We need to average about an 18-minute mile to get to the next aid station with plenty of time. We're right on track." },
        { do: "Remind them that the best racers are the ones who slow down the least.", say: "We're not trying to be the fastest right now, we're trying to be the smartest. The goal is to slow down less than everyone else." },
        { do: "Use heart rate as a governor if they train with it.", say: "Let's check that heart rate. We want to stay in Zone 2 on this climb. Easy effort." },
        { do: "When they feel good, gently hold them back.", say: "I know you feel amazing right now, and that's awesome. Let's bottle this feeling and use it in the last 20 miles." },
        { do: "On climbs, enforce a steady, sustainable effort.", say: "This is a long climb. Let's find a rhythm we can hold all the way to the top without redlining." }
    ],
    fuelingGuardian: [
        { do: "Set a recurring 30-minute alarm on your watch for calories. Do not ask; tell.", say: "Time's up. Eat a gel now." },
        { do: "Before you start, know what fuel the runner is carrying. Ask them what they have.", say: "Tired of sweet? Remember you packed those pretzels. Let's get some salt in you on this next walk break." },
        { do: "Monitor their fluid intake. Ask how much they've had from their bottles.", say: "Let's make sure you finish this bottle before the next aid station. Take a big sip now." },
        { do: "Be the voice of reason when they feel sick.", say: "I know you feel nauseous, but that's a sign you need calories. Let's try just one bite of what you have and walk for a few minutes." },
        { do: "Remind them that the brain needs fuel to make good decisions.", say: "Your brain is getting tired. That's a sign it needs sugar. Let's fuel up so we can stay sharp." },
        { do: "If they are struggling to eat, suggest the \"IV drip\" method with their own supplies.", say: "Okay, no big bites. Let's just do one chew from your bar every five minutes. A steady drip of calories." },
        { do: "Plan the next aid station's food strategy a half-mile out.", say: "We're getting close. I'm thinking hot broth and a potato. Does that sound good for you to grab?" }
    ],
    painResilienceCoach: [
        { do: "Be relentlessly positive, even if it feels like you're lying.", say: "You are moving so well right now. Your form looks strong and smooth." },
        { do: "Acknowledge their pain, but immediately reframe it as progress. Avoid sympathy.", say: "I know it hurts. This is the feeling of you getting stronger. This is what you trained for." },
        { do: "Break the remaining distance down into absurdly small chunks.", say: "Forget the next aid station. See that big rock up there? We're running to that rock. That's it." },
        { do: "Remind them of their \"why.\" Connect their struggle to their core motivation.", say: "Remember why you're out here. Think about [their 'why']. This is for them." },
        { do: "Normalize their struggle. Let them know everyone is suffering.", say: "Every single person out here is in a dark place right now. You are handling it better than most. You are a fighter." },
        { do: "If they talk about quitting, use a delay tactic.", say: "Okay, I hear you. But we're not making that decision now. Let's get to the next aid station, get some soup, and then we can talk." },
        { do: "Use their name. It's a powerful psychological tool.", say: "You've got this, [Runner's Name]. You are so strong." }
    ],
    trailTechnician: [
        { do: "Take the lead on technical or downhill sections to show the best line.", say: "Stay right behind me. Just put your feet where I put mine. I've got the line." },
        { do: "Verbally cue them on form.", say: "Quick feet, light steps through here. Let's dance over these rocks." },
        { do: "Remind them to look ahead, not down at their feet.", say: "Eyes up, look 10 feet ahead. Let your brain handle the footwork." },
        { do: "Encourage a purposeful hike on steep uphills.", say: "This is a power-hike section. Hands on knees, let's drive to the top." },
        { do: "On technical descents, remind them to use their whole body for balance.", say: "Use your arms like rudders. Stay loose and let gravity do the work." },
        { do: "Shift their focus from pace to effort on difficult ground.", say: "Forget about pace here. Just focus on smooth, consistent effort." },
        { do: "If they stumble, use a quick reset cue.", say: "Nice recovery! Shake it off. Eyes forward." }
    ],
    focusMaster: [
        { do: "Break the leg down into small, immediate goals.", say: "Our only mission right now is to run to that next big tree. Let's go." },
        { do: "Use a mindfulness technique to ground them in the present.", say: "Let's reset. Name three things you can see, two things you can hear, and one thing you can feel right now." },
        { do: "Give them a simple, forward-looking task.", say: "Let's spend the next 10 minutes planning exactly what you're going to do at the next aid station." },
        { do: "If they are spiraling negatively, change the subject entirely.", say: "Tell me about your favorite part of that vacation you took last year." },
        { do: "Remind them of their training and preparation.", say: "Trust your training. You've done the work. Your body knows what to do." },
        { do: "Use simple, rhythmic cues to sync with their steps.", say: "Just 'strong and steady.' Let's repeat that. Strong... and... steady..." },
        { do: "If they are getting overwhelmed by data, simplify it.", say: "Forget the watch. Just stick with me. We're moving perfectly." }
    ],
    aidStationNinja: [
        { do: "A half-mile out, start planning the aid station stop. Create a 3-item checklist.", say: "Okay, aid station in a half-mile. Let's make a plan: 1. You swap bottles. 2. You grab soup. 3. You lube your feet. We'll be in and out in five minutes. What else?" },
        { do: "As you approach, remind them of the plan.", say: "Here we go. Remember the plan: bottles, soup, lube. Let's be efficient." },
        { do: "Encourage them to walk out of the aid station while finishing their food.", say: "Let's get moving. You can finish that while we walk. Forward progress." },
        { do: "As you leave, do a verbal checklist of their gear.", say: "You got your headlamp? You got your gloves? You got your gels? Okay, let's go." },
        { do: "Remind them that time in aid stations adds up significantly.", say: "That was a perfect pit stop. We just saved ourselves five minutes on the course." },
        { do: "If they seem overwhelmed, give them the first simple task.", say: "Okay, you're here. First thing: hand your bottles to the crew." },
        { do: "Prepare them for the next leg as you leave.", say: "Alright, we're fueled up and ready for this next climb. Let's settle in." }
    ]
};