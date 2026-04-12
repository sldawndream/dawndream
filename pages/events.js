import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import { getEvents } from '../lib/events';
import styles from '../styles/Events.module.css';

export async function getServerSideProps() {
  try {
    const events = await getEvents();
    return { props: { events } };
  } catch (err) {
    return { props: { events: [] } };
  }
}

const typeStyles = { Story: styles.typeStory, Social: styles.typeSocial, PVP: styles.typePvp, War: styles.typePvp, Other: styles.typeOther };

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

export default function EventsPage({ events }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }

  function getEventsForDay(day) {
    return events.filter(e => { if (!e.date) return false; const d = new Date(e.date + 'T00:00:00'); return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day; });
  }

  const upcomingEvents = events.filter(e => { if (!e.date) return true; return new Date(e.date + 'T00:00:00') >= new Date(today.toDateString()); });
  const pastEvents = events.filter(e => { if (!e.date) return false; return new Date(e.date + 'T00:00:00') < new Date(today.toDateString()); });

  return (
    <>
      <Head>
        <title>Events — DawnDream</title>
        <meta name="description" content="DawnDream events." />
      </Head>
      <Navbar activePage="events" />
      <AuthGuard>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>The Eternal Calendar</p>
          <h1 className={styles.heroTitle}>Events</h1>
          <p className={styles.heroSub}>Gatherings of the eternal — mark your night, attend your destiny.</p>
          <div className={styles.heroDivider} />
          <p className={styles.heroIntro}>From blood moon gatherings to clan wars and story nights — all DawnDream events are recorded here. Never miss a moment in the eternal night.</p>
        </section>
        <div className={styles.body}>
          <p className={styles.sectionHead}>{monthNames[calMonth]} {calYear}</p>
          <div className={styles.calWrap}>
            <div className={styles.calHeader}>
              <div className={styles.calMonth}>{monthNames[calMonth]} {calYear}</div>
              <div className={styles.calNav}>
                <button className={styles.calBtn} onClick={prevMonth}>‹ {monthNames[calMonth === 0 ? 11 : calMonth - 1]}</button>
                <button className={styles.calBtn} onClick={nextMonth}>{monthNames[calMonth === 11 ? 0 : calMonth + 1]} ›</button>
              </div>
            </div>
            <div className={styles.calGrid}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className={styles.calDow}>{d}</div>)}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className={`${styles.calDay} ${styles.empty}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                const dayEvents = getEventsForDay(day);
                return (
                  <div key={day} className={`${styles.calDay} ${isToday ? styles.today : ''}`}>
                    <div className={styles.dayNum}>{day}</div>
                    {dayEvents.map(e => <div key={e.id} className={`${styles.calEvent} ${e.eventType === 'Social' ? styles.calEventSocial : e.eventType === 'PVP' || e.eventType === 'War' ? styles.calEventPvp : ''}`}>{e.name}</div>)}
                  </div>
                );
              })}
            </div>
          </div>
          {upcomingEvents.length > 0 && (
            <>
              <p className={styles.sectionHead}>Upcoming Events</p>
              <div className={styles.eventsGrid}>
                {upcomingEvents.map(event => (
                  <div key={event.id} className={styles.eventCard}>
                    {event.bannerImage ? <img src={event.bannerImage} alt={event.name} className={styles.eventBanner} /> : <div className={styles.eventBannerPlaceholder}>Event Banner</div>}
                    <div className={styles.eventBody}>
                      <div className={styles.eventTop}>
                        <span className={styles.eventName}>{event.name}</span>
                        {event.eventType && <span className={`${styles.eventType} ${typeStyles[event.eventType] || styles.typeOther}`}>{event.eventType}</span>}
                      </div>
                      {event.date && <div className={styles.eventDate}><span className={styles.dateDot}></span>{formatDate(event.date)}{event.time ? ` — ${event.time}` : ''}</div>}
                      {event.description && <p className={styles.eventDesc}>{event.description}</p>}
                      {event.location && <div className={styles.eventLocation}><span className={styles.locIcon}></span>{event.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {pastEvents.length > 0 && (
            <>
              <p className={styles.sectionHead} style={{ marginTop: '40px' }}>Past Events</p>
              <div className={styles.eventsGrid}>
                {pastEvents.map(event => (
                  <div key={event.id} className={`${styles.eventCard} ${styles.pastCard}`}>
                    {event.bannerImage ? <img src={event.bannerImage} alt={event.name} className={`${styles.eventBanner} ${styles.pastBanner}`} /> : <div className={styles.eventBannerPlaceholder}>Event Banner</div>}
                    <div className={styles.eventBody}>
                      <div className={styles.eventTop}>
                        <span className={styles.eventName}>{event.name}</span>
                        <span className={styles.pastTag}>Past</span>
                      </div>
                      {event.date && <div className={styles.eventDate}><span className={styles.dateDot}></span>{formatDate(event.date)}{event.time ? ` — ${event.time}` : ''}</div>}
                      {event.description && <p className={styles.eventDesc}>{event.description}</p>}
                      {event.location && <div className={styles.eventLocation}><span className={styles.locIcon}></span>{event.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {events.length === 0 && <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No events yet.</p>}
        </div>
        <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream</footer>
      </AuthGuard>
    </>
  );
}
