// ===========================
// ORGANIZO - FULL FUNCTIONAL APP v2.0
// + Streak System, Daily Completion %, Weekly Report,
//   Routine Templates, OrganizO Pro Framework
// ===========================

class OrganizOApp {
    constructor() {
        this.currentView = 'dashboard';
        this.tasks = this.loadData('tasks') || [];
        this.habits = this.loadData('habits') || this.getDefaultHabits();
        this.events = this.loadData('events') || [];
        this.holidays = this.getHolidays();
        this.focusTime = this.loadData('focusTime') || { total: 0, sessions: [] };
        this.dailyIntention = this.loadData('dailyIntention') || '';
        this.userData = this.loadData('userData') || { name: '', initials: '', email: '' };
        // Streak system
        this.streakData = this.loadData('streakData') || { currentStreak: 0, bestStreak: 0, lastActiveDate: null, history: [] };
        // OrganizO Pro
        this.isPro = true; // Path 2 Growth Strategy: Pro is free for early adopters
        this.theme = this.loadData('theme') || 'bamboo';
        this.isDarkMode = this.loadData('isDarkMode') || false;
        this.notes = this.loadData('notes') || '';
        this.notesFont = this.loadData('notesFont') || 'Playfair Display'; // Default serif for aesthetic
        const rawCardMode = this.loadData('notesCardMode');
        this.notesCardMode = rawCardMode !== null ? rawCardMode : true;

        this.timer = {
            minutes: 25,
            seconds: 0,
            isRunning: false,
            interval: null,
            mode: 'focus'
        };
        this.selectedSound = 'lofi'; // default sound
        this.focusTaskId = null; // target task for focus session
        this.calendarDate = new Date();

        this.renderDashboard();
        this.applyTheme();
        this.updateUserUI();
        this.setupEventListeners();
        this.init();
    }

    init() {
        this.updateGreeting();
        this.updateDate();
        this.checkOnboarding();
        this.setupHotkeys();
        this.updateDailyStreak(); // Track daily login streak
        this.setupEndOfDayReminder(); // Remind about remaining tasks
        this.setupOnlineOfflineBanner(); // Offline/online notification
        this.setupFAB(); // Floating action button
        // Re-schedule any deadline notifications for existing tasks
        if ('Notification' in window && Notification.permission === 'granted') {
            this.tasks.filter(t => !t.completed && t.dueDate).forEach(t => this.scheduleDeadlineNotification(t));
        }
    }

    setupFAB() {
        const fab = document.getElementById('fab-add-task');
        if (!fab) return;
        // Show FAB only on mobile (< 768px)
        const updateFab = () => {
            fab.style.display = window.innerWidth < 768 ? 'flex' : 'none';
        };
        updateFab();
        window.addEventListener('resize', updateFab);
    }

    checkOnboarding() {
        const hasSeenOnboarding = localStorage.getItem('organizo_onboarding_seen');
        // Show onboarding if never seen OR if user still has no name
        if (!hasSeenOnboarding || !this.userData.name) {
            setTimeout(() => this.showOnboardingModal(), 400);
        }
    }

    showOnboardingModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 480px; text-align: center; padding: 2.5rem; border-radius: 28px; animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);">
                <div style="font-size: 3.5rem; margin-bottom: 1rem; animation: pulse 2s infinite;">🌿</div>
                <h2 style="margin-bottom: 0.25rem; color: var(--text-dark); font-family: 'Playfair Display', serif;">Welcome to OrganizO</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem; line-height: 1.7; font-size: 0.95rem;">
                    Your calm digital sanctuary for gentle, focused productivity. Let's personalize your space.
                </p>

                <div style="text-align: left; margin-bottom: 1.25rem;">
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 6px;">Your Name *</label>
                    <input type="text" id="onboarding-name" placeholder="e.g. Shrishti" class="input-field" autocomplete="name"
                        style="width: 100%; padding: 14px 16px; border: 2px solid var(--accent-green); border-radius: 12px; font-size: 1rem; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box; outline: none; transition: box-shadow 0.3s;"
                        onfocus="this.style.boxShadow='0 0 0 4px rgba(16,185,129,0.15)'" onblur="this.style.boxShadow='none'">
                </div>

                <div style="text-align: left; margin-bottom: 2rem;">
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 6px;">Gmail Address (optional)</label>
                    <input type="email" id="onboarding-email" placeholder="e.g. you@gmail.com" class="input-field" autocomplete="email"
                        style="width: 100%; padding: 14px 16px; border: 1.5px solid var(--border-color); border-radius: 12px; font-size: 1rem; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box; outline: none; transition: all 0.3s;"
                        onfocus="this.style.borderColor='var(--accent-green)'; this.style.boxShadow='0 0 0 4px rgba(16,185,129,0.1)'" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none'">
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; line-height: 1.5;">🔒 Stored only on your device. Never shared.</p>
                </div>

                <button class="btn-focus" id="onboarding-start-btn" style="width: 100%; padding: 15px; font-size: 1rem; border-radius: 14px; margin-bottom: 1rem;">
                    Begin My Sanctuary 🌿
                </button>
                <button id="onboarding-skip-btn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem;">
                    Skip for now
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        const nameInput = modal.querySelector('#onboarding-name');
        setTimeout(() => nameInput.focus(), 300);

        const saveAndClose = () => {
            const name = nameInput.value.trim();
            const email = modal.querySelector('#onboarding-email').value.trim();
            if (!name) {
                nameInput.style.borderColor = '#EF4444';
                nameInput.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.15)';
                nameInput.placeholder = 'Please enter your name...';
                nameInput.focus();
                return;
            }
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            this.userData = { name, initials, email };
            this.saveData('userData', this.userData);
            localStorage.setItem('organizo_onboarding_seen', 'true');
            this.updateUserUI();
            this.renderDashboard();
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s';
            setTimeout(() => modal.remove(), 300);
            this.showToast(`Welcome aboard, ${name}! 🌿`);
        };

        const skipAndClose = () => {
            localStorage.setItem('organizo_onboarding_seen', 'true');
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s';
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('#onboarding-start-btn').addEventListener('click', saveAndClose);
        modal.querySelector('#onboarding-skip-btn').addEventListener('click', skipAndClose);
        nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveAndClose(); });
    }

    // Security: Sanitize user input to prevent XSS
    sanitize(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Data Management
    saveData(key, data) {
        try {
            localStorage.setItem(`organizo_${key}`, JSON.stringify(data));
        } catch (e) {
            console.warn('OrganizO: Could not save data -', e.message);
        }
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(`organizo_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('OrganizO: Corrupted data for key', key, '- resetting.');
            localStorage.removeItem(`organizo_${key}`);
            return null;
        }
    }

    getDefaultHabits() {
        return [
            { id: 1, name: 'Morning Meditation', streak: 0, completedToday: false, history: [] },
            { id: 2, name: 'Deep Work Blocks', streak: 0, completedToday: false, history: [] }
        ];
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation (Sidebar & Mobile Nav)
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                if (view) this.switchView(view);
            });
        });

        // Task Management
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-task-btn')) {
                this.showAddTaskModal();
            }
            if (e.target.closest('.checkbox')) {
                const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                this.toggleTask(taskId);
            }
            if (e.target.closest('.delete-task')) {
                const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                this.deleteTask(taskId);
            }
        });

        // Timer Controls
        document.addEventListener('click', (e) => {
            const startBtn = e.target.closest('.start-timer-btn');
            if (startBtn) {
                if (this.timer.isRunning) {
                    this.pauseTimer();
                } else {
                    this.startTimer();
                }
            }
            if (e.target.closest('.pause-timer-btn')) {
                this.pauseTimer();
            }
            if (e.target.closest('.reset-timer-btn')) {
                this.resetTimer();
            }
        });

        // Intention
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-intention-btn') || e.target.closest('#intention-display')) {
                this.editIntention();
            }
            if (e.target.closest('.save-intention-btn')) {
                this.saveIntention();
            }
            if (e.target.closest('.random-affirmation-btn')) {
                this.generateAffirmation();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.getElementById('intention-input')) {
                this.saveIntention();
            }
        });

        // Habits
        document.addEventListener('click', (e) => {
            if (e.target.closest('.habit-check')) {
                const habitId = parseInt(e.target.closest('.habit-item').dataset.habitId);
                this.toggleHabit(habitId);
            }
        });

        // Calendar Navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.prev-month')) {
                this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
                this.renderCalendarView();
            }
            if (e.target.closest('.next-month')) {
                this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
                this.renderCalendarView();
            }
        });

        // Calendar Day Click
        document.addEventListener('click', (e) => {
            const dayCard = e.target.closest('.calendar-day-card');
            if (dayCard && !e.target.closest('.delete-event') && !dayCard.classList.contains('empty-day')) {
                const dateStr = dayCard.dataset.date;
                this.showAddEventModal(dateStr);
            }
            if (e.target.closest('.delete-event')) {
                const eventId = parseInt(e.target.closest('.delete-event').dataset.eventId);
                this.deleteEvent(eventId);
            }
            if (e.target.closest('.today-btn')) {
                this.calendarDate = new Date();
                this.renderCalendarView();
            }
            if (e.target.closest('.modal-task-toggle')) {
                const taskId = parseInt(e.target.closest('.modal-task-toggle').dataset.taskId);
                this.toggleTask(taskId);
                // Refresh modal to show completion
                const modal = e.target.closest('.modal-overlay');
                const dateStr = modal.querySelector('h3').textContent.replace('Plan for ', '');
                modal.remove();
                this.showAddEventModal(dateStr);
            }
        });
    }

    // View Management
    switchView(view) {
        this.currentView = view;
        // Reset both desktop & mobile navs
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        // Set active on matching view
        document.querySelectorAll(`[data-view="${view}"]`).forEach(link => {
            link.classList.add('active');
        });

        const mainContent = document.querySelector('.main-content');
        
        // Reset dynamic background if not in timer
        if (view !== 'timer' && mainContent) {
            mainContent.style.backgroundImage = '';
            mainContent.style.backgroundSize = '';
            mainContent.style.backgroundPosition = '';
        }
        
        // Handle FAB visibility - only show on TASKS view (mobile only handled by setupFAB)
        const fab = document.getElementById('fab-add-task');
        if (fab) {
            fab.style.display = (view === 'tasks' && window.innerWidth < 768) ? 'flex' : 'none';
        }

        switch (view) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'tasks':
                this.renderTasksView();
                break;
            case 'timer':
                this.renderTimerView();
                break;
            case 'calendar':
                this.renderCalendarView();
                break;
            case 'insights':
                this.renderInsightsView();
                break;
            case 'templates':
                if (this.isPro) {
                    this.renderTemplatesView();
                } else {
                    this.showProModal();
                    this.renderDashboard(); // Fallback
                }
                break;
            case 'notes':
                this.renderNotesView();
                break;
        }
    }

    // ─── STREAK SYSTEM ───────────────────────────────────────────
    updateDailyStreak() {
        const today = new Date().toDateString();
        const last = this.streakData.lastActiveDate;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (last === today) return; // Already logged in today

        if (last === yesterdayStr) {
            // Consecutive day → extend streak
            this.streakData.currentStreak++;
        } else if (last !== today) {
            // Missed a day or first time → reset
            this.streakData.currentStreak = 1;
        }

        // Update best streak
        if (this.streakData.currentStreak > this.streakData.bestStreak) {
            this.streakData.bestStreak = this.streakData.currentStreak;
        }

        this.streakData.lastActiveDate = today;
        if (!this.streakData.history.includes(today)) {
            this.streakData.history.push(today);
            if (this.streakData.history.length > 60) this.streakData.history.shift(); // keep last 60 days
        }
        this.saveData('streakData', this.streakData);
    }

    getStreakEmoji(streak) {
        if (streak === 0) return '🌱';
        if (streak < 3) return '🔥';
        if (streak < 7) return '⚡';
        if (streak < 14) return '💎';
        if (streak < 30) return '🏆';
        return '👑';
    }

    renderStreakMiniCard() {
        const { currentStreak, bestStreak } = this.streakData;
        return `
            <div class="card streak-card" style="background: var(--streak-bg); color: var(--streak-text); cursor: pointer;" onclick="window.organizoApp.showStreakModal()">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; opacity: 0.8; text-transform: uppercase;">Day Streak</div>
                        <div style="font-size: 2.2rem; font-weight: 800; line-height: 1.1; margin-top: 4px;">${this.getStreakEmoji(currentStreak)} ${currentStreak}</div>
                        <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">Best: ${bestStreak} days</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.7rem; opacity: 0.7;">Last 7 days</div>
                        <div style="display: flex; gap: 4px; margin-top: 6px;">
                            ${this.renderStreakDots()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStreakDots() {
        const dots = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dStr = d.toDateString();
            const active = this.streakData.history.includes(dStr);
            dots.push(`<div style="width: 10px; height: 10px; border-radius: 50%; background: ${active ? 'var(--streak-text)' : 'var(--streak-pill)'};"></div>`);
        }
        return dots.join('');
    }

    showStreakModal() {
        const { currentStreak, bestStreak, history } = this.streakData;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 420px; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 0.5rem;">${this.getStreakEmoji(currentStreak)}</div>
                <h2 style="margin-bottom: 0.5rem;">${currentStreak} Day Streak!</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">You're on a roll. Keep showing up, gently.</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: var(--streak-pill); border-radius: 12px; padding: 1rem;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">CURRENT</div>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-green);">${currentStreak}</div>
                    </div>
                    <div style="background: var(--streak-pill); border-radius: 12px; padding: 1rem;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">BEST</div>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-green);">${bestStreak}</div>
                    </div>
                </div>
                <div style="text-align: left; margin-bottom: 2rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 0.75rem;">STREAK MILESTONES</div>
                    ${[3, 7, 14, 30, 60].map(n => `
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 1.2rem;">${currentStreak >= n ? '✅' : '⬜'}</span>
                            <span style="color: ${currentStreak >= n ? 'var(--accent-green)' : 'var(--text-muted)'}; font-size: 0.9rem;">${n} day streak ${currentStreak >= n ? '— Achieved!' : ''}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-focus" onclick="this.closest('.modal-overlay').remove()" style="width: 100%;">Keep Going 🌿</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    }

    // ─── DAILY COMPLETION % ──────────────────────────────────────
    getDailyCompletion() {
        const activeTasks = this.tasks.filter(t => !t.completed);
        const completedToday = this.tasks.filter(t => t.completed && t.completedAt && this.isToday(t.completedAt));

        const relevantTasks = [...activeTasks, ...completedToday];

        if (relevantTasks.length === 0) return { pct: 0, done: 0, total: 0 };
        const done = completedToday.length;
        return { pct: Math.round((done / relevantTasks.length) * 100), done, total: relevantTasks.length };
    }

    renderCompletionRing(pct) {
        const r = 28, c = 2 * Math.PI * r;
        const filled = (pct / 100) * c;
        const color = pct >= 80 ? 'var(--accent-green)' : pct >= 50 ? '#F59E0B' : '#94A3B8';
        return `
            <svg width="72" height="72" style="transform: rotate(-90deg);">
                <circle class="ring-bg" cx="36" cy="36" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="5" style="opacity: 0.2;"/>
                <circle cx="36" cy="36" r="${r}" fill="none" class="completion-circle" stroke="${color}" stroke-width="5"
                    stroke-dasharray="0 ${c}" stroke-linecap="round"
                    data-target="${filled} ${c - filled}"
                    style="transition: stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 1s ease;"/>
            </svg>
        `;
    }

    // ─── WEEKLY REPORT ───────────────────────────────────────────
    showWeeklyReport() {
        const now = new Date();
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);

        const completedThisWeek = this.tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) > weekAgo);
        const focusThisWeek = this.focusTime.sessions.filter(s => new Date(s.completedAt) > weekAgo);
        const focusMins = focusThisWeek.reduce((s, x) => s + x.duration, 0);
        const habitsCompleted = this.habits.filter(h => h.completedToday).length;
        const totalHabits = this.habits.length;
        const habitRate = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;

        // Day-by-day breakdown
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayBars = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dStr = d.toDateString();
            const count = completedThisWeek.filter(t => new Date(t.completedAt).toDateString() === dStr).length;
            dayBars.push({ day: days[d.getDay()], count });
        }
        const maxCount = Math.max(...dayBars.map(d => d.count), 1);
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 520px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                    <div>
                        <h2 style="margin: 0;">📊 Weekly Report</h2>
                        <p style="margin: 4px 0 0; color: var(--text-muted); font-size: 0.85rem;">Your productivity this week</p>
                    </div>
                    <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">×</button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: var(--streak-pill); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">TASKS DONE</div>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-green);">${completedThisWeek.length}</div>
                    </div>
                    <div style="background: var(--streak-pill); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">FOCUS TIME</div>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-green);">${this.formatMinutes(focusMins)}</div>
                    </div>
                    <div style="background: var(--streak-pill); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">STREAK</div>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--accent-green);">${this.streakData.currentStreak}🔥</div>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 1rem;">TASKS COMPLETED PER DAY</div>
                    <div style="display: flex; align-items: flex-end; gap: 8px; height: 80px;">
                        ${dayBars.map(d => `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                <div style="width: 100%; background: ${d.count > 0 ? 'var(--accent-green)' : 'var(--border-color)'}; border-radius: 4px 4px 0 0; height: ${Math.max(4, (d.count / maxCount) * 60)}px; transition: height 0.4s ease;"></div>
                                <div style="font-size: 0.65rem; color: var(--text-muted);">${d.day}</div>
                                ${d.count > 0 ? `<div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-green);">${d.count}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background: var(--streak-pill); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 0.5rem;">HABIT RATE TODAY</div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="flex: 1; background: var(--border-color); border-radius: 8px; height: 8px; overflow: hidden;">
                            <div style="background: var(--accent-green); width: ${habitRate}%; height: 100%; border-radius: 8px; transition: width 0.6s ease;"></div>
                        </div>
                        <span style="font-weight: 700; color: var(--accent-green); font-size: 0.9rem;">${habitRate}%</span>
                    </div>
                </div>

                <div style="background: var(--accent-green); border-radius: 12px; padding: 1rem; color: white; text-align: center; margin-bottom: 1.5rem; box-shadow: 0 4px 15px var(--accent-green-glow);">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 4px;">✨ Zen Insight</div>
                    <div style="font-style: italic; font-size: 0.95rem;">${this.getWeeklyInsight(completedThisWeek.length, focusMins, this.streakData.currentStreak)}</div>
                </div>

                <button class="btn-focus" onclick="this.closest('.modal-overlay').remove()" style="width: 100%;">Close Report</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    }

    getWeeklyInsight(tasks, mins, streak) {
        if (tasks === 0 && mins === 0) return 'A fresh start awaits. Open your tasks and begin gently. 🌱';
        if (tasks >= 10 && mins >= 100) return 'Outstanding week! You\'re building something beautiful. 🏆';
        if (streak >= 7) return `${streak} consecutive days — your consistency is your superpower. 🔥`;
        if (mins >= 60) return `${this.formatMinutes(mins)} of focused work. Your mind is a well-trained garden. 🌿`;
        if (tasks >= 5) return `${tasks} tasks completed. Progress over perfection, always. ✅`;
        return 'Every session counts. You showed up, and that matters most. 💚';
    }

    // ─── ORGANIZO PRO FRAMEWORK ──────────────────────────────────
    showProModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 480px; text-align: center;">
                <div style="background: linear-gradient(135deg, var(--accent-green), var(--accent-green-glow)); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; color: white;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👑</div>
                    <h2 style="margin: 0; font-size: 1.5rem;">OrganizO Pro</h2>
                    <p style="margin: 8px 0 0; opacity: 0.85; font-size: 0.9rem;">Everything you need to grow — gently.</p>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 1rem;">₹19<span style="font-size: 1rem; font-weight: 400; opacity: 0.8;">/month</span></div>
                    <div style="font-size: 0.8rem; opacity: 0.6; margin-top: 4px;">or ₹99 for a full year (Limited Offer)</div>
                </div>

                <div style="text-align: left; margin-bottom: 1.5rem;">
                    ${[
                ['☁️', 'Cloud Sync', 'Real-time sync across your phone and laptop.'],
                ['🎧', 'Focus Soundscapes', 'Offline lo-fi beats and nature audio.'],
                ['🔒', 'The Digital Vault', 'AES-256 encrypted local backups.'],
                ['🎨', 'Premium Aesthetics', 'Unlock Misty Peaks and 5 more themes.'],
                ['📊', 'Advanced Reports', 'Visual insights & focus time trends.'],
                ['🔔', 'Zen Alarms', 'Nature-vibe audio tasks.'],
            ].map(([icon, title, desc]) => `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="font-size: 1.5rem; width: 32px; display: flex; justify-content: center;">${icon}</span>
                            <div>
                                <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-dark);">${title}</div>
                                <div style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.3;">${desc}</div>
                            </div>
                            <span style="margin-left: auto; color: var(--accent-green); font-weight: 800; font-size: 1.2rem;">✓</span>
                        </div>
                    `).join('')}
                </div>

                <div style="background: linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05)); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; text-align: left; border: 1px solid rgba(16, 185, 129, 0.2);">
                    <div style="font-weight: 600; color: var(--accent-green); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 1rem;">✨</span> Instant Access
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-dark); opacity: 0.8;">Cloud Sync and Pro features activate immediately across all your devices.</div>
                </div>

                <button class="btn-focus" id="pro-checkout-btn" style="width: 100%; margin-bottom: 0.75rem; font-size: 1.05rem; padding: 14px;">Unlock OrganizO Pro Now</button>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem;">Maybe later</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#pro-checkout-btn').addEventListener('click', () => {
            alert("Cloud Sync Backend Integration Required:\\n\\nIn a live environment, this button triggers a Stripe Checkout or Google Play Billing flow. Once paid, the server flips 'isPro = true'.\\n\\nDevelopment mode: Unlocking locally.");
            this.isPro = true;
            this.saveData('isPro', this.isPro);
            this.updateUserUI();
            modal.remove();
        });
    }

    // ─── ROUTINE TEMPLATES ────────────────────────────────────────
    renderTemplatesView() {
        const mainContent = document.querySelector('.main-content');
        const templates = [
            {
                id: 'study',
                icon: '📚',
                name: 'Study Routine',
                desc: 'Structured deep work for students and learners',
                color: '#3B82F6',
                bg: '#EFF6FF',
                tasks: [
                    { name: 'Review yesterday\'s notes', category: 'Personal', priority: 'High' },
                    { name: 'Read & annotate for 45 mins', category: 'Personal', priority: 'High' },
                    { name: 'Practice problems / exercises', category: 'Personal', priority: 'High' },
                    { name: 'Write a 5-line summary', category: 'Personal', priority: 'Normal' },
                    { name: 'Drink water & take a break', category: 'Health', priority: 'Normal' },
                    { name: 'Plan tomorrow\'s study goal', category: 'Personal', priority: 'Low' },
                ]
            },
            {
                id: 'coding',
                icon: '💻',
                name: 'Coding Routine',
                desc: 'For developers building their craft daily',
                color: '#8B5CF6',
                bg: '#F5F3FF',
                tasks: [
                    { name: 'Review pull requests / open tasks', category: 'Work', priority: 'High' },
                    { name: '2-hour deep work coding block', category: 'Work', priority: 'High' },
                    { name: 'Write / update documentation', category: 'Work', priority: 'Normal' },
                    { name: 'Learn one new concept (30 mins)', category: 'Personal', priority: 'Normal' },
                    { name: 'Commit and push code', category: 'Work', priority: 'High' },
                    { name: 'Log learnings in journal', category: 'Personal', priority: 'Low' },
                ]
            },
            {
                id: 'gym',
                icon: '🏋️',
                name: 'Gym & Wellness',
                desc: 'A balanced mind-body routine for fitness goals',
                color: '#EF4444',
                bg: '#FFF1F2',
                tasks: [
                    { name: 'Morning stretch (10 mins)', category: 'Health', priority: 'High' },
                    { name: 'Gym or home workout (45 mins)', category: 'Health', priority: 'High' },
                    { name: 'Protein-rich meal / track nutrition', category: 'Health', priority: 'High' },
                    { name: 'Drink 2L+ water today', category: 'Health', priority: 'Normal' },
                    { name: 'Evening walk (20 mins)', category: 'Health', priority: 'Normal' },
                    { name: 'Log workout progress', category: 'Health', priority: 'Low' },
                ]
            },
            {
                id: 'creator',
                icon: '✍️',
                name: 'Creator Routine',
                desc: 'For writers, designers & content creators',
                color: '#F59E0B',
                bg: '#FFFBEB',
                tasks: [
                    { name: 'Morning pages / free-writing (15 mins)', category: 'Creativity', priority: 'High' },
                    { name: 'Deep creative work block (2 hrs)', category: 'Creativity', priority: 'High' },
                    { name: 'Respond to audience / comments', category: 'Work', priority: 'Normal' },
                    { name: 'Brainstorm 3 new ideas', category: 'Creativity', priority: 'Normal' },
                    { name: 'Edit / refine yesterday\'s work', category: 'Creativity', priority: 'Normal' },
                    { name: 'Schedule / post content', category: 'Work', priority: 'Low' },
                ]
            },
            {
                id: 'zen-morning',
                icon: '🧘',
                name: 'Zen Morning',
                desc: 'A calm start for clarity and focus',
                color: '#10B981',
                bg: '#F0FDF4',
                tasks: [
                    { name: 'Meditation / Mindfulness (10 mins)', category: 'Health', priority: 'High' },
                    { name: 'Set daily intentions in app', category: 'Personal', priority: 'High' },
                    { name: 'Light reading / inspiration (15 mins)', category: 'Personal', priority: 'Normal' },
                    { name: 'Nutritious breakfast', category: 'Health', priority: 'Normal' },
                    { name: 'Deep breathing (3 mins)', category: 'Health', priority: 'Low' },
                ]
            },
            {
                id: 'evening-reset',
                icon: '🌙',
                name: 'Evening Reset',
                desc: 'Digital detox and peaceful wind-down',
                color: '#6366F1',
                bg: '#EEF2FF',
                tasks: [
                    { name: 'Digital Detox (Phone away at 9PM)', category: 'Health', priority: 'High' },
                    { name: 'Review today\'s achievements', category: 'Personal', priority: 'Normal' },
                    { name: 'Journaling in Quiet Notes', category: 'Personal', priority: 'Normal' },
                    { name: 'Prepare outfit for tomorrow', category: 'Personal', priority: 'Normal' },
                    { name: 'Chamomile tea / reading', category: 'Health', priority: 'Low' },
                ]
            },
            {
                id: 'business',
                icon: '🏢',
                name: 'Business Lead',
                desc: 'For entrepreneurs and marketing leaders',
                color: '#0EA5E9',
                bg: '#F0F9FF',
                tasks: [
                    { name: 'Clear high-priority email block (45 mins)', category: 'Work', priority: 'High' },
                    { name: 'Marketing / Sales outreach (5 contacts)', category: 'Work', priority: 'High' },
                    { name: 'Review KPIs / Business stats', category: 'Work', priority: 'Normal' },
                    { name: 'Content strategy planning', category: 'Work', priority: 'Normal' },
                    { name: 'Update CRM / Project boards', category: 'Work', priority: 'Low' },
                ]
            },
            {
                id: 'self-care',
                icon: '🌿',
                name: 'Self-Care Solo',
                desc: 'A weekend recharge for your soul',
                color: '#EC4899',
                bg: '#FDF2F8',
                tasks: [
                    { name: 'Digital disconnection day', category: 'Health', priority: 'High' },
                    { name: 'Long nature walk (45 mins+)', category: 'Health', priority: 'High' },
                    { name: 'Clean and refresh workspace', category: 'Personal', priority: 'Normal' },
                    { name: 'Cook a new healthy recipe', category: 'Health', priority: 'Normal' },
                    { name: 'Spend 1 hour on a hobby', category: 'Creativity', priority: 'Normal' },
                ]
            },
        ];

        mainContent.innerHTML = `
            <nav class="top-nav">
                <div style="font-size: 0; visibility: hidden; width: 0;"></div>
                <div class="top-actions">
                    <div class="user-avatar profile-edit-trigger" style="width: 32px; height: 32px; font-size: 0.8rem; cursor: pointer;" onclick="window.organizoApp.showProfileModal()">${this.sanitize(this.userData.initials)}</div>
                </div>
            </nav>

            <header class="header-section">
                <h1>🎯 Routine Templates</h1>
                <p>One tap to fill your day with purpose. Pick a routine that fits your goals.</p>
            </header>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                ${templates.map(t => `
                    <div class="card" style="border-top: 4px solid ${t.color}; position: relative;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                            <div style="width: 48px; height: 48px; background: ${t.bg}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">${t.icon}</div>
                            <div>
                                <div style="font-weight: 700; font-size: 1rem;">${t.name}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${t.desc}</div>
                            </div>
                        </div>
                        <div style="margin-bottom: 1.25rem;">
                            ${t.tasks.map(task => `
                                <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">
                                    <span style="color: var(--accent-green); font-size: 0.8rem;">◦</span>
                                    <span style="color: var(--text-dark);">${task.name}</span>
                                    ${task.priority === 'High' ? `<span style="margin-left: auto; font-size: 0.65rem; background: #FEF2F2; color: #EF4444; border-radius: 4px; padding: 1px 6px; font-weight: 600;">HIGH</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-focus apply-template-btn" data-template-id="${t.id}" style="width: 100%; background: var(--accent-green); white-space: nowrap; font-size: 0.85rem; padding: 10px 5px;">
                            Load ${t.name}
                        </button>
                    </div>
                `).join('')}
            </div>

            <div class="info-box">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💡</div>
                <div style="font-weight: 600; margin-bottom: 0.25rem;">Templates add tasks to your existing list</div>
                <div style="color: var(--text-muted); font-size: 0.9rem;">You can edit, delete, or complete them just like any other task. Mix and match!</div>
            </div>
        `;

        // Bind apply buttons
        document.querySelectorAll('.apply-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tId = e.currentTarget.dataset.templateId;
                const tpl = templates.find(t => t.id === tId);
                if (tpl) this.applyTemplate(tpl);
            });
        });
    }

    // ─── QUIET NOTES ──────────────────────────────────────────────
    renderNotesView() {
        const mainContent = document.querySelector('.main-content');

        // Determine container style based on Card Mode toggle
        const cardBgStyle = this.notesCardMode
            ? 'background: var(--card-bg); border-radius: 20px 20px 0 0; box-shadow: 0 -10px 40px rgba(0,0,0,0.4); border: 1px solid var(--border-color); border-bottom: none;'
            : 'background: transparent; border: none; box-shadow: none;';

        const glassToolbar = `
            background: rgba(255, 255, 255, 0.1); 
            backdrop-filter: blur(12px); 
            -webkit-backdrop-filter: blur(12px); 
            border: 1px solid rgba(255,255,255,0.2); 
            border-radius: 12px; 
            padding: 6px 12px; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        `;

        mainContent.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; padding: 1rem 1rem 0 1rem; position: relative;">
                <style>
                    /* Scoped Typography */
                    #notes-area { font-family: '${this.notesFont}', sans-serif !important; }
                    #notes-area h1 { font-family: '${this.notesFont}', sans-serif !important; font-weight: 800; font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-dark); letter-spacing: -0.02em; }
                    #notes-area h2 { font-family: '${this.notesFont}', sans-serif !important; font-weight: 700; font-size: 1.5rem; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-dark); }
                    #notes-area h3 { font-family: '${this.notesFont}', sans-serif !important; font-weight: 600; font-size: 1.25rem; margin-top: 1.2rem; margin-bottom: 0.5rem; color: var(--text-dark); }
                    #notes-area p, #notes-area div { margin-bottom: 0.8rem; line-height: 1.7; font-size: 1.1rem; }
                    #notes-area ul { margin-bottom: 1rem; padding-left: 1.5rem; }
                    #notes-area li { margin-bottom: 0.2rem; }
                    
                    /* Custom Editor UI */
                    .editor-select { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; color: var(--text-dark); font-size: 0.9rem; font-weight: 600; outline: none; cursor: pointer; padding: 4px 8px; }
                    .editor-select option { background: #1E293B !important; color: #F8FAFC !important; padding: 8px; }
                    .glass-btn { background: none; border: none; cursor: pointer; color: var(--text-dark); border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-weight: 600; }
                    .glass-btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); }
                </style>
                
                <div style="flex: 1; display: flex; flex-direction: column; padding: 3rem 8% 5rem 8%; transition: all 0.3s ease; overflow-y: auto; ${cardBgStyle}">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; position: sticky; top: 0; z-index: 20; padding: 10px 0;">
                        <!-- Glassmorphic Toolbar -->
                        <div style="display: flex; gap: 8px; align-items: center; ${glassToolbar}">
                            <select id="notes-font-select" class="editor-select" title="Change Font">
                                <option value="Inter" ${this.notesFont === 'Inter' ? 'selected' : ''}>Inter</option>
                                <option value="Playfair Display" ${this.notesFont === 'Playfair Display' ? 'selected' : ''}>Playfair</option>
                                <option value="Outfit" ${this.notesFont === 'Outfit' ? 'selected' : ''}>Outfit</option>
                                <option value="Lora" ${this.notesFont === 'Lora' ? 'selected' : ''}>Lora (Serif)</option>
                                <option value="Courier New" ${this.notesFont === 'Courier New' ? 'selected' : ''}>Typewriter</option>
                            </select>
                            
                            <div style="width: 1px; height: 16px; background: var(--border-color); margin: 0 4px;"></div>
                            
                            <button class="glass-btn" onclick="document.execCommand('bold', false, null)" style="font-weight:bold; width:30px; height:30px;" title="Bold">B</button>
                            <button class="glass-btn" onclick="document.execCommand('italic', false, null)" style="font-style:italic; font-family:serif; width:30px; height:30px;" title="Italic">I</button>
                            <button class="glass-btn" onclick="document.execCommand('insertUnorderedList', false, null)" style="width:30px; height:30px;" title="Bullet List">•</button>
                            
                            <div style="width: 1px; height: 16px; background: var(--border-color); margin: 0 4px;"></div>
                            
                            <button class="glass-btn" onclick="document.execCommand('formatBlock', false, 'H1')" style="font-weight: 800; width:30px; height:30px; font-size: 0.8rem;" title="Title size">H1</button>
                            <button class="glass-btn" onclick="document.execCommand('formatBlock', false, 'H2')" style="font-weight: 700; width:30px; height:30px; font-size: 0.8rem;" title="Header size">H2</button>
                            
                            <div style="width: 1px; height: 16px; background: var(--border-color); margin: 0 4px;"></div>
                            
                            <button id="toggle-card-btn" class="glass-btn" style="width:30px; height:30px;" title="Toggle Paper Mode">
                                ${this.notesCardMode ? '📄' : '✨'}
                            </button>
                            <button class="glass-btn" onclick="window.organizoApp.exportData()" title="Backup Notes" style="width:30px; height:30px; margin-left:8px;">☁️</button>
                        </div>
                        
                        <!-- Status indicator (also glassmorphic) -->
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: var(--text-dark); font-weight: 500; ${glassToolbar}">
                            <div id="notes-status" style="display: flex; align-items: center; gap: 6px;">
                                <span class="status-icon" style="font-size: 0.7rem; color: var(--accent-green);">✓</span>
                                <span class="status-text">Saved</span>
                            </div>
                            <div style="width: 4px; height: 4px; background: var(--text-dark); opacity: 0.3; border-radius: 50%;"></div>
                            <div id="notes-word-count">0 words</div>
                        </div>
                    </div>

                    <div id="notes-area" contenteditable="true" 
                        style="flex: 1; border: none; outline: none; color: var(--text-dark); background: transparent; word-wrap: break-word;" 
                        placeholder="Type '/' for commands or start writing...">
${this.notes}</div>
                </div>
            </div>
        `;

        const notesArea = document.getElementById('notes-area');
        const statusText = document.querySelector('.status-text');
        const statusIcon = document.querySelector('.status-icon');
        const wordCount = document.getElementById('notes-word-count');

        // Font Selector Logic
        document.getElementById('notes-font-select').addEventListener('change', (e) => {
            this.notesFont = e.target.value;
            this.saveData('notesFont', this.notesFont);
            this.renderNotesView(); // Re-render to apply strictly
        });

        // Card Toggle Logic
        document.getElementById('toggle-card-btn').addEventListener('click', () => {
            this.notesCardMode = !this.notesCardMode;
            this.saveData('notesCardMode', this.notesCardMode);
            this.renderNotesView();
        });

        const countWords = (html) => {
            if (!html) return 0;
            let text = html.replace(/<[^>]*>?/igm, ' ');
            return text.trim() === "" ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
        };

        wordCount.textContent = countWords(notesArea.innerHTML) + ' words';

        notesArea.addEventListener('input', () => {
            this.notes = notesArea.innerHTML;
            this.saveData('notes', this.notes);

            // Update word count
            wordCount.textContent = countWords(notesArea.innerHTML) + ' words';

            // Visual feedback
            statusText.textContent = 'Saving...';
            statusIcon.textContent = '●';
            statusIcon.style.color = 'var(--text-muted)';

            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                statusText.textContent = 'Saved';
                statusIcon.textContent = '✓';
                statusIcon.style.color = 'var(--accent-green)';
            }, 800);
        });

        // Handle placeholder block natively
        if (!this.notes || this.notes.trim() === '') {
            notesArea.innerHTML = '<h1>Untitled</h1><br>';
        }

        // Smart cursor placement
        setTimeout(() => {
            notesArea.focus();
            if (notesArea.innerHTML.includes('Untitled')) {
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(notesArea.firstChild);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }, 100);
    }

    applyTemplate(template) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">${template.icon}</div>
                <h3 style="margin-bottom: 0.5rem;">Apply ${template.name}?</h3>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${template.tasks.length} tasks will be added to your task list for today.</p>
                <div style="display: flex; gap: 1rem;">
                    <button id="confirm-template" class="btn-focus" style="flex: 1;">Yes, Add Tasks</button>
                    <button id="cancel-template" class="btn-focus" style="flex: 1; background: white; color: var(--text-dark); border: 1px solid #E2E8F0;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#cancel-template').addEventListener('click', () => modal.remove());
        modal.querySelector('#confirm-template').addEventListener('click', () => {
            template.tasks.forEach((t, i) => {
                this.tasks.unshift({
                    id: Date.now() + i,
                    name: t.name,
                    category: t.category,
                    priority: t.priority,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            });
            this.saveData('tasks', this.tasks);
            modal.remove();
            this.showToast(`✅ ${template.tasks.length} tasks from ${template.name} added!`);
            this.switchView('tasks');
        });
    }

    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: #1E293B; color: white; padding: 0.75rem 1.5rem; border-radius: 50px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 9999; font-size: 0.9rem; font-weight: 500; white-space: nowrap; animation: slideUp 0.3s ease;';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(10px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, duration);
    }

    // ─── DASHBOARD RENDERING (ENHANCED) ─────────────────────────
    renderDashboard() {
        const mainContent = document.querySelector('.main-content');
        const completedToday = this.tasks.filter(t => t.completed && this.isToday(t.completedAt)).length;
        const totalTasks = this.tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;
        const completion = this.getDailyCompletion();

        mainContent.innerHTML = `
            <nav class="top-nav">
                <div class="search-box">
                    <span style="opacity: 0.6;">🔍</span>
                    <input type="text" placeholder="Search your tasks..." id="search-input">
                </div>
                <div class="top-actions">
                    <button class="icon-btn" title="Weekly Report" onclick="window.organizoApp.showWeeklyReport()" style="font-size: 1rem; background: var(--card-bg); border-color: var(--border-color);">📊</button>
                    ${!this.isPro ? '<button class="icon-btn" title="OrganizO Pro" onclick="window.organizoApp.showProModal()" style="font-size: 1rem; background: var(--accent-green); color: white; border: none;">⭐</button>' : ''}
                    <div class="user-avatar profile-edit-trigger" style="width: 32px; height: 32px; font-size: 0.8rem; cursor: pointer; position: relative; background: var(--accent-green); color: white;" onclick="window.organizoApp.showProfileModal()">
                        ${this.sanitize(this.userData.initials)}
                        ${this.isPro ? '<div style="position: absolute; bottom: -2px; right: -2px; font-size: 0.6rem; background: var(--accent-green); color: white; border-radius: 4px; padding: 1px 3px; border: 1px solid white;">PRO</div>' : ''}
                    </div>
                </div>
            </nav>

            <div class="dashboard-header" style="margin-bottom: 2rem;">
                <h1 id="greeting" style="margin: 0; line-height: 1.2;">Good afternoon, ${this.sanitize(this.userData.name)}</h1>
                <p style="margin: 5px 0 0 0; color: var(--text-muted);">Take a deep breath. It's ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.</p>
            </div>

            <section class="intention-card" style="position: relative; overflow: visible; cursor: default;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span class="intention-label">Today's Single Intention</span>
                    
                    <h2 class="intention-text" id="intention-display" 
                        style="margin-bottom: 1rem; cursor: text; transition: color 0.3s;"
                        title="Click to edit your intention"
                        onclick="window.organizoApp.editIntention()">
                        ${this.dailyIntention
                ? '&ldquo;' + this.sanitize(this.dailyIntention) + '&rdquo;'
                : '<span style="opacity:0.4; font-size:1.2rem;">✨ Click here to set your intention for today...</span>'}
                    </h2>

                    ${this.dailyIntention ? `
                    <div style="display: flex; gap: 8px; margin-bottom: 1.25rem; flex-wrap: wrap; justify-content: center;">
                        ${['🌿 Calm', '🔥 Focused', '💡 Creative', '⚡ Energised'].map(mood => `
                            <span style="font-size:0.75rem; padding: 4px 12px; border-radius: 20px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); color: var(--accent-green); cursor: pointer; font-weight: 600; transition: all 0.2s;"
                                onclick="window.organizoApp.showToast('${mood} — great mindset for today!')">${mood}</span>
                        `).join('')}
                    </div>` : ''}

                    <div id="dashboard-timer" style="font-size: 3.5rem; font-weight: 700; color: var(--accent-green); margin-bottom: 1.5rem; font-family: 'Outfit', sans-serif; text-shadow: 0 0 15px rgba(16, 185, 129, 0.3); display: ${this.timer.isRunning ? 'block' : 'none'};"
                        title="Focus timer running">
                        ${String(this.timer.minutes).padStart(2, '0')}:${String(this.timer.seconds).padStart(2, '0')}
                    </div>

                    <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
                        <button class="btn-focus start-timer-btn" style="display: flex; align-items: center; gap: 8px; padding: 11px 24px;">
                            <span>${this.timer.isRunning ? '⏸️' : '▶️'}</span>
                            ${this.timer.isRunning ? 'Pause Timer' : 'Start Focus Session'}
                        </button>
                        <button class="btn-focus edit-intention-btn" style="background: rgba(255,255,255,0.9); color: #1E293B; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-weight: 700; display: flex; align-items: center; gap: 8px; padding: 11px 20px;">
                            <span>✏️</span> ${this.dailyIntention ? 'Edit Intention' : 'Set Intention'}
                        </button>
                        <button class="btn-focus random-affirmation-btn" title="Random Zen intention" style="background: rgba(255,255,255,0.8); color: var(--accent-green); border: 1px solid rgba(16,185,129,0.3); padding: 11px 16px; font-size: 1.1rem;" onclick="window.organizoApp.editIntention(); setTimeout(()=>window.organizoApp.generateAffirmation(),100)">
                            ✨
                        </button>
                    </div>
                </div>
            </section>

            <div class="dashboard-grid">
                <div class="column">
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">🍃 Today's Tasks</span>
                            <a href="#" class="add-btn add-task-btn">+ Add New</a>
                        </div>
                        <div class="task-list" id="task-list">
                            ${this.renderTaskList()}
                        </div>
                        <!-- Daily Completion % -->
                        <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border-color);">
                            <div style="position: relative; flex-shrink: 0;">
                                ${this.renderCompletionRing(completion.pct)}
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.75rem; font-weight: 800; color: var(--text-dark);">${completion.pct}%</div>
                            </div>
                            <div>
                                <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark);">Daily Completion</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${completion.done} of ${completion.total} tasks today</div>
                                ${completion.pct === 100 ? '<div style="font-size: 0.8rem; color: var(--accent-green); font-weight: 600; margin-top: 2px;">🎉 Perfect day!</div>' : ''}
                            </div>
                            <button onclick="window.organizoApp.showWeeklyReport()" style="margin-left: auto; background: none; border: none; color: var(--accent-green); font-size: 0.8rem; font-weight: 600; cursor: pointer;">View Report →</button>
                        </div>
                    </div>
                </div>

                <div class="column">
                    <!-- STREAK CARD -->
                    ${this.renderStreakMiniCard()}

                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">⏱️ Focus Time Today</span>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--accent-green);">${this.formatFocusTime()}</div>
                            <div style="font-size: 0.8rem; color: var(--accent-green); margin-top: 4px;">${this.focusTime.sessions.filter(s => this.isToday(s.completedAt)).length} sessions completed</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">🌿 Habits</span>
                        </div>
                        ${this.renderHabits()}
                    </div>
                </div>
            </div>
            <button class="fab" onclick="window.organizoApp.switchView('tasks')">+</button>
        `;

        this.updateGreeting();
        this.updateDate();
        this.setupSearchFilter();

        // Trigger ring animation
        setTimeout(() => {
            const circle = mainContent.querySelector('.completion-circle');
            if (circle) circle.setAttribute('stroke-dasharray', circle.getAttribute('data-target'));
        }, 50);
    }

    renderTaskList() {
        if (this.tasks.length === 0) {
            return '<div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);"><div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🌱</div><div style="font-weight: 600; margin-bottom: 0.25rem;">No tasks yet</div><div style="font-size: 0.85rem;">Add one to begin cultivating focus</div></div>';
        }

        const today = new Date(); today.setHours(0, 0, 0, 0);

        return this.tasks.map(task => {
            let deadlineBadge = '';
            if (task.dueDate && !task.completed) {
                const due = new Date(task.dueDate + 'T00:00:00');
                const diffDays = Math.ceil((due - today) / 86400000);
                if (diffDays < 0) {
                    deadlineBadge = `<span class="deadline-badge" style="font-size:0.65rem; padding: 2px 8px; border-radius: 20px; background: #FEE2E2; color: #DC2626; font-weight: 700; white-space: nowrap;">⚠️ Overdue</span>`;
                } else if (diffDays === 0) {
                    deadlineBadge = `<span class="due-soon-badge" style="font-size:0.65rem; padding: 2px 8px; border-radius: 20px; background: #FEF3C7; color: #D97706; font-weight: 700; white-space: nowrap;">🔥 Due today</span>`;
                } else if (diffDays === 1) {
                    deadlineBadge = `<span class="due-soon-badge" style="font-size:0.65rem; padding: 2px 8px; border-radius: 20px; background: #FEF3C7; color: #D97706; font-weight: 700; white-space: nowrap;">📅 Tomorrow</span>`;
                } else if (diffDays <= 3) {
                    deadlineBadge = `<span class="due-soon-badge" style="font-size:0.65rem; padding: 2px 8px; border-radius: 20px; background: #ECFDF5; color: #059669; font-weight: 700; white-space: nowrap;">🗓️ In ${diffDays}d</span>`;
                }
            }
            return `
            <div class="task-item" data-task-id="${task.id}" style="border-bottom-color: var(--border-color); animation: fadeInTask 0.3s ease;">
                <div class="checkbox ${task.completed ? 'checked' : ''}" style="border-color: var(--border-color); background: ${task.completed ? 'var(--accent-green)' : 'transparent'}; flex-shrink: 0;">${task.completed ? '✓' : ''}</div>
                <div class="task-info" style="flex: 1; min-width: 0;">
                    <span class="task-name" style="${task.completed ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: var(--text-dark);'}">${this.sanitize(task.name)}</span>
                    <div class="task-meta" style="color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
                        <span style="font-size: 0.75rem;">${task.category || 'General'}</span>
                        ${deadlineBadge}
                    </div>
                </div>
                <span class="tag-priority ${task.priority === 'High' ? 'high' : (task.priority === 'Low' ? 'low' : '')}" style="flex-shrink: 0;">${task.priority || 'Normal'}</span>
                <button class="delete-task" style="background: none; border: none; color: #EF4444; cursor: pointer; margin-left: 6px; opacity: 0.5; font-size: 1.1rem; flex-shrink: 0;">×</button>
            </div>
        `}).join('');
    }


    renderHabits() {
        return this.habits.map(habit => `
            <div class="stat-item habit-item" data-habit-id="${habit.id}">
                <div class="stat-label">
                    <span>${habit.name}</span>
                    <span>${habit.streak} day streak</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
                    <div class="habit-dots">
                        ${this.renderHabitDots(habit)}
                    </div>
                    <button class="habit-check" style="background: ${habit.completedToday ? 'var(--accent-green)' : '#E2E8F0'}; border: none; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; color: white;">
                        ${habit.completedToday ? '✓' : ''}
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderHabitDots(habit) {
        const dots = [];
        for (let i = 0; i < 7; i++) {
            const isActive = i < habit.streak;
            dots.push(`<div class="dot ${isActive ? 'active' : ''}"></div>`);
        }
        return dots.join('');
    }

    // Task Management
    showAddTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const today = new Date().toISOString().split('T')[0];
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; padding: 2rem; border-radius: 24px;">
                <h3 style="margin-bottom: 1.5rem; font-family: 'Playfair Display', serif;">🌱 Add New Task</h3>

                <div style="margin-bottom: 1rem;">
                    <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 6px; display: block;">Task Name *</label>
                    <input type="text" id="task-name" placeholder="What needs your focus?" class="input-field"
                        style="width: 100%; padding: 12px 16px; border: 1.5px solid var(--border-color); border-radius: 12px; font-size: 1rem; color: var(--text-dark); background: var(--input-bg, white); box-sizing: border-box; outline: none;"
                        onfocus="this.style.borderColor='var(--accent-green)'" onblur="this.style.borderColor='var(--border-color)'">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                    <div>
                        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 6px; display: block;">Category</label>
                        <select id="task-category" class="input-field"
                            style="width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-color); border-radius: 12px; font-size: 0.9rem; color: var(--text-dark); background: var(--input-bg, white);">
                            <option value="Work">💼 Work</option>
                            <option value="Personal">🙋 Personal</option>
                            <option value="Creativity">🎨 Creativity</option>
                            <option value="Health">🏃 Health</option>
                            <option value="Learning">📚 Learning</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 6px; display: block;">Priority</label>
                        <select id="task-priority" class="input-field"
                            style="width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-color); border-radius: 12px; font-size: 0.9rem; color: var(--text-dark); background: var(--input-bg, white);">
                            <option value="Normal">⚪ Normal</option>
                            <option value="High">🔴 High</option>
                            <option value="Low">🟢 Low</option>
                        </select>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 6px; display: block;">📅 Due Date (optional)</label>
                    <input type="date" id="task-due-date" min="${today}" class="input-field"
                        style="width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-color); border-radius: 12px; font-size: 0.9rem; color: var(--text-dark); background: var(--input-bg, white); box-sizing: border-box;">
                    <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 5px;">🔔 You'll get a reminder 1 hour before the deadline</p>
                </div>

                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn-focus" id="save-task-btn" style="flex: 1; padding: 13px; border-radius: 14px; font-size: 1rem;">Add Task</button>
                    <button class="btn-focus cancel-modal-btn" style="flex: 1; padding: 13px; border-radius: 14px; background: var(--card-bg, white); color: var(--text-dark); border: 1.5px solid var(--border-color); font-size: 1rem;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.cancel-modal-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        modal.querySelector('#save-task-btn').addEventListener('click', () => {
            const name = document.getElementById('task-name').value.trim();
            const category = document.getElementById('task-category').value;
            const priority = document.getElementById('task-priority').value;
            const dueDate = document.getElementById('task-due-date').value;
            if (name) {
                this.addTask(name, category, priority, dueDate);
                modal.remove();
            } else {
                document.getElementById('task-name').style.borderColor = '#EF4444';
                document.getElementById('task-name').focus();
            }
        });

        setTimeout(() => document.getElementById('task-name').focus(), 100);
    }

    addTask(name, category, priority, dueDate = null) {
        const task = {
            id: Date.now(),
            name,
            category,
            priority,
            dueDate: dueDate || null,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.tasks.unshift(task);
        this.saveData('tasks', this.tasks);

        // Schedule deadline notification if due date is set
        if (dueDate) {
            this.scheduleDeadlineNotification(task);
        }

        // Show task-added toast
        const dueTxt = dueDate ? ` (due ${new Date(dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` : '';
        this.showToast(`✅ Task added${dueTxt}`);

        this.renderDashboard();
    }

    scheduleDeadlineNotification(task) {
        if (!task.dueDate) return;
        // Fire notification 1hr before end of due date
        const dueDateTime = new Date(task.dueDate + 'T23:00:00').getTime();
        const now = Date.now();
        const delay = dueDateTime - now;
        if (delay <= 0) return; // Already past

        // Cap at max setTimeout (~24 days); for longer deadlines revisit on next page-load
        const MAX_DELAY = 2 * 24 * 60 * 60 * 1000;
        if (delay > MAX_DELAY) {
            // Store for next session
            return;
        }

        setTimeout(() => {
            if (!task.completed) {
                const msg = `⏰ Task due today: "${task.name}" — don't forget!`;
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('OrganizO 🗓️ Deadline Reminder', {
                        body: msg,
                        icon: './images/icon-192.png'
                    });
                }
                this.showToast(`🗓️ ${msg}`);
            }
        }, delay);
    }

    requestNotificationPermission() {
        if (!('Notification' in window)) {
            this.showToast('Notifications not supported in this browser.');
            return;
        }
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                this.showToast('🔔 Notifications enabled! You will get task alerts.');
                // Re-schedule all outstanding deadlines
                this.tasks.filter(t => !t.completed && t.dueDate).forEach(t => this.scheduleDeadlineNotification(t));
            } else {
                this.showToast('❌ Notifications blocked. Please allow in browser settings.');
            }
        });
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedAt = new Date().toISOString();
            }
            this.saveData('tasks', this.tasks);
            this.renderDashboard();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData('tasks', this.tasks);
        this.renderDashboard();
    }

    // Timer Functions
    renderTimerView() {
        const mainContent = document.querySelector('.main-content');
        
        // Dynamic Background Logic for Timer
        const bgMap = {
            'lofi': 'images/misty-peaks.png',
            'rain': 'images/rain-bg.jpg',
            'forest': 'images/forest-bg.jpg',
            'waves': 'images/ocean.png',
            'guitar': 'images/guitar-bg.jpg',
            'piano': 'images/piano-bg.jpg',
            'genshin': 'images/genshin-bg.jpg'
        };
        
        const activeBg = bgMap[this.selectedSound] || 'images/misty-peaks.png';
        
        // Apply background style to main content for immersive feel
        mainContent.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url('${activeBg}')`;
        if (this.isDarkMode) {
            mainContent.style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8)), url('${activeBg}')`;
        }
        mainContent.style.backgroundSize = 'cover';
        mainContent.style.backgroundPosition = 'center';

        const openTasks = this.tasks.filter(t => !t.completed);
        const currentFocusTask = this.tasks.find(t => t.id === this.focusTaskId);

        mainContent.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; text-align: center; padding-top: 3rem; min-height: 80vh;">
                <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">Focus Sanctuary</h1>
                <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem;">Release all distractions. Be here now.</p>

                <!-- Task Selector -->
                <div style="margin-bottom: 2.5rem; background: var(--card-bg); border-radius: 20px; padding: 1rem; border: 1px solid var(--border-color); backdrop-filter: blur(10px);">
                    <p style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Currently Focusing On</p>
                    ${openTasks.length === 0 ? 
                        `<p style="font-size: 0.9rem; color: var(--text-dark);">No active tasks. Just enjoy the silence. ✨</p>` :
                        `<select id="focus-task-select" onchange="window.organizoApp.setFocusTask(this.value)" 
                            style="width: 100%; max-width: 350px; padding: 12px; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--input-bg); color: var(--text-dark); font-family: 'Inter', sans-serif; outline: none; cursor: pointer;">
                            <option value="">-- Choose a goal for this session --</option>
                            ${openTasks.map(t => `<option value="${t.id}" ${this.focusTaskId === t.id ? 'selected' : ''}>${this.sanitize(t.text)}</option>`).join('')}
                        </select>`
                    }
                    ${currentFocusTask ? 
                        `<div style="margin-top: 12px; font-weight: 700; color: var(--accent-green); animation: fadeIn 0.5s;">🎯 Goal: ${this.sanitize(currentFocusTask.text)}</div>` : ''
                    }
                </div>

                <div class="timer-display" style="font-size: 7rem; font-weight: 700; color: var(--accent-green); margin-bottom: 1.5rem; font-family: 'Outfit', sans-serif; text-shadow: 0 0 30px rgba(16, 185, 129, 0.4);">
                    ${String(this.timer.minutes).padStart(2, '0')}:${String(this.timer.seconds).padStart(2, '0')}
                </div>

                <div class="timer-controls" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2.5rem;">
                    <button class="btn-focus start-timer-btn" style="padding: 1.2rem 2.5rem; font-size: 1.1rem; border-radius: 20px;">
                        ${this.timer.isRunning ? 'Pause Session' : 'Start Session'}
                    </button>
                    <button class="btn-focus reset-timer-btn" style="background: var(--card-bg); color: var(--text-dark); border: 1.5px solid var(--border-color); padding: 1.2rem 2rem; border-radius: 20px;">
                        Reset
                    </button>
                </div>

                <!-- Zen Soundscapes Card -->
                <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 24px; padding: 1.5rem; max-width: 450px; margin: 0 auto 3rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                        <div style="text-align: left;">
                            <h3 style="margin: 0; font-size: 1rem;">🍃 Zen Soundscapes</h3>
                            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: var(--text-muted);">Gentle background focus</p>
                        </div>
                        <button class="btn-focus" onclick="window.organizoApp.isPro ? window.organizoApp.toggleAudio() : window.organizoApp.showProModal()" 
                            style="padding: 8px 16px; border-radius: 12px; font-size: 0.85rem; background: ${this.audioPlaying ? 'var(--accent-green)' : 'var(--card-bg)'}; color: ${this.audioPlaying ? 'white' : 'var(--text-dark)'}; border: 1px solid var(--border-color);">
                            ${this.audioPlaying ? 'Stop' : 'Play'}
                        </button>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 1.25rem;">
                        ${[
                            {id: 'lofi', icon: '🎧', name: 'Lofi Trio'},
                            {id: 'rain', icon: '🌧️', name: 'Soft Rain'},
                            {id: 'forest', icon: '🌲', name: 'Zen Forest'},
                            {id: 'waves', icon: '🌊', name: 'Waves'},
                            {id: 'guitar', icon: '🎸', name: 'Acoustic'},
                            {id: 'piano', icon: '🎹', name: 'Soft Piano'},
                            {id: 'genshin', icon: '✨', name: 'Genshin'}
                        ].map(s => {
                            const isActive = this.selectedSound === s.id;
                            return `
                            <div class="sound-chip" onclick="window.organizoApp.selectZenSound('${s.id}')" 
                                style="padding: 10px; border-radius: 14px; background: ${isActive ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.03)'}; border: 1.5px solid ${isActive ? 'var(--accent-green)' : 'var(--border-color)'}; cursor: pointer; text-align: center; transition: all 0.2s; position: relative;">
                                <div style="font-size: 1.2rem; margin-bottom: 4px;">${s.icon}</div>
                                <div style="font-size: 0.65rem; font-weight: 700; color: ${isActive ? 'var(--accent-green)' : 'var(--text-dark)'};">${s.name}</div>
                                ${isActive ? '<div style="position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background: var(--accent-green); border-radius: 50%;"></div>' : ''}
                            </div>
                            `;
                        }).join('')}
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px; padding: 0 5px;">
                        <span style="font-size: 0.9rem; opacity: 0.5;">🔈</span>
                        <input type="range" id="soundscape-volume" min="0" max="1" step="0.05" value="${this.audioPlayer ? this.audioPlayer.volume : 0.5}" 
                            style="flex: 1; cursor: pointer; accent-color: var(--accent-green);" 
                            oninput="window.organizoApp.updateVolume(this.value)">
                        <span style="font-size: 0.9rem; opacity: 0.5;">🔊</span>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="timer-mode-btn ${this.timer.mode === 'focus' ? 'active' : ''}" data-mode="focus" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: ${this.timer.mode === 'focus' ? 'var(--accent-green)' : 'var(--card-bg)'}; color: ${this.timer.mode === 'focus' ? 'white' : 'var(--text-dark)'}; cursor: pointer;">
                        Focus (25min)
                    </button>
                    <button class="timer-mode-btn ${this.timer.mode === 'shortBreak' ? 'active' : ''}" data-mode="shortBreak" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: ${this.timer.mode === 'shortBreak' ? 'var(--accent-green)' : 'var(--card-bg)'}; color: ${this.timer.mode === 'shortBreak' ? 'white' : 'var(--text-dark)'}; cursor: pointer;">
                        Short Break (5min)
                    </button>
                    <button class="timer-mode-btn ${this.timer.mode === 'longBreak' ? 'active' : ''}" data-mode="longBreak" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: ${this.timer.mode === 'longBreak' ? 'var(--accent-green)' : 'var(--card-bg)'}; color: ${this.timer.mode === 'longBreak' ? 'white' : 'var(--text-dark)'}; cursor: pointer;">
                        Long Break (15min)
                    </button>
                </div>
            </div>
        `;

        document.querySelectorAll('.timer-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setTimerMode(mode);
            });
        });
        // Removed redundant local listener here, global listener handles it now
    }

    setTimerMode(mode) {
        this.pauseTimer();
        this.timer.mode = mode;

        switch (mode) {
            case 'focus':
                this.timer.minutes = 25;
                break;
            case 'shortBreak':
                this.timer.minutes = 5;
                break;
            case 'longBreak':
                this.timer.minutes = 15;
                break;
        }
        this.timer.seconds = 0;
        this.renderTimerView();
    }

    startTimer() {
        if (this.timer.isRunning) return; // Prevent double intervals

        // Request notification permission for Zen Alarms
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        this.timer.isRunning = true;
        this.timer.interval = setInterval(() => {
            if (this.timer.seconds === 0) {
                if (this.timer.minutes === 0) {
                    this.timerComplete();
                    return;
                }
                this.timer.minutes--;
                this.timer.seconds = 59;
            } else {
                this.timer.seconds--;
            }
            this.updateTimerDisplay();
        }, 1000);
        this.updateTimerDisplay();
    }

    pauseTimer() {
        this.timer.isRunning = false;
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
            this.timer.interval = null;
        }
        this.updateTimerDisplay();
    }

    resetTimer() {
        this.pauseTimer();
        this.setTimerMode(this.timer.mode);
    }

    timerComplete() {
        this.pauseTimer();
        if (this.timer.mode === 'focus') {
            this.focusTime.total += 25;
            this.focusTime.sessions.push({
                duration: 25,
                completedAt: new Date().toISOString()
            });
            this.saveData('focusTime', this.focusTime);
        }

        const msg = this.timer.mode === 'focus' ? '🎉 Focus session complete! Time for a well-earned break.' : '✨ Break over — ready to focus again?';

        // 🔔 Play bell sound
        this.playBellSound();

        // Native System Notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification('OrganizO ⏱️', {
                body: msg,
                icon: './images/icon-192.png',
                badge: './images/icon-192.png'
            });
        }

        // Show in-app completion banner
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, var(--accent-green), #059669);
            color: white; padding: 1.1rem 2rem; border-radius: 16px;
            box-shadow: 0 8px 30px rgba(16,185,129,0.35); z-index: 9999;
            font-size: 1rem; font-weight: 600;
            display: flex; align-items: center; gap: 10px;
            animation: slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1);
            min-width: 260px; justify-content: center;
        `;
        banner.innerHTML = `<span style="font-size:1.4rem;">🔔</span> ${msg}`;
        document.body.appendChild(banner);
        setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transition = 'opacity 0.5s, transform 0.5s';
            banner.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => banner.remove(), 500);
        }, 5000);

        this.resetTimer();
    }

    playBellSound() {
        try {
            // Use Web Audio API to synthesize a pleasant bell tone offline
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const playTone = (freq, delay, duration, gain) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                gainNode.gain.setValueAtTime(gain, ctx.currentTime + delay);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + duration);
            };
            // Bell chord: fundamental + harmonics
            playTone(523.25, 0, 1.8, 0.6);  // C5
            playTone(659.25, 0, 1.5, 0.4);  // E5
            playTone(783.99, 0, 1.5, 0.3);  // G5
            playTone(523.25, 0.15, 1.6, 0.3);  // C5 echo
        } catch (e) {
            // Fail silently if audio not available
        }
    }

    updateTimerDisplay() {
        const display = document.querySelector('.timer-display');
        const dashDisplay = document.getElementById('dashboard-timer');
        const btn = document.querySelectorAll('.start-timer-btn');

        const timeString = `${String(this.timer.minutes).padStart(2, '0')}:${String(this.timer.seconds).padStart(2, '0')}`;

        if (display) display.textContent = timeString;

        if (dashDisplay) {
            dashDisplay.textContent = timeString;
            dashDisplay.style.display = (this.timer.isRunning || (this.timer.minutes < 25 && this.timer.minutes > 0)) ? 'block' : 'none';
        }

        btn.forEach(b => {
            b.textContent = this.timer.isRunning ? 'Pause Timer' : (this.timer.minutes < 25 ? 'Resume Session' : 'Start Focus Session');
        });
    }

    // Tasks View
    renderTasksView() {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <nav class="top-nav">
                <div class="search-box">
                    <span style="opacity: 0.6;">🔍</span>
                    <input type="text" placeholder="Search your tasks..." id="search-input">
                </div>
            </nav>

            <header class="header-section">
                <h1>All Tasks</h1>
                <p>Manage your tasks with calm focus</p>
            </header>

            <div style="margin-bottom: 2rem;">
                <button class="btn-focus add-task-btn">+ Add New Task</button>
            </div>

            <div class="card">
                <div class="task-list" id="task-list">
                    ${this.tasks.length === 0 ? '<div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">🍃</div>Your task list is a blank canvas.<br>Add a task to start organizing your day.</div>' : this.renderFullTaskList()}
                </div>
            </div>
        `;
        this.setupSearchFilter();
    }

    renderFullTaskList() {
        return this.tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="checkbox ${task.completed ? 'checked' : ''}">${task.completed ? '✓' : ''}</div>
                <div class="task-info">
                    <span class="task-name" style="${task.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${this.sanitize(task.name)}</span>
                    <div class="task-meta">
                        ${task.category || 'General'} ${task.priority ? '• ' + task.priority : ''}
                        <span class="pro-badge-mini" title="Pro Feature: Alarms" onclick="window.organizoApp.showProModal(); event.stopPropagation();">🔔</span>
                    </div>
                </div>
                <span class="tag-priority ${task.priority === 'High' ? 'high' : ''}">${task.priority || 'Normal'}</span>
                <button class="delete-task" style="background: none; border: none; color: #EF4444; cursor: pointer; margin-left: 8px; font-size: 1.5rem;">×</button>
            </div>
        `).join('');
    }

    // Calendar View - Full Monthly View
    renderCalendarView() {
        const mainContent = document.querySelector('.main-content');
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDay = firstDayOfMonth.getDay(); // 0-6
        const totalDays = lastDayOfMonth.getDate();

        const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long' });

        const days = [];
        // Padding days for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i));
        }

        mainContent.innerHTML = `
            <nav class="top-nav">
                <div class="search-box">
                    <span style="opacity: 0.6;">🔍</span>
                    <input type="text" placeholder="Search events..." id="search-input" style="color: var(--text-dark); background: transparent; border: none; width: 100%; outline: none;">
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <button class="btn-focus today-btn" style="padding: 8px 18px; font-size: 0.85rem; background: #FFFFFF; color: #1E293B; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; cursor: pointer; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">Today</button>
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent-green); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">${this.userData.initials}</div>
                </div>
            </nav>

            <header class="header-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; padding-top: 1rem;">
                <div>
                    <h1 style="font-family: 'Playfair Display', serif; font-size: 2.8rem; color: #FFFFFF; margin-bottom: 0.5rem; text-shadow: 0 4px 12px rgba(0,0,0,0.2);">${monthName} ${year}</h1>
                    <p style="color: rgba(255,255,255,0.7); font-size: 1.1rem; font-weight: 500;">Structure your schedule with intention.</p>
                </div>
                <div style="display: flex; gap: 0.8rem;">
                    <button class="btn-focus prev-month" style="background: #FFFFFF; color: #1E293B; border: none; width: 48px; height: 48px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.4rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">←</button>
                    <button class="btn-focus next-month" style="background: #FFFFFF; color: #1E293B; border: none; width: 48px; height: 48px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.4rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">→</button>
                </div>
            </header>

            <div class="calendar-grid-header" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1rem; margin-bottom: 1.5rem; text-align: center; color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
                ${days.map(day => {
            if (!day) return `<div class="empty-day" style="background: rgba(0,0,0,0.02); height: 120px; border-radius: 12px; border: 1px dashed rgba(0,0,0,0.05);"></div>`;

            const dateStr = day.toDateString();
            const holiday = this.holidays[dateStr];
            const dailyEvents = this.events.filter(e => e.date === dateStr);
            const isToday = day.toDateString() === new Date().toDateString();

            return `
                        <div class="calendar-day-card ${isToday ? 'today' : ''}" 
                             data-date="${dateStr}" style="background: var(--card-bg); border-color: var(--border-color);">
                            
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div class="day-num" style="font-size: 1.1rem; font-weight: 700; color: ${isToday ? 'var(--accent-green)' : 'var(--text-dark)'}; opacity: ${isToday ? '1' : '0.8'};">${day.getDate()}</div>
                                ${holiday ? `<span title="${holiday}" style="font-size: 1rem;">🎁</span>` : ''}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 5px; flex-grow: 1;">
                                ${this.renderCalendarTasks(day)}
                                ${dailyEvents.map(ev => `
                                    <div class="${ev.type === 'Deadline' ? 'badge-deadline' : 'badge-event'}">
                                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.sanitize(ev.name)}</span>
                                        <span class="delete-event" data-event-id="${ev.id}" style="cursor: pointer; padding-left: 4px; padding-right: 2px;">×</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            ${holiday ? `<div style="font-size: 0.52rem; color: #EF4444; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${holiday}</div>` : ''}
                        </div>
                    `}).join('')}
            </div>
        `;
        this.setupSearchFilter();
    }

    renderCalendarTasks(date) {
        const dateString = date.toDateString();
        const tasksForDay = this.tasks.filter(t => {
            if (!t.createdAt) return false;
            const taskDate = new Date(t.createdAt).toDateString();
            return taskDate === dateString;
        });

        if (tasksForDay.length === 0) return '<div style="font-size: 1.5rem; opacity: 0.2;">🍃</div>';

        return `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                ${tasksForDay.slice(0, 3).map(t => `
                    <div style="width: 100%; height: 6px; background: ${t.completed ? 'var(--accent-green)' : '#E2E8F0'}; border-radius: 10px;" title="${this.sanitize(t.name)}"></div>
                `).join('')}
                ${tasksForDay.length > 3 ? `<div style="font-size: 0.7rem; color: var(--text-muted);">+${tasksForDay.length - 3} more</div>` : ''}
            </div>
        `;
    }

    getHolidays() {
        // Mock Holiday Database (expanding as needed)
        return {
            "Wed Jan 01 2025": "New Year's Day",
            "Sun Jan 26 2025": "Republic Day",
            "Fri Mar 14 2025": "Holi",
            "Fri Apr 18 2025": "Good Friday",
            "Thu May 01 2025": "Labour Day",
            "Fri Aug 15 2025": "Independence Day",
            "Thu Oct 02 2025": "Gandhi Jayanti",
            "Mon Oct 20 2025": "Diwali",
            "Thu Dec 25 2025": "Christmas",
            "Thu Jan 01 2026": "New Year's Day",
            "Mon Jan 26 2026": "Republic Day",
            "Sat Feb 14 2026": "Valentine's Day",
            "Sat Feb 21 2026": "International Mother Language Day",
            "Sun Mar 01 2026": "🚀 Project Launch Deadline",
            "Sun Mar 08 2026": "International Women's Day"
        };
    }

    showAddEventModal(dateStr) {
        // Fetch all tasks for this day for transparency
        const date = new Date(dateStr);
        const tasksForDay = this.tasks.filter(t => {
            if (!t.createdAt) return false;
            return new Date(t.createdAt).toDateString() === date.toDateString();
        });

        const holiday = this.holidays[dateStr];
        const eventsForDay = this.events.filter(e => e.date === dateStr);

        // 🔧 FIX: declare modal before using it
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px; padding: 2.5rem; max-height: 85vh; overflow-y: auto;">
                <h3 style="margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">Plan for ${dateStr}</h3>
                
                ${holiday ? `<div style="background: #FEF2F2; color: #EF4444; border-radius: 8px; padding: 12px; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 10px;"><span style="font-size:1.2rem">🎁</span> ${holiday}</div>` : ''}

                ${eventsForDay.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 0.75rem; font-weight: 700;">Scheduled Events</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${eventsForDay.map(ev => `
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 14px;">
                                <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-dark); flex: 1;">
                                    ${ev.type === 'Deadline' ? '🚨' : ev.type === 'Meeting' ? '🤝' : '✨'} ${this.sanitize(ev.name)}
                                </span>
                                <button class="modal-delete-event-btn" data-event-id="${ev.id}" style="background: #FEF2F2; color: #EF4444; border: 1px solid #FECACA; border-radius: 8px; padding: 4px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; flex-shrink: 0;">Delete</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                ` : ''}

                ${tasksForDay.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 1rem; font-weight: 700;">Daily Flow Tasks</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${tasksForDay.map(t => `
                            <div class="modal-task-toggle" data-task-id="${t.id}" style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: ${t.completed ? 'var(--accent-green)' : 'var(--text-dark)'}; cursor: pointer; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 8px;">
                                <span>${t.completed ? '🟢' : '⚪'}</span>
                                <span style="${t.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this.sanitize(t.name)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                ` : ''}

                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 1rem; font-weight: 700;">Add New Event</div>
                <input type="text" id="event-name" placeholder="Milestone or Deadline title" class="input-field" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1rem; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box;">
                <select id="event-type" class="input-field" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1.5rem; background: var(--input-bg); color: var(--text-dark);">
                    <option value="Event">✨ Simple Event</option>
                    <option value="Deadline">🚨 Important Deadline</option>
                    <option value="Meeting">🤝 Meeting</option>
                </select>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn-focus" id="save-event-btn" style="flex: 1;">Save to Schedule</button>
                    <button class="btn-focus cancel-modal-btn" style="flex: 1; background: var(--card-bg); color: var(--text-dark); border: 1px solid var(--border-color);">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Delete buttons inside the modal
        modal.querySelectorAll('.modal-delete-event-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.eventId);
                this.deleteEvent(id);
                modal.remove();
                this.showAddEventModal(dateStr); // Re-open refreshed
            });
        });

        modal.querySelector('.cancel-modal-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('#save-event-btn').addEventListener('click', () => {
            const name = document.getElementById('event-name').value.trim();
            const type = document.getElementById('event-type').value;
            if (name) {
                this.events.push({ id: Date.now(), name, type, date: dateStr });
                this.saveData('events', this.events);
                this.renderCalendarView();
                modal.remove();
            }
        });
    }

    deleteEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        this.saveData('events', this.events);
        this.renderCalendarView();
    }

    // Insights View
    renderInsightsView() {
        const totalFocusMinutes = this.focusTime.total;
        const totalSessions = this.focusTime.sessions.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;

        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <nav class="top-nav">
                <div class="search-box">
                    <span style="opacity: 0.6;">🔍</span>
                    <input type="text" placeholder="Search activity..." id="search-input">
                </div>
            </nav>

            <header class="header-section">
                <h1>Insights</h1>
                <p>Your productivity journey</p>
            </header>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="card" style="text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Total Focus Time</div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-green);">${this.formatMinutes(totalFocusMinutes)}</div>
                </div>
                <div class="card" style="text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Focus Sessions</div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-green);">${totalSessions}</div>
                </div>
                <div class="card" style="text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Tasks Completed</div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-green);">${completedTasks}</div>
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 1.5rem;">Recent Activity</h3>
                ${this.renderRecentActivity()}
            </div>

            ${this.isPro ? `
                <div class="card" style="margin-top: 1.5rem; text-align: center;">
                    <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">🛡️ Data Portability</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">Download a full JSON backup of your tasks, habits, and focus logs.</p>
                    <button class="btn-focus" id="export-data-btn" style="background: var(--accent-green); width: 100%; max-width: 300px;">Download Data Backup</button>
                </div>
            ` : ''}
        `;

        if (this.isPro) {
            setTimeout(() => {
                document.getElementById('export-data-btn')?.addEventListener('click', () => this.exportData());
            }, 100);
        }
        this.setupSearchFilter();
    }

    exportData() {
        const fullData = {
            tasks: this.tasks,
            habits: this.habits,
            events: this.events,
            theme: this.theme,
            isPro: this.isPro,
            dailyIntention: this.dailyIntention,
            streakData: this.streakData,
            notes: this.notes,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organizo_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    renderRecentActivity() {
        const recentSessions = this.focusTime.sessions.slice(-5).reverse();
        const recentTasks = this.tasks.filter(t => t.completed).slice(-5).reverse();

        if (recentSessions.length === 0 && recentTasks.length === 0) {
            return '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No activity yet. Start a focus session or complete a task!</div>';
        }

        const activities = [
            ...recentSessions.map(s => ({
                type: 'session',
                time: new Date(s.completedAt),
                text: `Completed ${s.duration}min focus session`
            })),
            ...recentTasks.map(t => ({
                type: 'task',
                time: new Date(t.completedAt),
                text: `Completed: ${this.sanitize(t.name)}`
            }))
        ].sort((a, b) => b.time - a.time).slice(0, 10);

        return activities.map(activity => `
            <div style="padding: 1rem 0; border-bottom: 1px solid rgba(0,0,0,0.03);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.5rem;">${activity.type === 'session' ? '⏱️' : '✅'}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${activity.text}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${this.formatRelativeTime(activity.time)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Intention Management
    editIntention() {
        const intentionDisplay = document.getElementById('intention-display');
        if (!intentionDisplay || intentionDisplay.querySelector('input')) return;

        const currentIntention = this.dailyIntention && this.dailyIntention !== 'Click to set your daily intention...' ? this.dailyIntention : '';

        intentionDisplay.innerHTML = `
            <div style="position: relative; display: inline-block; width: 100%; max-width: 600px;">
                <input type="text" id="intention-input" value="${this.sanitize(currentIntention)}" 
                       style="width: 100%; padding: 12px; border: 2px solid var(--accent-green); border-radius: 8px; font-size: 1.5rem; font-family: 'Playfair Display', serif; font-style: italic; text-align: center;"
                       placeholder="What's your single focus for today?">
                <button class="random-affirmation-btn" title="Give me a Zen intention" 
                        style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 1.2rem; cursor: pointer;">✨</button>
            </div>
        `;

        const input = document.getElementById('intention-input');
        input.focus();
        if (currentIntention) input.select();

        const editBtn = document.querySelector('.edit-intention-btn');
        if (editBtn) {
            editBtn.textContent = 'Save Intention';
            editBtn.classList.add('save-intention-btn');
            editBtn.classList.remove('edit-intention-btn');
        }
    }

    saveIntention() {
        const input = document.getElementById('intention-input');
        if (input) {
            this.dailyIntention = input.value.trim() || 'Click to set your daily intention...';
            this.saveData('dailyIntention', this.dailyIntention);
            this.renderDashboard();
        }
    }

    generateAffirmation() {
        const affirmations = [
            "I move through my day with presence and ease.",
            "My productivity is a flow, not a fight.",
            "I am focused on what truly matters.",
            "Small steps lead to beautiful journeys.",
            "I respect my energy and my boundaries.",
            "Clear space, clear mind, clear heart.",
            "I am the architect of my own peace."
        ];
        const random = affirmations[Math.floor(Math.random() * affirmations.length)];
        const input = document.getElementById('intention-input');
        if (input) {
            input.value = random;
            input.focus();
        }
    }

    // Habit Management
    toggleHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            habit.completedToday = !habit.completedToday;
            if (habit.completedToday) {
                habit.streak++;
                habit.history.push(new Date().toISOString());
            } else {
                habit.streak = Math.max(0, habit.streak - 1);
                habit.history.pop();
            }
            this.saveData('habits', this.habits);
            this.renderDashboard();
        }
    }

    // Utility Functions
    setupHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input, textarea, or contenteditable
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    this.showAddTaskModal();
                    break;
                case 'f':
                    e.preventDefault();
                    if (this.currentView !== 'timer') {
                        this.switchView('timer');
                    } else {
                        if (this.timer.isRunning) {
                            this.pauseTimer();
                        } else {
                            this.startTimer();
                        }
                    }
                    break;
                case '/':
                    e.preventDefault();
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) searchInput.focus();
                    break;
            }
        });
    }

    setupSearchFilter() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();

                // Filter task items (Dashboard + Tasks views)
                document.querySelectorAll('.task-item').forEach(item => {
                    const taskName = item.querySelector('.task-name');
                    if (taskName) {
                        item.style.display = taskName.textContent.toLowerCase().includes(query) ? 'flex' : 'none';
                    }
                });

                // Filter habit items (Dashboard view)
                document.querySelectorAll('.habit-item, .stat-item').forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(query) ? '' : 'none';
                });

                // Filter calendar day cards (Calendar view)
                document.querySelectorAll('.calendar-day-card').forEach(card => {
                    if (!query) {
                        card.style.opacity = '1';
                        return;
                    }
                    const text = card.textContent.toLowerCase();
                    card.style.opacity = text.includes(query) ? '1' : '0.3';
                });

                // Filter activity entries (Insights view)
                document.querySelectorAll('[style*="border-bottom: 1px solid"]').forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (item.closest('.card')) {
                        item.style.display = text.includes(query) ? '' : 'none';
                    }
                });
            });
        }
    }

    updateGreeting() {
        const greeting = document.getElementById('greeting');
        if (greeting) {
            const hour = new Date().getHours();
            const displayName = this.userData.name || 'Friend';
            if (hour < 12) greeting.textContent = `Good morning, ${displayName} ☀️`;
            else if (hour < 17) greeting.textContent = `Good afternoon, ${displayName} 🌤️`;
            else if (hour < 20) greeting.textContent = `Good evening, ${displayName} 🌅`;
            else greeting.textContent = `Good night, ${displayName} 🌙`;
        }
    }

    updateDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const options = { weekday: 'long', month: 'short', day: 'numeric' };
            dateElement.textContent = new Date().toLocaleDateString('en-US', options);
        }
    }

    formatFocusTime() {
        const todaySessions = this.focusTime.sessions.filter(s => this.isToday(s.completedAt));
        const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        return this.formatMinutes(totalMinutes);
    }

    formatMinutes(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    }

    isToday(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    calculateWeeklyProgress() {
        const completedThisWeek = this.tasks.filter(t => {
            if (!t.completed || !t.completedAt) return false;
            const completedDate = new Date(t.completedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return completedDate > weekAgo;
        }).length;

        const totalTasks = this.tasks.length || 1;
        return Math.min(100, Math.round((completedThisWeek / totalTasks) * 100));
    }

    showProfileModal() {
        // Legacy — now routes to color palette
        this.showColorPalette();
    }

    // ─── COLOR PALETTE (Avatar click) ───────────────────────────
    showColorPalette() {
        const themes = [
            { id: 'bamboo', name: 'Bamboo', icon: '🍃', color: '#10B981', desc: 'Fresh & calm' },
            { id: 'sakura', name: 'Sakura', icon: '🌸', color: '#F43F5E', desc: 'Soft & warm' },
            { id: 'ocean', name: 'Ocean', icon: '🌊', color: '#0EA5E9', desc: 'Deep & cool' },
            { id: 'sandstone', name: 'Sandstone', icon: '🏕️', color: '#D97706', desc: 'Earthy & cosy' },
            { id: 'sunset', name: 'Sunset', icon: '🌆', color: '#A855F7', desc: 'Bold & vibrant' },
            { id: 'peaks', name: 'Peaks', icon: '⛰️', color: '#64748B', desc: 'Quiet & minimal' },
        ];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 440px; padding: 2rem; border-radius: 28px; text-align: center;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎨</div>
                <h2 style="margin-bottom: 0.25rem; font-family: 'Playfair Display', serif;">Choose Your Vibe</h2>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.75rem;">Pick a color palette for your sanctuary</p>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; margin-bottom: 1.5rem;">
                    ${themes.map(t => `
                        <button class="theme-swatch" data-theme="${t.id}"
                            style="
                                padding: 1rem 0.5rem;
                                border-radius: 18px;
                                border: 3px solid ${this.theme === t.id ? t.color : 'transparent'};
                                background: ${this.theme === t.id ? t.color + '18' : 'var(--streak-pill, rgba(0,0,0,0.04))'};
                                cursor: pointer;
                                transition: all 0.25s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 6px;
                            "
                            title="${t.name}">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${t.color}; box-shadow: 0 4px 12px ${t.color}55; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">${t.icon}</div>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-dark);">${t.name}</span>
                            <span style="font-size: 0.65rem; color: var(--text-muted);">${t.desc}</span>
                        </button>
                    `).join('')}
                </div>

                <button onclick="this.closest('.modal-overlay').remove(); window.organizoApp.showSettingsModal();"
                    style="width: 100%; padding: 12px; border-radius: 14px; background: none; border: 1.5px solid var(--border-color); color: var(--text-dark); cursor: pointer; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    ⚙️ Open Settings
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelectorAll('.theme-swatch').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (btn.dataset.theme !== this.theme) btn.style.transform = 'translateY(-4px) scale(1.04)';
            });
            btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
            btn.addEventListener('click', () => {
                const t = themes.find(t => t.id === btn.dataset.theme);
                if (!t) return;
                this.setTheme(t.id);
                modal.querySelectorAll('.theme-swatch').forEach(b => {
                    const tb = themes.find(x => x.id === b.dataset.theme);
                    b.style.borderColor = b.dataset.theme === t.id ? tb.color : 'transparent';
                    b.style.background = b.dataset.theme === t.id ? tb.color + '18' : 'var(--streak-pill, rgba(0,0,0,0.04))';
                });
                this.showToast(`${t.icon} ${t.name} theme applied!`);
            });
        });
    }

    // ─── SETTINGS MODAL (Gear icon) ──────────────────────────
    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);';
        const nameVal = this.sanitize(this.userData.name || '');
        const emailVal = this.sanitize(this.userData.email || '');
        const isDark = this.isDarkMode;

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 420px; padding: 2rem; border-radius: 28px;">
                <button class="close-modal-btn" onclick="this.closest('.modal-overlay').remove()"
                    style="position: absolute; top: 14px; right: 14px; background: var(--streak-pill, rgba(0,0,0,0.05)); border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;">×</button>

                <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">⚙️</div>
                <h2 style="margin-bottom: 0.2rem; font-family: 'Playfair Display', serif;">Settings</h2>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 1.75rem;">Customize your OrganizO experience</p>

                <!-- Profile Section -->
                <div style="background: var(--streak-pill, rgba(0,0,0,0.04)); border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem;">
                    <div style="font-size: 0.7rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem;">Profile</div>
                    <input type="text" id="settings-name" value="${nameVal}" placeholder="Your name"
                        style="width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-color); border-radius: 12px; font-size: 0.95rem; color: var(--text-dark); background: var(--input-bg, white); box-sizing: border-box; outline: none; margin-bottom: 0.75rem;">
                    <input type="email" id="settings-email" value="${emailVal}" placeholder="Gmail address (optional)"
                        style="width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-color); border-radius: 12px; font-size: 0.95rem; color: var(--text-dark); background: var(--input-bg, white); box-sizing: border-box; outline: none;">
                    <button id="settings-save-name" class="btn-focus" style="width: 100%; padding: 10px; border-radius: 12px; margin-top: 0.75rem; font-size: 0.9rem;">Save Profile</button>
                </div>

                <!-- Dark Mode Toggle -->
                <div style="background: var(--streak-pill, rgba(0,0,0,0.04)); border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.4rem;">${isDark ? '🌙' : '☀️'}</span>
                        <div>
                            <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-dark);">Night Mode</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${isDark ? 'Dark background active' : 'Light mode active'}</div>
                        </div>
                    </div>
                    <label style="position: relative; display: inline-block; width: 52px; height: 28px; cursor: pointer;">
                        <input type="checkbox" id="settings-dark-mode" ${isDark ? 'checked' : ''} style="opacity:0; width:0; height:0;">
                        <span id="dark-toggle-track" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${isDark ? 'var(--accent-green)' : '#CBD5E1'}; border-radius: 28px; transition: 0.3s;">
                            <span id="dark-toggle-thumb" style="position: absolute; width: 20px; height: 20px; background: white; border-radius: 50%; top: 4px; left: ${isDark ? '28px' : '4px'}; transition: 0.3s; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></span>
                        </span>
                    </label>
                </div>

                <!-- Notifications Toggle -->
                <div style="background: var(--streak-pill, rgba(0,0,0,0.04)); border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.4rem;">🔔</span>
                        <div>
                            <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-dark);">Notifications</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Deadline & end-of-day alerts</div>
                        </div>
                    </div>
                    <button id="settings-notif-btn" onclick="window.organizoApp.requestNotificationPermission()"
                        style="padding: 7px 14px; border-radius: 10px; border: 1.5px solid var(--accent-green); color: var(--accent-green); background: rgba(16,185,129,0.08); font-size: 0.8rem; font-weight: 700; cursor: pointer;">
                        ${Notification && Notification.permission === 'granted' ? '✅ Enabled' : 'Enable'}
                    </button>
                </div>

                <!-- Export Data -->
                <button onclick="window.organizoApp.exportData()"
                    style="width: 100%; padding: 12px; border-radius: 14px; border: 1.5px solid var(--border-color); background: none; color: var(--text-dark); font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 0.75rem;">
                    📥 Export Backup (JSON)
                </button>

                <!-- Open Color Palette -->
                <button onclick="this.closest('.modal-overlay').remove(); window.organizoApp.showColorPalette();"
                    style="width: 100%; padding: 12px; border-radius: 14px; border: 1.5px solid var(--border-color); background: none; color: var(--text-dark); font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    🎨 Change Theme Color
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        // Save name handler
        modal.querySelector('#settings-save-name').addEventListener('click', () => {
            const name = document.getElementById('settings-name').value.trim();
            const email = document.getElementById('settings-email').value.trim();
            if (!name) { document.getElementById('settings-name').style.borderColor = '#EF4444'; return; }
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            this.userData = { name, initials, email };
            this.saveData('userData', this.userData);
            this.updateUserUI();
            this.renderDashboard();
            this.showToast('Profile saved! 🌿');
        });

        // Dark mode toggle
        modal.querySelector('#settings-dark-mode').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
            const thumb = document.getElementById('dark-toggle-thumb');
            const track = document.getElementById('dark-toggle-track');
            if (thumb) thumb.style.left = this.isDarkMode ? '28px' : '4px';
            if (track) track.style.background = this.isDarkMode ? 'var(--accent-green)' : '#CBD5E1';
        });
    }

    toggleDarkMode(forceState = null) {
        this.isDarkMode = forceState !== null ? forceState : !this.isDarkMode;
        this.saveData('isDarkMode', this.isDarkMode);
        this.applyTheme();
        this.updateUserUI();
        this.showToast(this.isDarkMode ? '🌙 Night mode on' : '☀️ Light mode on');
        
        // Update any specific dashboard elements if they exist
        if (this.currentView === 'dashboard') this.renderDashboard();
    }

    showProfileEditModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const initials = this.userData.initials || '??';
        const emailVal = this.userData.email || '';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-green), #059669); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; color: white; margin: 0 auto 1.5rem; box-shadow: 0 8px 24px var(--accent-green-glow);">${this.sanitize(initials)}</div>
                <h3 style="margin-bottom: 0.25rem;">Edit Profile</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">Personalize your sanctuary</p>

                <input type="text" id="edit-user-name" value="${this.sanitize(this.userData.name)}" placeholder="Your Name" class="input-field" style="width: 100%; padding: 12px 16px; border: 1.5px solid var(--border-color); border-radius: 12px; margin-bottom: 1rem; font-size: 0.95rem; color: var(--text-dark); background: var(--input-bg); box-sizing: border-box; outline: none;">
                <input type="email" id="edit-user-email" value="${this.sanitize(emailVal)}" placeholder="Gmail Address (optional)" class="input-field" style="width: 100%; padding: 12px 16px; border: 1.5px solid var(--border-color); border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--text-dark); background: var(--input-bg); box-sizing: border-box; outline: none;">

                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <button id="save-profile-btn" class="btn-focus" style="flex: 1; padding: 12px; border-radius: 12px;">Save Changes</button>
                    <button id="close-profile-modal" class="btn-focus" style="flex: 1; padding: 12px; border-radius: 12px; background: var(--card-bg); color: var(--text-dark); border: 1px solid var(--border-color);">Cancel</button>
                </div>

                <div style="border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
                    <button id="export-data-btn" style="width: 100%; padding: 10px; border-radius: 10px; background: none; border: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        📥 Export Backup (JSON)
                    </button>
                </div>
            </div>
        `;

        modal.querySelector('#close-profile-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#save-profile-btn').addEventListener('click', () => {
            const newName = document.getElementById('edit-user-name').value.trim();
            const newEmail = document.getElementById('edit-user-email').value.trim();

            if (!newName) {
                document.getElementById('edit-user-name').style.borderColor = '#EF4444';
                document.getElementById('edit-user-name').focus();
                return;
            }
            const newInitials = newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            this.userData = { name: newName, initials: newInitials, email: newEmail };
            this.saveData('userData', this.userData);
            this.updateUserUI();
            this.renderDashboard();
            modal.remove();
            this.showToast('Profile updated! 🌿');
        });

        modal.querySelector('#export-data-btn').addEventListener('click', () => this.exportData());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    }

    exportData() {
        // Gather all organizo_ prefixed data
        const backupData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('organizo_')) {
                try {
                    backupData[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    backupData[key] = localStorage.getItem(key);
                }
            }
        }

        // Create Blob and Download
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `organizo-backup-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    showFeedbackModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; text-align: left;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">💌 Send Feedback</h3>
                    <button id="close-feedback-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">×</button>
                </div>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; background: var(--app-bg); padding: 10px; border-radius: 8px; border-left: 3px solid var(--accent-green);">
                    🔒 <strong>Privacy Note:</strong> Your feedback goes directly to the creator. No third-party tracking.
                </p>
                
                <form id="feedback-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; gap: 1rem;">
                        <div style="flex: 1;">
                            <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Name (Optional)</label>
                            <input type="text" id="feedback-name" placeholder="Your Name" class="input-field" style="width: 100%; padding: 10px; border: 1px solid #E2E8F0; border-radius: 8px;">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Email (Optional)</label>
                            <input type="email" id="feedback-email" placeholder="Your Email" class="input-field" style="width: 100%; padding: 10px; border: 1px solid #E2E8F0; border-radius: 8px;">
                        </div>
                    </div>
                    
                    <div>
                        <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Feature Requests? (Optional)</label>
                        <input type="text" id="feedback-feature" placeholder="What should I build next?" class="input-field" style="width: 100%; padding: 10px; border: 1px solid #E2E8F0; border-radius: 8px;">
                    </div>
                    
                    <div>
                        <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Feedback Message ⭐ <span style="color: #EF4444;">*</span></label>
                        <textarea id="feedback-message" required placeholder="How is OrganizO helping you focus?" class="input-field" style="width: 100%; padding: 10px; border: 1px solid #E2E8F0; border-radius: 8px; min-height: 100px; resize: vertical; font-family: inherit;"></textarea>
                    </div>
                    
                    <div>
                        <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Rating (Optional)</label>
                        <select id="feedback-rating" class="input-field" style="width: 100%; padding: 10px; border: 1px solid #E2E8F0; border-radius: 8px; background: white;">
                            <option value="">Select a rating</option>
                            <option value="5">⭐⭐⭐⭐⭐ - Loving it!</option>
                            <option value="4">⭐⭐⭐⭐ - Really good</option>
                            <option value="3">⭐⭐⭐ - It's okay</option>
                            <option value="2">⭐⭐ - Needs work</option>
                            <option value="1">⭐ - Not for me</option>
                        </select>
                    </div>

                    <div id="feedback-status" style="font-size: 0.85rem; margin-top: 4px; display: none;"></div>
                    
                    <button type="submit" id="submit-feedback-btn" class="btn-focus" style="width: 100%; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        Send Message 🚀
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#close-feedback-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        const form = modal.querySelector('#feedback-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.submitFeedback(form, modal);
        });
    }

    async submitFeedback(form, modal) {
        const btn = form.querySelector('#submit-feedback-btn');
        const statusDiv = form.querySelector('#feedback-status');

        // --- 🔴 REPLACE THESE WITH YOUR ACTUAL EMAILJS KEYS 🔴 ---
        const EMAILJS_SERVICE_ID = 'service_hixicbb';
        const EMAILJS_TEMPLATE_ID = 'template_n8iicfh';
        const EMAILJS_PUBLIC_KEY = 'KiOeDXotSGoSAOZJm';
        // --------------------------------------------------------

        const payload = {
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: {
                from_name: this.sanitize(form.querySelector('#feedback-name').value) || this.userData.name || 'Anonymous User',
                reply_to: this.sanitize(form.querySelector('#feedback-email').value) || 'No Email Provided',
                message: this.sanitize(form.querySelector('#feedback-message').value),
                feature_request: this.sanitize(form.querySelector('#feedback-feature').value) || 'None',
                rating: form.querySelector('#feedback-rating').value || 'Not Rated'
            }
        };

        btn.disabled = true;
        btn.innerHTML = '<div class="zen-loader" style="font-size: 1rem; margin: 0; animation: pulse 1s infinite;">🌿</div> Sending...';
        statusDiv.style.display = 'none';

        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                btn.innerHTML = '✅ Sent Successfully!';
                btn.style.background = 'var(--accent-green)';
                setTimeout(() => modal.remove(), 2000);
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            btn.disabled = false;
            btn.innerHTML = 'Try Again 🚀';
            statusDiv.style.display = 'block';
            statusDiv.style.color = '#EF4444';
            statusDiv.textContent = '❌ Failed to connect to EmailJS. Have you replaced the API keys in app.js?';
        }
    }

    // ─── THEME SYSTEM ───────────────────────────────────────────
    applyTheme() {
        document.body.className = 'app-body'; // reset all

        let hexColor = '#10B981'; // bamboo default

        if (this.theme !== 'bamboo') {
            document.body.classList.add(`theme-${this.theme}`);
            if (this.theme === 'sakura') hexColor = '#F43F5E';
            if (this.theme === 'ocean') hexColor = '#0EA5E9';
            if (this.theme === 'sandstone') hexColor = '#D97706';
            if (this.theme === 'sunset') hexColor = '#A855F7';
            if (this.theme === 'peaks') hexColor = '#64748B';
        }

        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            hexColor = '#0F172A'; // Midnight background base
        }

        // Sync Browser Address Bar/Status Bar Color
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', hexColor);
        } else {
            const meta = document.createElement('meta');
            meta.name = "theme-color";
            meta.content = hexColor;
            document.head.appendChild(meta);
        }
    }

    setTheme(newTheme) {
        this.theme = newTheme;
        this.saveData('theme', this.theme);
        this.applyTheme();
    }

    showProfileModal2() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const themes = [
            { id: 'bamboo', name: 'Bamboo Forest', icon: '🎋', color: '#10B981' },
            { id: 'sakura', name: 'Sakura Blush', icon: '🌸', color: '#F43F5E' },
            { id: 'ocean', name: 'Deep Ocean', icon: '🌊', color: '#0EA5E9' },
            { id: 'sandstone', name: 'Warm Sandstone', icon: '🏜️', color: '#D97706' },
            { id: 'sunset', name: 'Purple Sunset', icon: '🌆', color: '#A855F7' },
            { id: 'peaks', name: 'Misty Peaks', icon: '⛰️', color: '#64748B' }
        ];

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px; text-align: left; position: relative;">
                <button class="close-modal-btn btn-focus" style="position: absolute; top: 15px; right: 15px; width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--streak-pill); color: var(--text-dark); border-radius: 50%;">×</button>
                <div id="dev-pro-toggle" style="font-size: 2.5rem; margin-bottom: 0.5rem; text-align: center; cursor: pointer; user-select: none;">🎨</div>
                <h2 style="margin-bottom: 0.5rem; text-align: center; color: var(--text-dark);">Customize Your Space</h2>
                <p style="color: var(--text-muted); text-align: center; margin-bottom: 1.5rem; font-size: 0.9rem;">Select a theme to match your current vibe</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1.5rem;">
                    ${themes.map(t => {
            const isLocked = t.id !== 'bamboo' && !this.isPro;
            return `
                        <div class="theme-option" data-theme="${t.id}" data-locked="${isLocked}" style="padding: 12px; border-radius: 12px; border: 2px solid ${this.theme === t.id ? t.color : 'var(--border-color)'}; background: var(--streak-pill); cursor: ${isLocked ? 'pointer' : 'pointer'}; display: flex; align-items: center; gap: 10px; transition: border 0.3s ease; opacity: ${isLocked && this.theme !== t.id ? '0.7' : '1'}; position: relative;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${t.color}; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${t.icon}</div>
                            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark);">${t.name}</span>
                            ${isLocked ? '<span style="position: absolute; right: 10px; font-size: 0.9rem;" title="Pro Feature">🔒</span>' : ''}
                        </div>
                    `}).join('')}
                </div>

                <div style="background: var(--streak-pill); border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.5rem;">🌙</span>
                        <div>
                            <div style="font-weight: 700; color: var(--text-dark); font-size: 0.9rem;">Universal Night Mode</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Dark background for all themes</div>
                        </div>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 26px;">
                        <input type="checkbox" id="dark-mode-toggle" ${this.isDarkMode ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${this.isDarkMode ? 'var(--accent-green)' : '#ccc'}; transition: .4s; border-radius: 34px;">
                            <span style="position: absolute; content: ''; height: 18px; width: 18px; left: ${this.isDarkMode ? '28px' : '4px'}; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                        </span>
                    </label>
                </div>

                <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    <button class="btn-focus" onclick="window.organizoApp.isPro ? window.organizoApp.exportData() : window.organizoApp.showProModal()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: ${this.isPro ? 'var(--accent-green)' : 'var(--card-bg)'}; color: ${this.isPro ? 'white' : 'var(--text-dark)'}; border: ${this.isPro ? 'none' : '1px solid var(--border-color)'}; border-radius: 12px; padding: 12px; font-weight: 600;">
                        <span>☁️</span> ${this.isPro ? 'Manual Cloud Sync (Backup)' : 'Unlock Cloud Sync'}
                    </button>
                    <button onclick="window.organizoApp.showProfileEditModal(); this.closest('.modal-overlay').remove()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: none; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; font-weight: 600; cursor: pointer; color: var(--text-dark);">
                        <span>👤</span> Edit Profile & Name
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                if (e.currentTarget.dataset.locked === 'true') {
                    modal.remove();
                    this.showProModal();
                    return;
                }
                const newTheme = e.currentTarget.dataset.theme;
                this.setTheme(newTheme);
                modal.querySelectorAll('.theme-option').forEach(o => {
                    o.style.borderColor = 'var(--border-color)';
                });
                const tObj = themes.find(t => t.id === newTheme);
                e.currentTarget.style.borderColor = tObj.color;
            });
        });

        // Dark Mode Toggle
        modal.querySelector('#dark-mode-toggle').addEventListener('change', (e) => {
            if (!this.isPro) {
                e.target.checked = false;
                modal.remove();
                this.showProModal();
                return;
            }
            this.isDarkMode = e.target.checked;
            this.saveData('isDarkMode', this.isDarkMode);
            this.applyTheme();
            modal.remove();
            this.showProfileModal2();
        });

        modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Developer Secret: Toggle Pro by clicking palette 5 times
        let clickCount = 0;
        modal.querySelector('#dev-pro-toggle').addEventListener('click', () => {
            clickCount++;
            if (clickCount >= 5) {
                this.isPro = !this.isPro;
                this.saveData('isPro', this.isPro);
                this.showToast(this.isPro ? '🌿 OrganizO Pro Unlocked!' : 'Switched to Free Mode');
                this.updateUserUI();
                modal.remove();
                this.showProfileModal2();
            }
        });
    }

    // ─── END OF DAY REMINDER ─────────────────────────────────────
    setupEndOfDayReminder() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const scheduleReminder = () => {
            const now = new Date();
            const endOfDay = new Date();
            endOfDay.setHours(22, 0, 0, 0); // 10 PM

            // Also check at 9 PM
            const reminderTime1 = new Date();
            reminderTime1.setHours(21, 0, 0, 0);

            const checkAndNotify = () => {
                const remaining = this.tasks.filter(t => !t.completed);
                if (remaining.length === 0) return;

                const h = new Date().getHours();
                // Only notify between 9 PM and 11 PM
                if (h < 21 || h >= 23) return;

                const alreadyNotified = sessionStorage.getItem('organizo_eod_notified');
                if (alreadyNotified) return;

                sessionStorage.setItem('organizo_eod_notified', 'true');

                const msg = `You have ${remaining.length} task${remaining.length > 1 ? 's' : ''} remaining today. You've got this! 💪`;

                // In-app banner
                const banner = document.createElement('div');
                banner.style.cssText = `
                    position: fixed; bottom: 5rem; left: 50%; transform: translateX(-50%);
                    background: linear-gradient(135deg, #F59E0B, #D97706);
                    color: white; padding: 1rem 1.5rem; border-radius: 16px;
                    box-shadow: 0 8px 30px rgba(245,158,11,0.4); z-index: 9000;
                    font-size: 0.92rem; font-weight: 600; cursor: pointer;
                    display: flex; align-items: center; gap: 10px;
                    animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
                    max-width: 350px; text-align: left;
                `;
                banner.innerHTML = `<span style="font-size:1.5rem;">🌙</span><div><div style="font-size:0.7rem;opacity:0.8;margin-bottom:2px;">END OF DAY REMINDER</div>${msg}</div>`;
                banner.addEventListener('click', () => { banner.remove(); this.switchView('tasks'); });
                document.body.appendChild(banner);
                setTimeout(() => {
                    banner.style.opacity = '0';
                    banner.style.transition = 'opacity 0.5s';
                    setTimeout(() => banner.remove(), 500);
                }, 8000);

                // Native notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('OrganizO 🌙 Day ending soon...', {
                        body: msg,
                        icon: './images/icon-192.png'
                    });
                }
            };

            // Check every 30 minutes
            setInterval(checkAndNotify, 30 * 60 * 1000);
            // Also check immediately in case we're already in that window
            checkAndNotify();
        };

        scheduleReminder();
    }

    // ─── OFFLINE / ONLINE BANNER ─────────────────────────────────
    setFocusTask(taskId) {
        this.focusTaskId = taskId ? parseInt(taskId) : null;
        this.renderTimerView();
        if (this.focusTaskId) {
            const task = this.tasks.find(t => t.id === this.focusTaskId);
            this.showToast(`Target Set: ${task.text} 🎯`);
        }
    }

    setupOnlineOfflineBanner() {
        const showBanner = (online) => {
            const existing = document.getElementById('network-banner');
            if (existing) existing.remove();
            if (online) {
                const b = document.createElement('div');
                b.id = 'network-banner';
                b.style.cssText = `
                    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
                    background: linear-gradient(135deg, var(--accent-green), #059669);
                    color: white; text-align: center; padding: 8px;
                    font-size: 0.85rem; font-weight: 600;
                    animation: slideDown 0.3s ease;
                `;
                b.textContent = '✅ Back online — your data is safe locally.';
                document.body.appendChild(b);
                setTimeout(() => { b.style.opacity = '0'; b.style.transition = 'opacity 0.5s'; setTimeout(() => b.remove(), 500); }, 3000);
            } else {
                const b = document.createElement('div');
                b.id = 'network-banner';
                b.style.cssText = `
                    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
                    background: #374151; color: white; text-align: center; padding: 8px;
                    font-size: 0.85rem; font-weight: 600;
                `;
                b.textContent = '📵 You are offline — App works fully offline. All data saved locally.';
                document.body.appendChild(b);
            }
        };

        window.addEventListener('online', () => showBanner(true));
        window.addEventListener('offline', () => showBanner(false));

        // Show immediately if offline at startup
        if (!navigator.onLine) showBanner(false);
    }

    selectZenSound(id) {
        if (!this.isPro && id !== 'lofi') {
            this.showProModal();
            return;
        }
        
        this.selectedSound = id;
        const wasPlaying = this.audioPlaying;
        
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
        
        this.audioPlaying = false;
        
        const soundUrls = {
            'lofi': 'audio/lofi.mp3',
            'rain': 'audio/rain.mp3',
            'forest': 'audio/forest.mp3',
            'waves': 'audio/waves.mp3',
            'guitar': 'audio/guitar.mp3',
            'piano': 'audio/piano.mp3',
            'genshin': 'audio/genshin.mp3'
        };
        
        // Handle fallback logic for missing local files
        const audioSrc = soundUrls[id];
        this.audioPlayer = new Audio(audioSrc);
        
        // Error handling for missing files
        this.audioPlayer.onerror = () => {
            console.warn(`Sound missing: ${audioSrc}. Using fallback.`);
            if (id !== 'lofi') {
                this.audioPlayer.src = 'audio/lofi.mp3';
            }
        };
        this.audioPlayer.loop = true;
        const slider = document.getElementById('soundscape-volume');
        this.audioPlayer.volume = slider ? parseFloat(slider.value) : 0.5;
        
        if (wasPlaying) {
            this.toggleAudio();
        } else {
            this.renderTimerView();
        }
        this.showToast(`Selected: ${id.charAt(0).toUpperCase() + id.slice(1)} 🍃`);
    }

    toggleAudio() {
        if (!this.audioPlayer) {
            this.selectZenSound(this.selectedSound || 'lofi');
            return;
        }

        if (this.audioPlaying) {
            this.audioPlayer.pause();
            this.audioPlaying = false;
        } else {
            this.audioPlayer.play().then(() => {
                this.audioPlaying = true;
            }).catch(e => {
                alert("Please interact with the page first to allow audio playback.");
            });
        }
        this.renderTimerView();
    }

    updateVolume(val) {
        if (this.audioPlayer) {
            this.audioPlayer.volume = parseFloat(val);
        }
    }

    toggleZenMode() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert("Fullscreen Zen Mode not supported by your browser.");
            });
        } else {
            document.exitFullscreen();
        }
    }

    updateUserUI() {
        // Toggle Sidebar Pro link
        const sidebarPro = document.getElementById('sidebar-pro-link');
        if (sidebarPro) {
            sidebarPro.style.display = this.isPro ? 'none' : 'block';
        }

        // Update greeting
        const greeting = document.getElementById('greeting');
        if (greeting) {
            const hour = new Date().getHours();
            const displayName = this.userData.name || 'Friend';
            let g = 'Good morning';
            if (hour >= 12 && hour < 17) g = 'Good afternoon';
            else if (hour >= 17 && hour < 20) g = 'Good evening';
            else if (hour >= 20) g = 'Good night';
            greeting.textContent = `${g}, ${displayName}`;
        }

        // Update all avatars with gradient & pulsing ring hint
        document.querySelectorAll('.user-avatar').forEach(avatar => {
            const initials = this.userData.initials || '?';
            avatar.innerHTML = `
                ${this.sanitize(initials)}
                ${this.isPro ? '<div style="position: absolute; bottom: -2px; right: -2px; font-size: 0.6rem; background: var(--accent-green); color: white; border-radius: 4px; padding: 1px 3px; border: 1px solid white;">PRO</div>' : ''}
            `;
            avatar.style.position = 'relative';
            avatar.style.background = 'linear-gradient(135deg, var(--accent-green), #059669)';
            avatar.style.color = 'white';
            avatar.style.fontWeight = '700';
            // Subtle pulsing outline to signal clickability
            avatar.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.3), 0 0 0 6px rgba(16,185,129,0.1)';
            avatar.title = 'Click to customize theme & profile';
            avatar.style.cursor = 'pointer';
        });

        // Update Sidebar info
        const nameEl = document.querySelector('.sidebar-user .user-name');
        if (nameEl) nameEl.textContent = this.userData.name || 'Set your name →';

        // Sidebar user section hint
        const sidebarUser = document.querySelector('.sidebar-user');
        if (sidebarUser) {
            sidebarUser.title = 'Click to customize your app';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new OrganizOApp();
    window.organizoApp = app; // Keep global access if needed
    app.updateUserUI(); // Call updateUserUI after app initialization
});
