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
};

export const presets: { [key: string]: Profile } = {
  allrounder: { heat: 1.0, fadePer10k: 1.0, nightConf: 'Medium', upCostPct: 2.8, downBenefitPct: 1.0, downPenaltyPct: 1.2, tRoad: 1.0, tSmooth: 1.0, tMixed: 1.05, tTech: 1.15, tSand: 1.20, hike: true, hikeThr: 15, vam: 800, poles: true, packKg: 2, muscularResilience: 0.003, hikingEconomyFactor: 0.085 },
  mountain: { heat: 1.0, fadePer10k: 1.2, nightConf: 'High', upCostPct: 2.5, downBenefitPct: 1.2, downPenaltyPct: 1.0, tRoad: 1.02, tSmooth: 1.0, tMixed: 1.05, tTech: 1.12, tSand: 1.25, hike: true, hikeThr: 12, vam: 1000, poles: true, packKg: 3, muscularResilience: 0.0015, hikingEconomyFactor: 0.085 },
  endurance: { heat: 1.0, fadePer10k: 0.8, nightConf: 'Medium', upCostPct: 2.8, downBenefitPct: 1.0, downPenaltyPct: 1.4, tRoad: 1.0, tSmooth: 1.0, tMixed: 1.05, tTech: 1.20, tSand: 1.20, hike: true, hikeThr: 18, vam: 700, poles: false, packKg: 1, muscularResilience: 0.004, hikingEconomyFactor: 0.085 },
  beginner: { heat: 0.9, fadePer10k: 1.5, nightConf: 'Low', upCostPct: 3.5, downBenefitPct: 0.8, downPenaltyPct: 1.8, tRoad: 1.0, tSmooth: 1.02, tMixed: 1.10, tTech: 1.25, tSand: 1.30, hike: true, hikeThr: 10, vam: 600, poles: false, packKg: 4, muscularResilience: 0.005, hikingEconomyFactor: 0.085 },
  undertrained: { heat: 0.85, fadePer10k: 2.5, nightConf: 'Low', upCostPct: 4.0, downBenefitPct: 0.7, downPenaltyPct: 2.5, tRoad: 1.0, tSmooth: 1.03, tMixed: 1.12, tTech: 1.30, tSand: 1.35, hike: true, hikeThr: 8, vam: 550, poles: false, packKg: 4, muscularResilience: 0.008, hikingEconomyFactor: 0.085 },
  crammer: { heat: 1.05, fadePer10k: 0.9, nightConf: 'Medium', upCostPct: 3.2, downBenefitPct: 0.8, downPenaltyPct: 2.8, tRoad: 1.0, tSmooth: 1.0, tMixed: 1.10, tTech: 1.28, tSand: 1.30, hike: true, hikeThr: 16, vam: 650, poles: false, packKg: 2, muscularResilience: 0.009, hikingEconomyFactor: 0.085 },
};

export const whyRows: [string, string, string][] = [
    ['Heat Acclimation', '1.0', 'Reduces the penalty from heat/humidity. >1.0 for well-acclimated, <1.0 for poorly-acclimated. A value of 1.2 means you are 20% better at handling heat than the average.'],
    ['Base Metabolic Fade % / 10k', '1.0%', 'The BASE rate your pace slows from metabolic fatigue, applied per 10,000 "effort-seconds". This rate is amplified by your accumulated muscular damage.'],
    ['Muscular Resilience', '0.003', 'How sensitive you are to muscular damage from downhills. A lower value means you are more resilient (e.g., an elite mountain runner). This multiplies your damage score to determine your effective fatigue rate.'],
    ['Night Confidence', 'Medium', 'Penalty applied during night hours to account for navigation and visibility challenges. High=0%, Medium=5%, Low=10%.'],
    ['Uphill Cost %', '2.8%', 'Pace penalty per 1% of positive grade. A value of 2.8 means for every 1% of incline, your effort increases by 2.8%.'],
    ['Down Benefit %', '1.0%', 'Pace bonus per 1% of negative grade on runnable downhills (up to -3%). Higher values for confident descenders.'],
    ['Down Penalty %', '1.2%', 'Pace penalty per 1% of negative grade on steep downhills (< -3%), where braking forces increase effort.'],
    ['Terrain Multipliers', 'tTech: 1.15', 'A direct multiplier on your pace for a given surface, relative to a perfect road. 1.15 means you are 15% slower on technical terrain than you would be on a smooth trail.'],
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

export const HELPER_NOTE_MODULES = {
  pacingPro: {
    name: 'The Pacing Pro',
    description: "For the athlete who struggles with a fast start, maintaining consistent effort, or gets caught up in the excitement.",
    notes: [
      "This should feel 'too easy'.",
      "You can't win it here, but you can lose it.",
      "Run your own race. Let them go.",
      "Check your heart rate. Is it in the all-day zone?",
      "Smooth is fast. Fast is smooth.",
    ]
  },
  fuelingGuardian: {
    name: 'The Fueling Guardian',
    description: "For the athlete prone to nausea, stomach issues, or who forgets to eat and drink consistently, especially when fatigued.",
    notes: [
      "Most problems can be solved by eating.",
      "Sip and nibble. A steady drip prevents the crash.",
      "Stomach turning? Slow down.",
      "Sick of sweet? Time for salt.",
      "250 calories per hour. Are you on schedule?"
    ]
  },
  painResilienceCoach: {
    name: 'The Pain & Resilience Coach',
    description: "For the athlete who struggles with the mental aspect of pain, gets caught in negative thought loops, and needs help reframing discomfort.",
    notes: [
      "Pain is inevitable. Suffering is optional.",
      "This is what you came for.",
      "Acknowledge the pain, don't argue with it.",
      "You've been through worse. Remember why you started.",
      "How will you feel tomorrow if you quit now?"
    ]
  },
  trailTechnician: {
    name: 'The Trail Technician',
    description: "For the athlete who loses time or confidence on technical terrain like rocky descents, root-filled singletrack, or mud.",
    notes: [
        "Quick feet, light steps.",
        "Scan ahead, not at your feet.",
        "Flow, don't fight the trail.",
        "Use your arms like rudders for balance.",
        "Focus on effort, not pace."
    ]
  },
  focusMaster: {
      name: 'The Focus Master',
      description: "For the athlete whose mind wanders into negative territory or gets overwhelmed by the sheer distance remaining.",
      notes: [
          "Run the mile you're in.",
          "Engage your senses: 3 things you see, 2 you hear, 1 you feel.",
          " mentally rehearse your next aid station plan.",
          "Remember your 'why'.",
          "Smile. It's a performance enhancer."
      ]
  },
  aidStationNinja: {
      name: 'The Aid Station Ninja',
      description: "For the athlete who loses critical time in aid stations by being distracted, sitting too long, or forgetting crucial tasks.",
      notes: [
          "Plan your 3 must-do tasks NOW.",
          "Get in, get out. Don't sit down.",
          "Eat and drink while you walk out.",
          "Final check: Salt? Lube? Batteries?",
          "Thank a volunteer."
      ]
  }
};

export type HelperModuleKey = keyof typeof HELPER_NOTE_MODULES;


export const getRandomNote = (notes: string[], exclude: string[] = []): string => {
    const availableNotes = notes.filter(n => !exclude.includes(n));
    if (availableNotes.length === 0) return notes[Math.floor(Math.random() * notes.length)]; // fallback
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
};

export const getRandomSupportNote = (notes: SupportNote[]): SupportNote => {
    return notes[Math.floor(Math.random() * notes.length)];
}

export const replaceRandomNote = (notes: string[], newNote: string): string[] => {
    if (notes.includes(newNote)) return notes; // Don't add duplicates
    const notesCopy = [...notes];
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

export const CREW_NOTE_MODULES = {
    early: [
        { do: "Have pre-filled bottles ready for a quick swap. Take their trash immediately.", say: "You look smooth and controlled. Perfect pace. Here are your bottles, you're out in 2 minutes." },
        { do: "Have the next leg's nutrition pre-bagged and ready to hand off.", say: "You're right on schedule. Keep sipping those calories. What do you want at the next aid station?" },
        { do: "Hold out anti-chafe balm. Don't ask, just offer proactively.", say: "Lube up now, even if you feel fine. Let's stay ahead of any problems." },
        { do: "Check the upcoming weather forecast and have the next appropriate piece of gear ready (hat, sleeves, etc.).", say: "The sun's coming up on this next leg. Grab your hat. You're executing the plan perfectly." },
        { do: "Keep interactions brief and positive. Your main job is efficiency.", say: "You're looking strong and relaxed. Exactly where you need to be. See you at [Next Location]." },
        { do: "Confirm their next drop bag location and what they need from it.", say: "Your next drop bag is at [Aid Station]. Let me know now if you need anything special from it." },
        { do: "Take a quick photo. Capture the good moments.", say: "Quick smile! You're looking great. Documenting this for later." },
        { do: "Don't mention how far they have to go. Focus only on the next leg.", say: "Just focus on this next section. It's [X] km and you know how to do that." },
        { do: "Ask one key question: 'What can I do to make your next leg better?'", say: "Anything you need for this next leg? Tell me now." },
        { do: "Remind them of their nutrition plan for the upcoming leg.", say: "You've got a climb coming up. Remember to get those gels in on the hike." }
    ],
    midRace: [
        { do: "Have both sweet and savory/salty food options visible (broth, pretzels, etc.).", say: "How's the stomach? If sweet isn't working, try this broth. Let's get some real food in." },
        { do: "While they eat, visually scan their gait and check for chafing. Have a small first-aid kit ready.", say: "You're moving well. Let's check those feet for hotspots while you change socks. We're staying on top of it." },
        { do: "Project calm, even if your runner is negative. Your calm is contagious.", say: "This is the tough part you trained for. Everyone feels this way. Just focus on getting to the next checkpoint." },
        { do: "Check their headlamp battery before it gets dark. Have the backup ready.", say: "It'll get dark on the next leg. Let's swap your battery now so you don't have to think about it." },
        { do: "Know the profile of the next leg (big climb, long descent).", say: "This next section has that big climb. It's a great chance to power-hike and eat. Just get to the top." },
        { do: "Have a camp chair ready, but encourage them not to sit for more than 5 minutes.", say: "Take a seat for a minute while you eat, but we're up and out in 5. Let's not get cold." },
        { do: "Ask about specific pain points - feet, stomach, chafing. Have solutions ready.", say: "On a scale of 1-10, how are the feet? Let's fix any hotspots now before they become blisters." },
        { do: "Help them with a full sock change. Have new socks and foot lube ready.", say: "New socks will feel amazing. Let's get these on. How do the feet feel?" },
        { do: "Give them a specific, positive observation about their race.", say: "I was checking the tracker, you passed 3 people on that last climb. You're looking stronger than those around you." },
        { do: "Offer a caffeine source if appropriate (coke, gel, coffee).", say: "A little caffeine boost for this next leg? It'll help you focus." }
    ],
    night: [
        { do: "Have a puffy jacket and a warm drink (broth, tea) ready immediately.", say: "Here, drink this. It's warm. Your light looks good. Just focus on the trail in front of you." },
        { do: "Ask simple, direct yes/no questions. Avoid open-ended ones.", say: "Are you eating? Are you drinking? Are you warm enough?" },
        { do: "Assess their coherence. Be prepared to suggest a 20-minute nap if they seem disoriented.", say: "You're moving safely. The sun will be up in [X] hours. You're getting through the hardest part." },
        { do: "If a pacer is starting, brief them quickly on the runner's condition.", say: "(To runner) \"[Pacer's Name] is here to keep you safe. Just follow their lead.\"" },
        { do: "Be an anchor of confidence. Your presence is a powerful boost.", say: "You are doing an amazing job getting through the night. This is what champions do. Keep moving forward." },
        { do: "Have backup batteries and a spare headlamp ready to go.", say: "Let's swap that headlamp battery now, even if it's fine. Don't want it dying on you out there." },
        { do: "Remind them of the time and distance to sunrise.", say: "You've got about 2 hours until sunrise. The hardest part is almost over. Let's get you there." },
        { do: "Be ready with high-calorie, easy-to-digest food. They are likely in a deficit.", say: "Let's get 200 calories in you right now. This soup is perfect." },
        { do: "If they are struggling, give them one, simple task: 'Just get to the next aid station.'", say: "I know it's hard. Your only job is to get to [Next Aid]. We'll take care of you there." },
        { do: "Check their high-visibility gear is on correctly.", say: "Your vest is on, your light is bright. You're safe and ready to go." }
    ],
    finalPush: [
        { do: "Know the exact distance remaining.", say: "This is it. You have [X miles] left. That's just your [familiar training loop]. Leave nothing out here." },
        { do: "Know the final cutoff time and calculate the required pace.", say: "You have plenty of time. Just hold this effort. Don't let up now, you've worked too hard." },
        { do: "Make this the fastest aid station stop. Hand them one bottle and one gel. No sitting.", say: "No stopping. Drink this, eat this, and go. We will see you at the finish line. GO!" },
        { do: "Remind them of their \"why\" for doing the race.", say: "Remember why you're doing this. Think about [their 'why']. All that training was for these last few miles. Go earn it." },
        { do: "Paint a vivid picture of the finish line.", say: "I want to see you sprinting down that finish chute. We'll be there screaming for you. Now get out of here and go get your buckle!" },
        { do: "Don't ask questions, give simple, positive commands.", say: "Just drink this. Now eat this. Good. Now go. We're so proud of you." },
        { do: "Have their finish line clothes/items ready.", say: "Your warm jacket and recovery drink are waiting for you at the finish. Go get it." },
        { do: "Get information on the next runner ahead and use it as motivation.", say: "The runner ahead is only 3 minutes up the road. You can catch them. Go hunt." },
        { do: "Play their favorite motivational song on your phone.", say: "Listen to this. This is your song. Let's go!" },
        { do: "Tell them how proud you are, regardless of the outcome.", say: "Whatever happens, you've done something incredible today. Now go finish it." }
    ]
};

export const PACER_NOTE_MODULES = {
    strategist: [
        { do: "Immediately perform a full systems check (gait, fuel, hydration, hotspots).", say: "Alright, I'm taking over the thinking. Your only job is to move. When was the last time you took in calories and salt?" },
        { do: "Take responsibility for timing. Set a recurring 30-minute alarm on your own watch for nutrition.", say: "My watch is set. I'll tell you when it's time to eat. You just focus on the trail." },
        { do: "Constantly reference the leg profile. Know what terrain is coming next.", say: "We've got a big climb coming up. Perfect time to hike and get some solid food down. We're just going to the top of this hill." },
        { do: "Listen for complaints and proactively suggest solutions.", say: "I hear you that your stomach is turning. Let's slow to a walk for five minutes and try some broth at the next aid. We can fix this." },
        { do: "A half-mile out from the next aid station, create a clear, simple plan.", say: "Aid station plan: 1. Swap bottles. 2. Grab soup. 3. Lube feet. We're in and out in five minutes. What else?" },
        { do: "Enforce a walk/run strategy if necessary, especially on climbs.", say: "Okay, we're power-hiking to that big tree, then we'll run the flat section after. Let's be smart here." },
        { do: "Be the bad cop for them at aid stations. Keep them moving.", say: "Great job. Okay, we're not staying. Grab what you need and let's walk out while we eat." },
        { do: "Manage their pace. Don't let them surge with adrenaline.", say: "Easy now, this pace is perfect. Let's keep it smooth and steady. Plenty of race left." },
        { do: "Handle all communication with crew or race officials.", say: "You just keep moving, I'll talk to them and get what we need." },
        { do: "Do not let your runner sit down at an aid station for more than 2 minutes.", say: "We can fix that while we're walking. Let's get out of here." }
    ],
    guardian: [
        { do: "Take the lead on technical or downhill sections to light the path.", say: "Stay right behind me. Just put your feet where I put mine. I've got the line." },
        { do: "Be firm about nutrition. Don't ask, tell. A sleep-deprived brain needs direct commands.", say: "It's been 30 minutes. It's time to eat a gel. Now." },
        { do: "Keep track of time until sunrise and use it as a motivator.", say: "We're doing great. Only 90 minutes until the sun comes up. That first light is going to feel amazing. Let's run to the sunrise." },
        { do: "If they hallucinate, respond calmly and reassuringly.", say: "I know, the shadows play tricks at night. I'm right here with you. We're safe. Let's keep moving forward together." },
        { do: "Your job is to prevent them from stopping completely. Pace will be slow; that's normal.", say: "Forward is a pace. We're still moving and that's all that matters. Every step is a step closer." },
        { do: "Constantly scan the trail ahead for trip hazards like roots or rocks.", say: "Watch your step here, big root on the left. Good." },
        { do: "Keep conversation minimal unless the runner initiates. Conserve their mental energy.", say: "I'm right here with you. Just focus on my feet. You're doing great." },
        { do: "Monitor for signs of hypothermia. Be ready to add a layer.", say: "Are you starting to feel cold? Let's put your jacket on before we get chilled." },
        { do: "Check course markings at every junction to prevent wrong turns.", say: "Okay, I see the marker. We're on the right track. Keep it up." },
        { do: "If they stop, give them a 30-second countdown before you start moving again.", say: "Okay, take a quick break. We are moving again in 30 seconds. 29, 28..." }
    ],
    closer: [
        { do: "Know the final cutoff time and the absolute slowest pace needed to finish.", say: "We have plenty of time in the bank. All we have to do is maintain [X pace] per mile, and we're getting that buckle. That's just a power-hike." },
        { do: "Do NOT talk about the total mileage remaining. Break it down into tiny, visible chunks.", say: "Forget the finish line. See that big tree up there? We're running to that tree. That's it. Let's go." },
        { do: "Remind them of their \"why.\" Connect their struggle to their deeper motivation.", say: "Remember all those early morning training runs? This is what it was for. Think about [their 'why']. Let's go show them how strong you are." },
        { do: "Acknowledge their pain but reframe it as a sign of effort.", say: "I know it hurts. It's supposed to hurt right now. This is the feeling of you leaving everything on the course. You're earning this finish." },
        { do: "When the finish is truly close (last mile), give them explicit permission to go all out.", say: "This is it. Time to empty the tank. Leave nothing out here. I'll see you at the finish line. Go!" },
        { do: "Start doing 'race math' for them out loud.", say: "Okay, 5k to go. That's just a parkrun. We can do anything for 30 minutes. Let's see who we can catch." },
        { do: "If you see a photographer, give the runner a heads-up to look strong.", say: "Photographer ahead! Let's look good for the camera. Straighten up, smile!" },
        { do: "Run in front and let them 'chase' you.", say: "Just stick on my shoulder. Don't let me get away. We're pulling them in." },
        { do: "Tell a story or a joke to distract them from the pain.", say: "Did I ever tell you about the time... (distract for 5 minutes)." },
        { do: "Count down the final minutes to the finish.", say: "Only 10 minutes of work left. You can do anything for 10 minutes. Let's finish strong." }
    ]
};