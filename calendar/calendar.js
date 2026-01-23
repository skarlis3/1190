// calendar.js — Calendar component with three views
// Reads calendar ID from data-calendar-id attribute on #calendarContainer
// Requires: Google Calendar API key set in CALENDAR_API_KEY variable below

const CALENDAR_API_KEY = 'AIzaSyAv4RBdi3zx-8hCIXBpzYLb7oT9XTUL6tY';

(() => {
  if (window.__CALENDAR_INITED__) return;
  window.__CALENDAR_INITED__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('calendarContainer');
    if (!container) {
      console.error('Calendar: No #calendarContainer found');
      return;
    }

    const calendarId = container.dataset.calendarId;
    if (!calendarId) {
      console.error('Calendar: No data-calendar-id attribute found');
      return;
    }

    // ===== State =====
    let allEvents = [];
    let selectedWeekStart = getWeekStart(new Date());
    let displayedMonth = new Date();
    let miniMonth = new Date();

    // ===== Constants =====
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const MAX_EVENTS_PER_DAY = 3;

    // ===== Utility Functions =====
    function getEventDate(event) {
      if (event.start.dateTime) {
        return new Date(event.start.dateTime);
      } else {
        const [year, month, day] = event.start.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
    }

    function isSameDay(d1, d2) {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    }

    function isToday(date) {
      return isSameDay(date, new Date());
    }

    function isPast(date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }

    function isDueEvent(event) {
      return event.summary && event.summary.toLowerCase().includes('due');
    }

    function getEventsForDay(date) {
      return allEvents.filter(event => isSameDay(getEventDate(event), date));
    }

    function getWeekStart(date) {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }

    function isInWeek(date, weekStart) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const start = new Date(weekStart);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      return d >= start && d <= end;
    }

    function getDaysFromNow(date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);
      return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    }

    function formatDate(date) {
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    }

    function formatDateFull(date) {
      return `${dayNamesFull[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    }

    // ===== API =====
    async function fetchEvents(timeMin, timeMax) {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.set('key', CALENDAR_API_KEY);
      url.searchParams.set('timeMin', timeMin.toISOString());
      url.searchParams.set('timeMax', timeMax.toISOString());
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('maxResults', '250');

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.items || [];
    }

    async function loadAllEvents() {
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 4);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 4);

      try {
        allEvents = await fetchEvents(timeMin, timeMax);
        renderWeeklyView();
        renderUpcomingView();
        renderMonthlyView();
      } catch (error) {
        console.error('Failed to load events:', error);
        const errorMsg = '<div class="calendar-error">Failed to load calendar. Please refresh.</div>';
        document.getElementById('weeklyView').innerHTML = errorMsg;
        document.getElementById('upcomingView').innerHTML = errorMsg;
        document.getElementById('monthlyView').innerHTML = errorMsg;
      }
    }

    // ===== WEEKLY VIEW =====
    function renderWeeklyView() {
      const weeklyContainer = document.getElementById('weeklyView');
      const year = miniMonth.getFullYear();
      const month = miniMonth.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startingDay = firstDay.getDay();
      const totalDays = lastDay.getDate();
      const prevMonthLast = new Date(year, month, 0).getDate();

      let miniHtml = `
        <div class="mini-month">
          <div class="mini-month-nav">
            <button class="mini-prev" aria-label="Previous month">←</button>
            <span class="mini-month-header">${monthNamesFull[month]} ${year}</span>
            <button class="mini-next" aria-label="Next month">→</button>
          </div>
          <div class="mini-month-grid">
      `;

      dayNames.forEach(d => {
        miniHtml += `<div class="mini-header">${d.charAt(0)}</div>`;
      });

      let dayCount = 1;
      let nextMonthDay = 1;

      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          const cellIndex = row * 7 + col;
          let dayNum, dateObj, otherMonth = false;

          if (cellIndex < startingDay) {
            dayNum = prevMonthLast - startingDay + cellIndex + 1;
            dateObj = new Date(year, month - 1, dayNum);
            otherMonth = true;
          } else if (dayCount <= totalDays) {
            dayNum = dayCount;
            dateObj = new Date(year, month, dayCount);
            dayCount++;
          } else {
            dayNum = nextMonthDay;
            dateObj = new Date(year, month + 1, nextMonthDay);
            nextMonthDay++;
            otherMonth = true;
          }

          const events = getEventsForDay(dateObj);
          const todayClass = isToday(dateObj) ? ' today' : '';
          const otherClass = otherMonth ? ' other-month' : '';
          const hasEventsClass = events.length ? ' has-events' : '';
          const inWeekClass = isInWeek(dateObj, selectedWeekStart) ? ' in-selected-week' : '';
          const dateStr = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;

          miniHtml += `<div class="mini-day${todayClass}${otherClass}${hasEventsClass}${inWeekClass}" data-date="${dateStr}">${dayNum}</div>`;
        }
      }

      miniHtml += '</div></div>';

      // Expanded week
      const weekEnd = new Date(selectedWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let weekHtml = `
        <div class="expanded-week">
          <div class="expanded-week-header">${formatDate(selectedWeekStart)} – ${formatDate(weekEnd)}</div>
          <div class="expanded-week-days">
      `;

      for (let i = 0; i < 7; i++) {
        const date = new Date(selectedWeekStart);
        date.setDate(selectedWeekStart.getDate() + i);

        const events = getEventsForDay(date);
        const todayClass = isToday(date) ? ' today' : '';
        const hasDue = events.some(isDueEvent) ? ' has-due' : '';

        let eventsHtml = '';
        if (events.length) {
          events.forEach(e => {
            const dueClass = isDueEvent(e) ? ' is-due' : '';
            eventsHtml += `<div class="event-chip${dueClass}" data-event-id="${e.id}">${e.summary}</div>`;
          });
        } else {
          eventsHtml = '<span class="no-events">—</span>';
        }

        weekHtml += `
          <div class="expanded-day${todayClass}${hasDue}">
            <div class="expanded-day-label">
              <div class="dow">${dayNames[date.getDay()]}</div>
              <div class="date">${formatDate(date)}</div>
            </div>
            <div class="expanded-day-events">${eventsHtml}</div>
          </div>
        `;
      }

      weekHtml += '</div></div>';

      weeklyContainer.innerHTML = miniHtml + weekHtml;

      // Event listeners
      weeklyContainer.querySelectorAll('.mini-day').forEach(day => {
        day.addEventListener('click', () => {
          const [y, m, d] = day.dataset.date.split('-').map(Number);
          const clickedDate = new Date(y, m, d);
          selectedWeekStart = getWeekStart(clickedDate);
          renderWeeklyView();
        });
      });

      weeklyContainer.querySelector('.mini-prev').addEventListener('click', () => {
        miniMonth.setMonth(miniMonth.getMonth() - 1);
        renderWeeklyView();
      });

      weeklyContainer.querySelector('.mini-next').addEventListener('click', () => {
        miniMonth.setMonth(miniMonth.getMonth() + 1);
        renderWeeklyView();
      });

      // Event listeners for event chips in expanded week
      weeklyContainer.querySelectorAll('.expanded-day .event-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const event = allEvents.find(ev => ev.id === chip.dataset.eventId);
          if (event) showEventPopup(event);
        });
      });
    }

    // ===== UPCOMING VIEW =====
    function renderUpcomingView() {
      const upcomingContainer = document.getElementById('upcomingView');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueEvents = allEvents
        .filter(e => isDueEvent(e) && getEventDate(e) >= today)
        .sort((a, b) => getEventDate(a) - getEventDate(b));

      if (!dueEvents.length) {
        upcomingContainer.innerHTML = '<div class="countdown-empty">No upcoming due dates found.</div>';
        return;
      }

      const urgent = [];
      const soon = [];
      const later = [];

      dueEvents.forEach(event => {
        const days = getDaysFromNow(getEventDate(event));
        if (days <= 2) urgent.push({ event, days });
        else if (days <= 7) soon.push({ event, days });
        else later.push({ event, days });
      });

      let html = '';

      if (urgent.length) {
        html += '<div class="countdown-section"><div class="countdown-section-title">Due Very Soon</div>';
        urgent.forEach(({ event, days }) => {
          const date = getEventDate(event);
          html += `
            <div class="countdown-card urgent" data-event-id="${event.id}">
              <div class="countdown-badge">${days}<small>${days === 1 ? 'day' : 'days'}</small></div>
              <div class="countdown-info">
                <div class="countdown-title">${event.summary}</div>
                <div class="countdown-date">${formatDateFull(date)}</div>
              </div>
            </div>
          `;
        });
        html += '</div>';
      }

      if (soon.length) {
        html += '<div class="countdown-section"><div class="countdown-section-title">This Week</div>';
        soon.forEach(({ event, days }) => {
          const date = getEventDate(event);
          html += `
            <div class="countdown-card soon" data-event-id="${event.id}">
              <div class="countdown-badge">${days}<small>days</small></div>
              <div class="countdown-info">
                <div class="countdown-title">${event.summary}</div>
                <div class="countdown-date">${formatDateFull(date)}</div>
              </div>
            </div>
          `;
        });
        html += '</div>';
      }

      if (later.length) {
        html += '<div class="countdown-section"><div class="countdown-section-title">On the Horizon</div>';
        later.slice(0, 8).forEach(({ event, days }) => {
          const date = getEventDate(event);
          html += `
            <div class="countdown-card later" data-event-id="${event.id}">
              <div class="countdown-badge">${days}<small>days</small></div>
              <div class="countdown-info">
                <div class="countdown-title">${event.summary}</div>
                <div class="countdown-date">${formatDateFull(date)}</div>
              </div>
            </div>
          `;
        });
        html += '</div>';
      }

      upcomingContainer.innerHTML = html;

      // Add click handlers for countdown cards
      upcomingContainer.querySelectorAll('.countdown-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          const event = allEvents.find(e => e.id === card.dataset.eventId);
          if (event) showEventPopup(event);
        });
      });
    }

    // ===== MONTHLY VIEW =====
    function renderMonthlyView() {
      const monthlyContainer = document.getElementById('monthlyView');
      const year = displayedMonth.getFullYear();
      const month = displayedMonth.getMonth();

      document.querySelector('.current-month').textContent = `${monthNamesFull[month]} ${year}`;

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startingDay = firstDay.getDay();
      const totalDays = lastDay.getDate();
      const prevMonthLast = new Date(year, month, 0).getDate();

      let html = '';

      dayNames.forEach(d => {
        html += `<div class="day-header">${d}</div>`;
      });

      let dayCount = 1;
      let nextMonthDay = 1;

      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          const cellIndex = row * 7 + col;
          let dayNum, dateObj, otherMonth = false;

          if (cellIndex < startingDay) {
            dayNum = prevMonthLast - startingDay + cellIndex + 1;
            dateObj = new Date(year, month - 1, dayNum);
            otherMonth = true;
          } else if (dayCount <= totalDays) {
            dayNum = dayCount;
            dateObj = new Date(year, month, dayCount);
            dayCount++;
          } else {
            dayNum = nextMonthDay;
            dateObj = new Date(year, month + 1, nextMonthDay);
            nextMonthDay++;
            otherMonth = true;
          }

          const events = getEventsForDay(dateObj);
          const todayClass = isToday(dateObj) ? ' today' : '';
          const otherClass = otherMonth ? ' other-month' : '';

          let eventsHtml = '';

          events.slice(0, MAX_EVENTS_PER_DAY).forEach(e => {
            const dueClass = isDueEvent(e) ? ' is-due' : '';
            eventsHtml += `<div class="event-chip${dueClass}" data-event-id="${e.id}">${e.summary}</div>`;
          });

          if (events.length > MAX_EVENTS_PER_DAY) {
            const remaining = events.length - MAX_EVENTS_PER_DAY;
            const dateStr = dateObj.toISOString().split('T')[0];
            eventsHtml += `<div class="more-events" data-date="${dateStr}">+${remaining} more</div>`;
          }

          html += `
            <div class="day-cell${todayClass}${otherClass}">
              <div class="day-number">${dayNum}</div>
              <div class="day-events">${eventsHtml}</div>
            </div>
          `;
        }
      }

      monthlyContainer.innerHTML = html;

      // Event listeners for +more
      monthlyContainer.querySelectorAll('.more-events').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          showDayPopup(btn.dataset.date);
        });
      });

      // Event listeners for individual event chips
      monthlyContainer.querySelectorAll('.event-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const event = allEvents.find(ev => ev.id === chip.dataset.eventId);
          if (event) showEventPopup(event);
        });
      });
    }

    // ===== Popup =====
    function showDayPopup(dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const events = getEventsForDay(date);

      document.getElementById('dayPopupTitle').textContent = formatDateFull(date);

      let html = '';
      events.forEach(e => {
        const dueClass = isDueEvent(e) ? ' is-due' : '';
        html += `<div class="event-chip${dueClass}" data-event-id="${e.id}">${e.summary}</div>`;
      });
      document.getElementById('dayPopupEvents').innerHTML = html;

      // Add click listeners to event chips in popup
      document.getElementById('dayPopupEvents').querySelectorAll('.event-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const event = allEvents.find(e => e.id === chip.dataset.eventId);
          if (event) {
            closePopup();
            showEventPopup(event);
          }
        });
      });

      document.getElementById('dayPopup').classList.add('active');
      document.getElementById('popupBackdrop').classList.add('active');
    }

    function showEventPopup(event) {
      document.getElementById('eventPopupTitle').textContent = event.summary;
      
      const date = getEventDate(event);
      const timeStr = event.start.dateTime 
        ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'All day';
      document.getElementById('eventPopupTime').textContent = `${formatDateFull(date)} · ${timeStr}`;
      
      document.getElementById('eventPopupDescription').innerHTML = event.description || '<em>No description</em>';
      
      document.getElementById('eventPopup').classList.add('active');
      document.getElementById('eventPopupBackdrop').classList.add('active');
    }

    function closePopup() {
      document.getElementById('dayPopup').classList.remove('active');
      document.getElementById('popupBackdrop').classList.remove('active');
    }

    function closeEventPopup() {
      document.getElementById('eventPopup').classList.remove('active');
      document.getElementById('eventPopupBackdrop').classList.remove('active');
    }

    // ===== Tab Switching =====
    document.querySelectorAll('.calendar-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.calendar-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
      });
    });

    // ===== Month Navigation =====
    document.querySelector('.prev-month-btn').addEventListener('click', () => {
      displayedMonth.setMonth(displayedMonth.getMonth() - 1);
      renderMonthlyView();
    });

    document.querySelector('.next-month-btn').addEventListener('click', () => {
      displayedMonth.setMonth(displayedMonth.getMonth() + 1);
      renderMonthlyView();
    });

    document.querySelector('.today-btn').addEventListener('click', () => {
      displayedMonth = new Date();
      renderMonthlyView();
    });

    // ===== Popup Close =====
    document.getElementById('popupBackdrop').addEventListener('click', closePopup);
    document.querySelector('#dayPopup .popup-close').addEventListener('click', closePopup);
    
    document.getElementById('eventPopupBackdrop').addEventListener('click', closeEventPopup);
    document.querySelector('#eventPopup .popup-close').addEventListener('click', closeEventPopup);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePopup();
        closeEventPopup();
      }
    });

    // ===== Initialize =====
    loadAllEvents();
  });
})();
