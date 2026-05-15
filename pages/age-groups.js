import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import styles from '../styles/AgeGroups.module.css';

const vampireAges = [
  { name: 'Fledgling',     nights: '0 – 25 Nights',        desc: 'Newly turned — still learning to master the hunger and the dark gifts of their blood.' },
  { name: 'Neonate',       nights: '26 – 100 Nights',       desc: 'Beginning to find their place in the hierarchy — respected, but still proving their worth.' },
  { name: 'Ancilla',       nights: '101 – 300 Nights',      desc: 'Seasoned and politically aware — they have survived long enough to be trusted with real power.' },
  { name: 'Elder',         nights: '301 – 999 Nights',      desc: 'Ancient by mortal standards — their presence alone commands deference from younger kindred.' },
  { name: 'Methuselah',    nights: '1,000 – 2,000 Nights',  desc: 'Legends walking — few have ever met one and fewer still have survived the encounter.' },
  { name: 'Antediluvian',  nights: '2,000+ Nights',         desc: 'Before the flood, before the covenant — these are the first ones, and they do not forget.' },
];

const lycanAges = [
  { name: 'Cub',     nights: '0 – 2 Nights',    desc: 'Newly changed — still overwhelmed by the first shift, learning to control the beast within.' },
  { name: 'Cliath',  nights: '3 – 10 Nights',   desc: 'Has survived their first rite — a true pack member, trusted to run with the others.' },
  { name: 'Fostern', nights: '11 – 30 Nights',  desc: 'A proven warrior and packmate — beginning to take on leadership responsibilities.' },
  { name: 'Adren',   nights: '31 – 80 Nights',  desc: 'A respected elder of the pack — their word carries weight in council and in battle.' },
  { name: 'Athro',   nights: '81 – 200 Nights', desc: 'Near-legendary status — a keeper of the Pack Law and a guide to younger wolf-blooded.' },
  { name: 'Elder',   nights: '200+ Nights',      desc: 'The oldest of the moon-born — their howl alone can silence a battlefield.' },
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
      <AuthGuard>

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
      </AuthGuard>
    </>
  );
}
