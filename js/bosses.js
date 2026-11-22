/* =====================================================================
   CIRCLE IT — BOSS LIST  (made with tools/editor.html)
   Stage 1..10 use these bosses in order. Stage 11+ picks 2-5 random
   bosses from this list (except ones with tutorial:true or noRandom:true).
   Edit with tools/editor.html, or by hand. Field reference:
   img (PNG path, missing = built-in art) · shape · color · color2
   hp · r (hitbox) · speed · eva (0-0.6) · atk (touch dmg) · enrage
   move {type: still|wander|bounce|chase, dashEvery, dashSpeed, teleportEvery}
   attacks [{type: aimed|radial|ring|laser|trail|mines|shield|invis, every, ...}]
   ===================================================================== */
window.CIRCLEIT_BOSSES = [
  {
    id: "dummy",
    name: "Training Dummy",
    title: "Very patient. Very stuffed.",
    hint: "Hold and drag to draw. Draw a circle AROUND the dummy to hit it!",
    img: "img/bosses/01_dummy.png",
    shape: "dummy",
    color: "#d94a3a",
    color2: "#efe6cf",
    hp: 250,
    r: 70,
    speed: 0,
    eva: 0,
    atk: 0,
    tutorial: true,
    noRandom: true,
    move: {
      type: "still"
    },
    attacks: []
  },
  {
    id: "winter",
    name: "Winter",
    title: "A Twilight Member",
    hint: "A cute padoru",
    img: "img/bosses/02_slime.png",
    shape: "blob",
    color: "#4cd964",
    color2: "#ffd43b",
    hp: 600,
    r: 62,
    speed: 70,
    eva: 0,
    atk: 10,
    move: {
      type: "wander"
    },
    attacks: [
      {
        type: "aimed",
        every: 2.2,
        count: 1,
        speed: 200,
        size: 12
      }
    ]
  },
  {
    id: "bat",
    name: "Bat Lord",
    title: "Night Screech",
    hint: "Bounces fast and dashes at your pen. Draw quick, tight circles.",
    img: "img/bosses/03_bat.png",
    shape: "bat",
    color: "#8e5cf7",
    color2: "#ff3b5c",
    hp: 1000,
    r: 48,
    speed: 210,
    eva: 0.05,
    atk: 12,
    move: {
      type: "bounce",
      dashEvery: 4,
      dashSpeed: 700
    },
    attacks: []
  },
  {
    id: "ander",
    name: "Ander",
    title: "Ander the Rammus",
    hint: "Shoots spikes all around and hides in its shell (blocks hits). Wait for the shield to drop.",
    img: "img/bosses/ander.png",
    shape: "turtle",
    color: "#6b8f3a",
    color2: "#e0c068",
    hp: 1500,
    r: 66,
    speed: 60,
    eva: 0,
    atk: 14,
    move: {
      type: "wander"
    },
    attacks: [
      {
        type: "radial",
        every: 2.6,
        count: 10,
        speed: 190,
        size: 9
      },
      {
        type: "shield",
        every: 9,
        dur: 2.2
      }
    ]
  },
  {
    id: "phantom",
    name: "Phantom",
    title: "The Blink in the Dark",
    hint: "Teleports and turns invisible. 15% evasion — PREC helps you land hits.",
    img: "img/bosses/05_phantom.png",
    shape: "ghost",
    color: "#dfe7ff",
    color2: "#7ad7ff",
    hp: 2100,
    r: 56,
    speed: 90,
    eva: 0.15,
    atk: 16,
    move: {
      type: "wander",
      teleportEvery: 4.5
    },
    attacks: [
      {
        type: "aimed",
        every: 2,
        count: 3,
        spread: 0.3,
        speed: 240,
        size: 9
      },
      {
        type: "invis",
        every: 8,
        dur: 2.5
      }
    ]
  },
  {
    id: "Krish",
    name: "Krish",
    title: "Krish the Nigger",
    hint: "looks cute but can harm you",
    img: "img/bosses/Krish.png",
    shape: "serpent",
    color: "#ff7a1a",
    color2: "#ffd43b",
    hp: 2900,
    r: 50,
    speed: 150,
    eva: 0.1,
    atk: 18,
    enrage: true,
    move: {
      type: "chase"
    },
    attacks: [
      {
        type: "trail",
        every: 0.12,
        life: 2.6,
        size: 14
      },
      {
        type: "radial",
        every: 3.2,
        count: 8,
        speed: 230,
        size: 8
      }
    ]
  },
  {
    id: "kiypo",
    name: "Kiyo",
    title: "Kiyo the Manipulator",
    hint: "He can confuse you",
    img: "img/bosses/kiypo.png",
    shape: "knight",
    color: "#c9d3e0",
    color2: "#ff4d6d",
    hp: 3800,
    r: 58,
    speed: 120,
    eva: 0.2,
    atk: 20,
    enrage: true,
    move: {
      type: "wander",
      dashEvery: 3,
      dashSpeed: 850
    },
    attacks: [
      {
        type: "shield",
        every: 7,
        dur: 2
      },
      {
        type: "aimed",
        every: 1.8,
        count: 2,
        spread: 0.2,
        speed: 300,
        size: 8
      }
    ]
  },
  {
    id: "eye",
    name: "Storm Eye",
    title: "It Sees Your Pen",
    hint: "Watch for the red warning line — a sweeping laser follows.",
    img: "img/bosses/08_eye.png",
    shape: "eye",
    color: "#3aa8ff",
    color2: "#fff36b",
    hp: 4800,
    r: 60,
    speed: 100,
    eva: 0.2,
    atk: 22,
    enrage: true,
    move: {
      type: "wander"
    },
    attacks: [
      {
        type: "laser",
        every: 5,
        warn: 0.9,
        dur: 1.6,
        width: 18,
        sweep: 1.1
      },
      {
        type: "radial",
        every: 2.4,
        count: 12,
        speed: 210,
        size: 8,
        spin: 0.25
      }
    ]
  },
  {
    id: "golem",
    name: "Clockwork Golem",
    title: "Tick. Tock. Boom.",
    hint: "Shockwave rings hit every line they pass — lift your pen as a ring passes. Mines arm after a moment.",
    img: "img/bosses/09_golem.png",
    shape: "golem",
    color: "#8a8f99",
    color2: "#ff9f1a",
    hp: 6000,
    r: 76,
    speed: 55,
    eva: 0.1,
    atk: 26,
    enrage: true,
    move: {
      type: "wander"
    },
    attacks: [
      {
        type: "ring",
        every: 3.5,
        speed: 280,
        width: 12
      },
      {
        type: "mines",
        every: 4,
        count: 4,
        life: 6,
        size: 18
      },
      {
        type: "aimed",
        every: 2.5,
        count: 1,
        speed: 320,
        size: 14
      }
    ]
  },
  {
    id: "X",
    name: "XKing",
    title: "X the first",
    hint: "Beat his SLC score",
    img: "img/bosses/X.png",
    shape: "king",
    color: "#9b5cff",
    color2: "#ff2e63",
    hp: 8000,
    r: 60,
    speed: 165,
    eva: 0.3,
    atk: 30,
    enrage: true,
    move: {
      type: "chase",
      teleportEvery: 6,
      dashEvery: 5,
      dashSpeed: 900
    },
    attacks: [
      {
        type: "aimed",
        every: 1.7,
        count: 3,
        spread: 0.25,
        speed: 360,
        size: 9
      },
      {
        type: "ring",
        every: 5.5,
        speed: 300,
        width: 12
      },
      {
        type: "laser",
        every: 7,
        warn: 0.8,
        dur: 1.5,
        width: 18,
        sweep: 1.2
      },
      {
        type: "radial",
        every: 3.2,
        count: 14,
        speed: 220,
        size: 8,
        spin: 0.3
      },
      {
        type: "invis",
        every: 11,
        dur: 2.5
      }
    ]
  }
];
