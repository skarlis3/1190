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
    let weekWindowStart = null;   // set in Initialize, once WEEK_START_DOW exists
    let displayedMonth = new Date();

    // ===== Constants =====
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const MAX_EVENTS_PER_DAY = 3;
    const WEEKS_SHOWN = 3;
    const WEEK_START_DOW = 1;   // Monday, so Sunday deadlines close the week they belong to

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
      d.setDate(d.getDate() - ((d.getDay() - WEEK_START_DOW + 7) % 7));
      d.setHours(0, 0, 0, 0);
      return d;
    }

    function addDays(date, n) {
      const d = new Date(date);
      d.setDate(d.getDate() + n);
      return d;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // Event types drive the colour coding in the three-week view. Deliberately
    // stricter than isDueEvent() below, which the Upcoming tab still uses.
    function eventKind(event) {
      const t = event.summary || '';
      if (/no class/i.test(t)) return 'off';
      if (/^\s*readings?\s+due/i.test(t)) return 'read';
      if (/^\s*due:/i.test(t)) return 'due';
      if (/^\s*online:/i.test(t)) return 'async';
      return 'class';
    }

    const KIND_LABEL = { due: 'Due', read: 'Reading', async: 'Online', off: '', class: '' };

    // The kind label carries the prefix, so strip it from the title itself.
    function cleanSummary(event, kind) {
      const t = event.summary || '';
      if (kind === 'due') return t.replace(/^\s*due:\s*/i, '');
      if (kind === 'read') return t.replace(/^\s*readings?\s+due(\s*\([^)]*\))?:\s*/i, '');
      if (kind === 'async') return t.replace(/^\s*online:\s*/i, '');
      return t;
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

    // ===== WEEKLY VIEW: three weeks, empty weekdays squeezed =====
    function weekRangeLabel(start) {
      const end = addDays(start, 6);
      return start.getMonth() === end.getMonth()
        ? `${formatDate(start)} \u2013 ${end.getDate()}`
        : `${formatDate(start)} \u2013 ${formatDate(end)}`;
    }

    function renderWeeklyView() {
      const weeklyContainer = document.getElementById('weeklyView');

      const weekStarts = [];
      for (let w = 0; w < WEEKS_SHOWN; w++) weekStarts.push(addDays(weekWindowStart, w * 7));

      // A weekday earns a full column if it carries anything in ANY visible week.
      // Every other weekday still renders, squeezed -- never dropped.
      const active = new Set();
      weekStarts.forEach(ws => {
        for (let i = 0; i < 7; i++) {
          if (getEventsForDay(addDays(ws, i)).length) active.add(i);
        }
      });

      const template = [];
      let headRow = '';
      for (let i = 0; i < 7; i++) {
        const ghost = !active.has(i);
        template.push(ghost ? 'var(--cal-ghost-w)' : 'minmax(0, 1fr)');
        headRow += `<div class="wk-head${ghost ? ' is-ghost' : ''}">${dayNames[(WEEK_START_DOW + i) % 7]}</div>`;
      }

      const currentWeek = getWeekStart(new Date());
      let bodyHtml = '';

      weekStarts.forEach(ws => {
        bodyHtml += `<div class="wk-weeklabel">${weekRangeLabel(ws)}` +
          (isSameDay(ws, currentWeek) ? '<span class="wk-now">This week</span>' : '') + '</div>';

        // Day names repeat per week so they stay next to the events they label.
        bodyHtml += headRow;

        for (let i = 0; i < 7; i++) {
          const day = addDays(ws, i);

          if (!active.has(i)) {
            bodyHtml += `<div class="wk-ghost"><span class="wk-ghost-date">${day.getDate()}</span></div>`;
            continue;
          }

          const events = getEventsForDay(day);
          let eventsHtml = '';
          events.forEach(e => {
            const kind = eventKind(e);
            const label = KIND_LABEL[kind];
            const inner = (label ? `<span class="wk-event-kind">${label}</span>` : '') +
              escapeHtml(cleanSummary(e, kind));
            // A real <button>, so the keyboard can reach it. These used to be
            // plain <div>s with a click handler, which Tab skips entirely —
            // there was no way to open one without a mouse.
            // "No class" is the exception and stays a plain block: it is styled
            // as non-clickable (cursor: default) while still being wired up, and
            // which of those two is right is Sarah's call, not a markup fix.
            eventsHtml += kind === 'off'
              ? `<div class="wk-event is-off" data-event-id="${e.id}">${inner}</div>`
              : `<button type="button" class="wk-event is-${kind}" data-event-id="${e.id}">${inner}</button>`;
          });
          if (!events.length) eventsHtml = '<span class="wk-none">\u2014</span>';

          bodyHtml += `<div class="wk-cell${isToday(day) ? ' is-today' : ''}">` +
            `<span class="wk-date">${day.getDate()}</span>${eventsHtml}</div>`;
        }
      });

      const windowEnd = addDays(weekWindowStart, WEEKS_SHOWN * 7 - 1);
      weeklyContainer.innerHTML =
        '<div class="week-controls">' +
          '<button class="prev-week-btn" aria-label="Previous week">\u2190</button>' +
          `<span class="week-range">${formatDate(weekWindowStart)} \u2013 ${formatDate(windowEnd)}</span>` +
          '<button class="next-week-btn" aria-label="Next week">\u2192</button>' +
          '<button class="wk-today-btn">Today</button>' +
        '</div>' +
        `<div class="week-grid" style="grid-template-columns:${template.join(' ')}">${bodyHtml}</div>`;

      // Arrows step one week, which is what they always looked like they did.
      weeklyContainer.querySelector('.prev-week-btn').addEventListener('click', () => {
        weekWindowStart = addDays(weekWindowStart, -7);
        renderWeeklyView();
      });

      weeklyContainer.querySelector('.next-week-btn').addEventListener('click', () => {
        weekWindowStart = addDays(weekWindowStart, 7);
        renderWeeklyView();
      });

      weeklyContainer.querySelector('.wk-today-btn').addEventListener('click', () => {
        weekWindowStart = getWeekStart(new Date());
        renderWeeklyView();
      });

      weeklyContainer.querySelectorAll('.wk-event').forEach(chip => {
        chip.addEventListener('click', () => {
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
            <button type="button" class="countdown-card urgent" data-event-id="${event.id}">
              <span class="countdown-badge">${days}<small>${days === 1 ? 'day' : 'days'}</small></span>
              <span class="countdown-info">
                <span class="countdown-title">${escapeHtml(event.summary)}</span>
                <span class="countdown-date">${formatDateFull(date)}</span>
              </span>
            </button>
          `;
        });
        html += '</div>';
      }

      if (soon.length) {
        html += '<div class="countdown-section"><div class="countdown-section-title">This Week</div>';
        soon.forEach(({ event, days }) => {
          const date = getEventDate(event);
          html += `
            <button type="button" class="countdown-card soon" data-event-id="${event.id}">
              <span class="countdown-badge">${days}<small>days</small></span>
              <span class="countdown-info">
                <span class="countdown-title">${escapeHtml(event.summary)}</span>
                <span class="countdown-date">${formatDateFull(date)}</span>
              </span>
            </button>
          `;
        });
        html += '</div>';
      }

      if (later.length) {
        html += '<div class="countdown-section"><div class="countdown-section-title">On the Horizon</div>';
        later.slice(0, 8).forEach(({ event, days }) => {
          const date = getEventDate(event);
          html += `
            <button type="button" class="countdown-card later" data-event-id="${event.id}">
              <span class="countdown-badge">${days}<small>days</small></span>
              <span class="countdown-info">
                <span class="countdown-title">${escapeHtml(event.summary)}</span>
                <span class="countdown-date">${formatDateFull(date)}</span>
              </span>
            </button>
          `;
        });
        html += '</div>';
      }

      upcomingContainer.innerHTML = html;

      // Add click handlers for countdown cards
      upcomingContainer.querySelectorAll('.countdown-card').forEach(card => {
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
            eventsHtml += `<button type="button" class="event-chip${dueClass}" data-event-id="${e.id}">${escapeHtml(e.summary)}</button>`;
          });

          if (events.length > MAX_EVENTS_PER_DAY) {
            const remaining = events.length - MAX_EVENTS_PER_DAY;
            const dateStr = dateObj.toISOString().split('T')[0];
            eventsHtml += `<button type="button" class="more-events" data-date="${dateStr}">+${remaining} more</button>`;
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

    // ===== Dialogs =====
    // showModal() is what makes these usable without a mouse: the browser moves
    // focus into the dialog, keeps Tab inside it, closes on Escape, and makes
    // the page behind it inert. Previously these were divs toggled with a class,
    // so focus stayed on the page underneath and Tab walked through the content
    // behind the open dialog.
    //
    // A <dialog> normally restores focus to whatever opened it, but here the
    // opener is often a card that gets destroyed when the view re-renders, so
    // the opener is remembered and focus is put back by hand — falling back to
    // the calendar container if that card no longer exists.
    let dialogOpener = null;

    function openDialog(dialog) {
      const active = document.activeElement;
      // Only remember an opener that lives out on the page. Clicking a chip
      // inside the day dialog opens the event dialog, and in that case the
      // thing to come back to is the "+N more" button that started it all,
      // not the chip — which is about to be hidden inside a closed dialog.
      if (active && active !== document.body && !active.closest('.day-popup')) {
        dialogOpener = active;
      }
      dialog.showModal();
    }

    // A remembered opener is only usable if it is still on the page AND not
    // sitting inside a dialog that has since closed — a hidden element cannot
    // take focus, and focus would silently fall back to nowhere.
    function focusableOpener() {
      return dialogOpener &&
        document.contains(dialogOpener) &&
        !dialogOpener.closest('dialog:not([open])')
        ? dialogOpener
        : container;
    }

    // Closing is all this does. Putting focus back is handled by the dialog's
    // own 'close' event, so it happens however the dialog was shut — Escape,
    // the close button, or a click outside it.
    function closeDialog(dialog) {
      if (dialog.open) dialog.close();
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
        html += `<button type="button" class="event-chip${dueClass}" data-event-id="${e.id}">${escapeHtml(e.summary)}</button>`;
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

      openDialog(document.getElementById('dayPopup'));
    }

    function showEventPopup(event) {
      document.getElementById('eventPopupTitle').textContent = event.summary;

      const date = getEventDate(event);
      const timeStr = event.start.dateTime
        ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'All day';
      document.getElementById('eventPopupTime').textContent = `${formatDateFull(date)} · ${timeStr}`;

      document.getElementById('eventPopupDescription').innerHTML = event.description || '<em>No description</em>';

      openDialog(document.getElementById('eventPopup'));
    }

    function closePopup() {
      closeDialog(document.getElementById('dayPopup'));
    }

    function closeEventPopup() {
      closeDialog(document.getElementById('eventPopup'));
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

    // ===== Dialog Close =====
    // Escape is handled by the browser now, so there is no keydown listener.
    // A dialog fires 'close' however it was shut, which is the one place focus
    // needs handing back — that covers Escape as well as the buttons below.
    document.querySelectorAll('.day-popup').forEach(dialog => {
      dialog.querySelector('.popup-close').addEventListener('click', () => dialog.close());

      // Clicking the dimmed area outside the dialog closes it. On a <dialog>
      // that click lands on the dialog element itself rather than its contents.
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });

      dialog.addEventListener('close', () => {
        // One dialog can close because another is opening. Only hand focus
        // back once none of them are open.
        if (document.querySelector('.day-popup[open]')) return;
        const target = focusableOpener();
        dialogOpener = null;
        if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
      });
    });

    // ===== Initialize =====
    // Focus falls back to the calendar itself when the card a dialog was opened
    // from has since been re-rendered away. A plain div cannot take focus, so
    // it needs tabindex="-1" — which makes it focusable by script only, never a
    // Tab stop.
    container.setAttribute('tabindex', '-1');

    weekWindowStart = getWeekStart(new Date());
    loadAllEvents();
  });
})();
