import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.drop}></span>
        DAWNDREAM
      </div>
      <div className={styles.right}>Second Life RPG System</div>
    </header>
  );
}
