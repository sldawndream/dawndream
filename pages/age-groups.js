import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import styles from '../styles/AgeGroups.module.css';

const vampireAges = [
  { name: 'Fledgling',            nights: '0 – 14 Nights',       desc: 'Newly turned — still learning to master the hunger and the dark gifts of their blood.' },
  { name: 'Children of the Night',nights: '15 – 114 Nights',     desc: 'Beginning to find their place in the eternal hierarchy — the first true step into the dark.' },
  { name: 'Ancilla',              nights: '115 – 214 Nights',    desc: 'Seasoned and politically aware — they have survived long enough to be trusted with real power.' },
  { name: 'Night Walker',         nights: '215 – 414 Nights',    desc: 'A creature of the dark in full — moving unseen, feared by mortals and respected by kindred.' },
  { name: 'Gehenna',              nights: '415 – 614 Nights',    desc: 'Named for the end of times — their power is undeniable and their patience absolute.' },
  { name: 'Imperion',             nights: '615 – 814 Nights',    desc: 'An imperial force among the undead — few dare challenge one of this age.' },
  { name: 'Paragon',              nights: '815 – 1,014 Nights',  desc: 'The standard against which younger vampires measure themselves — a pinnacle of the blood.' },
  { name: 'Tiamat',               nights: '1,015 – 1,214 Nights',desc: 'Ancient and terrifying — named for the primordial dragon of chaos and destruction.' },
  { name: 'Apollyon',             nights: '1,215 – 1,464 Nights',desc: 'The destroyer — a vampire of this age walks with the weight of centuries in every step.' },
  { name: 'Thanatos',             nights: '1,465 – 1,714 Nights',desc: 'Death itself given form — their very presence shifts the balance of any room they enter.' },
  { name: 'Nemesis',              nights: '1,715 – 1,999 Nights',desc: 'The inevitable — retribution and ruin incarnate, unstoppable by any lesser kindred.' },
  { name: 'Apocalypse',           nights: '2,000 – 2,299 Nights',desc: 'The end of worlds — a vampire who has seen empires rise and collapse beneath their watch.' },
  { name: 'Titan',                nights: '2,300 – 2,599 Nights',desc: 'A colossus of the eternal dark — their bloodline alone can reshape the hierarchy.' },
  { name: 'Eternity',             nights: '2,600 – 2,899 Nights',desc: 'Beyond time itself — they have outlasted every enemy, every covenant, every age.' },
  { name: 'Armageddon',           nights: '2,900 – 3,249 Nights',desc: 'The final war given shape — their decisions alone can ignite or extinguish entire bloodlines.' },
  { name: 'Dragon of Destruction',nights: '3,250 – 3,749 Nights',desc: 'A myth made flesh — spoken of in whispers by even the oldest of elders.' },
  { name: 'God of Death',         nights: '3,750 – 19,999 Nights',desc: 'Beyond comprehension — a presence so ancient that history itself bends around them.' },
  { name: 'Seraphim',             nights: '20,000+ Nights',      desc: 'The apex of all that is eternal — if one exists, none alive have ever stood in their presence and lived to speak of it.' },
];

const lycanAges = [
  { name: 'Young Wolf',        nights: '0 – 14 Nights',        desc: 'Freshly changed — still learning to control the shift and find their place within the pack.' },
  { name: 'Lunar Ascendant',   nights: '15 – 114 Nights',      desc: 'The moon\'s call grows stronger — their first true steps as a wolf-blooded warrior.' },
  { name: 'Pack Hunter',       nights: '115 – 214 Nights',     desc: 'A proven hunter — trusted to run with the pack and hold the line in battle.' },
  { name: 'Blood Tracker',     nights: '215 – 414 Nights',     desc: 'Their senses are unmatched — no prey escapes them, no trail goes cold beneath their nose.' },
  { name: 'Apex Predator',     nights: '415 – 614 Nights',     desc: 'At the top of the hunt — feared by mortals and respected by all wolf-blooded alike.' },
  { name: 'Berserker',         nights: '615 – 814 Nights',     desc: 'Rage and discipline fused — a force of nature unleashed when the pack calls for blood.' },
  { name: 'Fenrir',            nights: '815 – 1,014 Nights',   desc: 'Named for the great wolf of legend — their power echoes the fury of the ancient moon.' },
  { name: 'Ragnarok',          nights: '1,015 – 1,214 Nights', desc: 'The end bringer — a lycan who has survived long enough to see entire packs rise and fall.' },
  { name: 'Beast Dominus',     nights: '1,215 – 1,464 Nights', desc: 'Master of the beast — they command the primal fury within with absolute authority.' },
  { name: 'Night Tyrant',      nights: '1,465 – 1,714 Nights', desc: 'The dark ruler of the hunt — none challenge a Night Tyrant and walk away unchanged.' },
  { name: 'Lunar Emperor',     nights: '1,715 – 1,999 Nights', desc: 'Sovereign of the moon — their word is law beneath the open sky and closed council alike.' },
  { name: 'Moon Titan',        nights: '2,000 – 2,299 Nights', desc: 'A colossus of the pack — their presence alone can still a battlefield mid-charge.' },
  { name: 'Feral Overlord',    nights: '2,300 – 2,599 Nights', desc: 'Beyond civilisation — a primal force so ancient they predate the laws of the pack itself.' },
  { name: 'Primordial Beast',  nights: '2,600 – 2,899 Nights', desc: 'From the age before memory — a lycan who carries the original fire of the first change.' },
  { name: 'Soul Devourer',     nights: '2,900 – 3,249 Nights', desc: 'They consume not just flesh but spirit — the oldest of enemies fall silent in their shadow.' },
  { name: 'Abyssal Beast',     nights: '3,250 – 3,749 Nights', desc: 'From the deepest dark of the world — a creature of myth, spoken of only in the oldest pack scrolls.' },
  { name: 'God of the Hunt',   nights: '3,750+ Nights',        desc: 'The eternal apex — if the moon itself has a champion, this is what they would become.' },
];

export default function AgeGroupsPage() {
  const [race, setRace] = useState('vampire');
  const isLycan = race === 'lycan';
  const ages = isLycan ? lycanAges : vampireAges;

  return (
    <>
      <Head>
        <title>Age Groups — DawnDream</title>
        <meta name="description" content="The age groups of DawnDream — vampire and lycan alike." />
      </Head>
      <Navbar activePage="age-groups" />

        {/* ── Race switcher ── */}
        <div className={styles.raceBar}>
          <button
            className={`${styles.raceBtn} ${!isLycan ? styles.raceBtnVampActive : ''}`}
            onClick={() => setRace('vampire')}
          >
            <span className={styles.raceBtnLabel}>Vampire</span>
            <span className={styles.raceBtnSub}>Children of the Night</span>
          </button>
          <button
            className={`${styles.raceBtn} ${isLycan ? styles.raceBtnLycanActive : ''}`}
            onClick={() => setRace('lycan')}
          >
            <span className={`${styles.raceBtnLabel} ${styles.raceBtnLabelLycan}`}>Lycan</span>
            <span className={`${styles.raceBtnSub} ${styles.raceBtnSubLycan}`}>Children of the Moon</span>
          </button>
        </div>

        {/* ── Hero ── */}
        <section className={`${styles.hero} ${isLycan ? styles.heroLycan : ''}`}>
          <p className={styles.eyebrow}>{isLycan ? 'The Moon Ranks' : 'The Blood Ranks'}</p>
          <h1 className={styles.heroTitle}>{isLycan ? 'Lycan Age Groups' : 'Vampire Age Groups'}</h1>
          <p className={styles.heroSub}>
            {isLycan
              ? 'For the wolf-blooded, age is earned through trial, rank and the number of moons survived.'
              : 'Age among the undead is not counted in nights — it is measured in power, cunning and blood consumed.'}
          </p>
          <div className={`${styles.heroDivider} ${isLycan ? styles.heroDividerLycan : ''}`} />
        </section>

        {/* ── Strip ── */}
        <div className={`${styles.strip} ${isLycan ? styles.stripLycan : ''}`}>
          {isLycan
            ? '⚝ The wolf-blooded earn their rank through the fires of the hunt and the silence of the pack council.'
            : '✦ The older the blood, the more absolute the authority — age is the only currency that cannot be faked.'}
        </div>

        {/* ── Age cards ── */}
        <div className={styles.body}>
          <p className={`${styles.sectionHead} ${isLycan ? styles.sectionHeadLycan : ''}`}>
            {isLycan ? 'Lycan Rank Progression' : 'Vampire Rank Progression'}
          </p>
          <div className={styles.grid}>
            {ages.map((age, i) => (
              <div key={age.name} className={`${styles.card} ${isLycan ? styles.cardLycan : ''}`}>
                <div className={`${styles.cardAccent} ${isLycan ? styles.cardAccentLycan : ''}`} />
                <div className={`${styles.cardNum} ${isLycan ? styles.cardNumLycan : ''}`}>{String(i + 1).padStart(2, '0')}</div>
                <div className={`${styles.cardName} ${isLycan ? styles.cardNameLycan : ''}`}>{age.name}</div>
                <div className={`${styles.cardNights} ${isLycan ? styles.cardNightsLycan : ''}`}>{age.nights}</div>
                <div className={`${styles.cardDesc} ${isLycan ? styles.cardDescLycan : ''}`}>{age.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
        </footer>
    </>
  );
}
