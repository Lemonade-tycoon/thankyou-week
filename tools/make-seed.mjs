// One-off: writes people.seed.json (plain text, NOT committed) from the name list.
import { writeFileSync } from "node:fs";

const R = (riddle, hint, answer, aliases = []) => ({ riddle, hint, answer, aliases });
const riddles = {
  Shafiq: R("I have keys but open no doors. I have space but no room. What am I?", "You type on me every day", "keyboard"),
  Leo: R("You can't see me, but the whole office asks for my password. What am I?", "IT keeps me running", "wifi", ["wi-fi", "internet"]),
  Airul: R("I'm always jammed, but I never play music. What am I?", "I eat paper all day", "printer"),
  Julius: R("I speak without a mouth and hear without ears. What am I?", "Shout in a cave", "echo"),
  Adly: R("I follow you all day but disappear at night. What am I?", "The sun makes me", "shadow"),
  Wan: R("The more you take, the more you leave behind. What are they?", "Look down when you walk", "footsteps", ["footprints"]),
  Jiman: R("I can be cracked, made, told and played. What am I?", "I make you laugh", "joke"),
  Derek: R("I show your face but have none of my own. What am I?", "Check your hair in me", "mirror"),
  Fai: R("I show up after the rain with seven colours. What am I?", "Look up at the sky", "rainbow"),
  Gab: R("I have hands but I can't clap. What am I?", "Tick tock", "clock"),
  Joel: R("I go up and down but never move. What am I?", "Use me when the lift is broken", "stairs", ["staircase"]),
  Joan: R("Office fuel, best served hot. Without me, Monday mornings flop. What am I?", "Find me in the pantry", "coffee"),
  Nizan: R("I have lots of dates but I never go on any. What am I?", "I hang on the wall with 12 months", "calendar"),
  Hin: R("I'm taken from a mine, shut in a wooden case, and used by almost everyone. What am I?", "I often have an eraser", "pencil"),
  Nelly: R("I have cities but no houses, forests but no trees, and water but no fish. What am I?", "Travellers unfold me", "map"),
  Fafa: R("I'm a small book that lets you fly around the world. What am I?", "Show me at the immigration counter", "passport"),
  Angel: R("I go on every holiday but never see the sights. What am I?", "Look for me at baggage claim", "suitcase", ["luggage", "bag"]),
  Leng: R("I travel around the world while staying in one corner. What am I?", "Look at the top of an envelope", "stamp"),
  Carol: R("I go up when the rain comes down. What am I?", "Don't leave home without me in monsoon season", "umbrella"),
  Shila: R("I run but never walk. I have a mouth but never talk. What am I?", "I flow to the sea", "river"),
  Elsey: R("Everyone at work counts down to me, and I come with a leave form. What am I?", "Annual leave", "holiday", ["vacation"]),
  Yon: R("I start with E, end with E, and contain only one letter. What am I?", "You're holding one right now", "envelope"),
  Ezron: R("I have a head and a tail but no body. What am I?", "Flip me to decide", "coin"),
  Razle: R("I have one eye but I can't see. What am I?", "Used for sewing", "needle"),
  Arthur: R("I'm tall when I'm young and short when I'm old. What am I?", "Find me on a birthday cake", "candle"),
  Ivy: R("If you share me, I'm gone. What am I?", "Whisper it", "secret"),
  Audrey: R("What gets wetter the more it dries?", "Grab me after a shower", "towel"),
  Hanif: R("I have a neck but no head. What am I?", "Drinks come in me", "bottle"),
  Cindy: R("I'm green on the outside, red on the inside, with black seeds. What am I?", "A juicy summer fruit", "watermelon"),
  Brandon: R("Feed me and I live. Give me water and I die. What am I?", "Campfire", "fire"),
  Pasco: R("I'm always coming but I never arrive. What am I?", "The day after today", "tomorrow"),
  Sarah: R("I go up but never come down. What am I?", "Birthdays make me bigger", "age"),
  Angie: R("What has to be broken before you can use it?", "Breakfast", "egg"),
  Nio: R("I'm full of holes but I still hold water. What am I?", "Find me by the kitchen sink", "sponge"),
  Queen: R("I have teeth but I never bite. What am I?", "Use me on your hair", "comb"),
  Ewa: R("I have fingers but no bones. What am I?", "Wear me on cold hands", "glove"),
  Linah: R("What breaks when you say its name?", "Shhh", "silence"),
  Ayvee: R("I fly without wings and everyone says there's never enough of me. What am I?", "It's already 5pm?!", "time"),
  Sam: R("I have 88 keys but can't open a single door. What am I?", "I make music", "piano"),
};

const teams = {
  "IT": ["Shafiq", "Leo", "Airul", "Julius", "Adly"],
  "Marketing": ["Wan", "Jiman", "Derek", "Fai"],
  "Ops": ["Gab", "Joel", "Joan", "Nizan", "Hin"],
  "Tour Consult Agent": ["Nelly", "Fafa", "Angel", "Leng", "Carol", "Shila", "Elsey"],
  "RC": ["Yon", "Ezron", "Razle", "Arthur", "Ivy"],
  "Tour Consultant Walk-in": ["Audrey", "Hanif", "Cindy", "Brandon"],
  "HR": ["Pasco", "Sarah", "Angie"],
  "ACC": ["Nio", "Queen", "Ewa", "Linah", "Ayvee", "Sam"],
};
const defaults = {
  "IT": ["Tech Wizard", "Fixes it before you finish asking"],
  "Marketing": ["Hype Machine", "Makes everything look 10x better"],
  "Ops": ["Engine Room Captain", "Keeps the whole show running"],
  "Tour Consult Agent": ["Trip Wizard", "Finds a seat on a fully booked flight"],
  "RC": ["RC Legend", "Handles ten things at once"],
  "Tour Consultant Walk-in": ["Front Desk Star", "Turns walk-ins into happy travellers"],
  "HR": ["People Champion", "Always has time for everyone"],
  "ACC": ["Money Magician", "Makes the numbers balance every time"],
};

// Friendly starting ratings (84-97) so no card looks empty; edit them in the admin page.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) % 14) + 84;

const people = [];
for (const [team, names] of Object.entries(teams)) {
  for (const name of names) {
    people.push({
      name, team,
      role: defaults[team][0], move: defaults[team][1],
      why: "Thank you for everything you do for the team this year. Working with you makes the office a better place.",
      media: "",
      s: Array.from({ length: 6 }, rnd),
      ...riddles[name],
    });
  }
}
if (people.length !== Object.keys(riddles).length) throw new Error("name/riddle mismatch");
writeFileSync(new URL("./people.seed.json", import.meta.url), JSON.stringify(people, null, 2));
console.log(people.length, "people");
