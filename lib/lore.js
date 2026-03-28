// ============================================================
// DAWNDREAM LORE DATA
// Edit this file to update your lore & history page.
// Each entry in the `entries` array is one timeline event.
// ============================================================

export const loreData = {
  title: "Origins of the Bloodlines",
  subtitle: "From the first darkness, they were born — and the world has never been the same.",
  intro: "What follows are the recorded chronicles of DawnDream — the ancient covenant, the great wars, the betrayals, and the bloodlines that shape every soul who walks beneath the eternal night.",

  eras: [
    { id: "first-dark",    label: "The First Dark",     year: "Year 0 — The Awakening" },
    { id: "covenant",      label: "The Covenant Age",   year: "Year 120 — The Pact" },
    { id: "crimson-wars",  label: "The Crimson Wars",   year: "Year 340 — The Schism" },
    { id: "long-silence",  label: "The Long Silence",   year: "Year 600 — The Hiding" },
    { id: "awakening",     label: "The Awakening",      year: "Year 900 — The Return" },
    { id: "modern-night",  label: "The Modern Night",   year: "Year 1100 — Present" },
  ],

  entries: [
    {
      id: "first-blood",
      era: "The First Dark",
      eraId: "first-dark",
      year: "Year 0 — The Awakening",
      tag: "Origin",
      tagStyle: "origin",
      major: true,
      title: "The First Blood is Spilled",
      body: [
        "Before there were names for the dark, before there were houses or generations or laws — there was only Morthedran. He did not choose to become what he was. The old texts say he simply woke beneath a moonless sky, with a thirst that no water could quench and an eternity stretching before him like an open wound.",
        "He wandered for forty years alone, feeding and mourning in equal measure, until he found another soul worthy of the gift. He called her Seraveth, and she became the second — the first to be turned by choice rather than curse.",
      ],
      quote: {
        text: "I did not create you out of loneliness. I created you so that something beautiful might survive what I am.",
        author: "Morthedran, recorded by Seraveth, Year 41",
      },
    },
    {
      id: "first-house",
      era: "The First Dark",
      eraId: "first-dark",
      year: "Year 67 — The First Turning",
      tag: "Origin",
      tagStyle: "origin",
      major: true,
      title: "The First House is Formed",
      body: [
        "Seraveth turned three mortals in a single blood moon night — Caelith, Dravorn, and Thessaly — establishing what would eventually become the Third Generation. For the first time, the bloodline had structure. Morthedran named their gathering House Crimsonveil, after the red fog that had hung over the valley the night of his own awakening.",
      ],
      figures: [
        { name: "Caelith",  role: "3rd Generation · Strategist", desc: "First turned by Seraveth. Built the early laws of the bloodline." },
        { name: "Dravorn",  role: "3rd Generation · Warlord",    desc: "Led the defense of the first sanctum. Disappeared in the Crimson Wars." },
        { name: "Thessaly", role: "3rd Generation · Keeper",     desc: "Recorded all early lore. These very chronicles are her work." },
      ],
    },
    {
      id: "pact",
      era: "The Covenant Age",
      eraId: "covenant",
      year: "Year 120 — The Pact of Still Blood",
      tag: "Covenant",
      tagStyle: "rise",
      major: false,
      title: "The Laws of the Blood are Written",
      body: [
        "As the generations grew — fourth, fifth, and beyond — chaos threatened to consume the bloodline. Fledglings turned without permission. Houses fragmented. Morthedran, now ancient and deliberate, gathered every known vampire beneath a dead oak tree and spoke the Pact of Still Blood: generations would be honoured, sires would be responsible for those they turned, and no vampire would drain another without cause.",
        "The pact became the founding law of DawnDream — and it is still observed, if not always obeyed.",
      ],
    },
    {
      id: "schism",
      era: "The Crimson Wars",
      eraId: "crimson-wars",
      year: "Year 340 — The Great Schism",
      tag: "War",
      tagStyle: "war",
      tag2: "Betrayal",
      tag2Style: "betrayal",
      major: true,
      title: "The Houses Turn Against Each Other",
      body: [
        "No one agrees on who struck first. The histories of House Ashenvorn claim it was a 4th generation upstart named Vrael who drained a 2nd generation elder without sanction. House Crimsonveil's records say otherwise — that it was a deliberate act of political assassination. What is certain is that within a single decade, every house was at war.",
        "The Crimson Wars lasted sixty years. More vampires met their end in those six decades than in all the centuries before combined. When the silence finally came, entire bloodlines had been erased from the world.",
      ],
      quote: {
        text: "We survived the sun, the stake, the fire — and then we almost destroyed ourselves with pride.",
        author: "Thessaly, Lament of the Schism, Year 401",
      },
    },
    {
      id: "silence",
      era: "The Long Silence",
      eraId: "long-silence",
      year: "Year 600 — The Retreat",
      tag: "Silence",
      tagStyle: "betrayal",
      major: false,
      title: "The Bloodlines Go into Hiding",
      body: [
        "Following the wars, the mortal world had grown suspicious. Hunters emerged — blessed, trained, and hungry for retribution. The remaining houses agreed to scatter, to bury their names, and to wait. For three centuries the bloodlines moved in shadows, turning only rarely, hoarding their strength. These years are called the Long Silence, and few records survive them.",
      ],
    },
    {
      id: "return",
      era: "The Modern Night",
      eraId: "modern-night",
      year: "Year 1100 — The Return",
      tag: "Rise",
      tagStyle: "rise",
      major: true,
      title: "DawnDream Begins — The New Age of Blood",
      body: [
        "Now the houses stir again. The old laws hold — barely. New generations are rising faster than ever before, and with them come new ambitions, new betrayals, and new alliances. Morthedran has not been seen in two centuries. Some say he sleeps. Others say he watches.",
        "This is the age you were born into. The bloodline remembers everything. What it does not know is what you will add to it.",
      ],
      quote: {
        text: "History is written in blood. Make sure yours is worth reading.",
        author: "House Crimsonveil, Founding Inscription",
      },
    },
  ],
};
