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
        this.userData = this.loadData('userData') || { name: 'Zen Seeker', initials: 'JS' };
        // Streak system
        this.streakData = this.loadData('streakData') || { currentStreak: 0, bestStreak: 0, lastActiveDate: null, history: [] };
        // OrganizO Pro
        this.isPro = this.loadData('isPro') || false;
        this.timer = {
            minutes: 25,
            seconds: 0,
            isRunning: false,
            interval: null,
            mode: 'focus'
        };
        this.calendarDate = new Date();

        this.renderDashboard();
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
    }

    checkOnboarding() {
        const hasSeenOnboarding = localStorage.getItem('organizo_onboarding_seen');
        if (!hasSeenOnboarding) {
            // Slight delay so it feels natural
            setTimeout(() => this.showOnboardingModal(), 500);
        }
    }

    showOnboardingModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 480px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🌿</div>
                <h2 style="margin-bottom: 0.5rem; color: var(--text-dark);">Welcome to your sanctuary</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem; line-height: 1.6;">
                    OrganizO is your calm space for productivity. No pressure, no overwhelming lists. Just gentle focus and structure.
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                    <button class="btn-focus" id="onboarding-intention-btn" style="background: var(--surface); color: var(--accent-green); border: 2px solid var(--accent-green);">
                        ✨ Set today's intention
                    </button>
                    <button class="btn-focus" id="onboarding-task-btn" style="background: var(--accent-green); color: white;">
                        📝 Create your first task
                    </button>
                </div>
                
                <button class="icon-btn" id="onboarding-close-btn" style="font-size: 0.9rem; width: auto; padding: 0.5rem 1rem; border: none; background: transparent; color: var(--text-muted);">
                    I'll explore on my own
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        const closeAndMarkSeen = () => {
            localStorage.setItem('organizo_onboarding_seen', 'true');
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('#onboarding-close-btn').addEventListener('click', closeAndMarkSeen);

        modal.querySelector('#onboarding-intention-btn').addEventListener('click', () => {
            closeAndMarkSeen();
            this.editIntention();
        });

        modal.querySelector('#onboarding-task-btn').addEventListener('click', () => {
            closeAndMarkSeen();
            this.showAddTaskModal();
        });
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
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
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
        });
    }

    // View Management
    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        const mainContent = document.querySelector('.main-content');

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
                this.renderTemplatesView();
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
            <div class="card streak-card" style="background: linear-gradient(135deg, #065F46 0%, #10B981 100%); color: white; cursor: pointer;" onclick="window.organizoApp.showStreakModal()">
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
            dots.push(`<div style="width: 10px; height: 10px; border-radius: 50%; background: ${active ? 'white' : 'rgba(255,255,255,0.25)'};"></div>`);
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
                    <div style="background: #F0FDF4; border-radius: 12px; padding: 1rem;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">CURRENT</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #10B981;">${currentStreak}</div>
                    </div>
                    <div style="background: #F0FDF4; border-radius: 12px; padding: 1rem;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">BEST</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #10B981;">${bestStreak}</div>
                    </div>
                </div>
                <div style="text-align: left; margin-bottom: 2rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 0.75rem;">STREAK MILESTONES</div>
                    ${[3,7,14,30,60].map(n => `
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
        const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#94A3B8';
        return `
            <svg width="72" height="72" style="transform: rotate(-90deg);">
                <circle cx="36" cy="36" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="5"/>
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
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const dayBars = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dStr = d.toDateString();
            const count = completedThisWeek.filter(t => new Date(t.completedAt).toDateString() === dStr).length;
            dayBars.push({ day: days[d.getDay()], count });
        }
        const maxCount = Math.max(...dayBars.map(d => d.count), 1);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
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
                    <div style="background: #F0FDF4; border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">TASKS DONE</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #10B981;">${completedThisWeek.length}</div>
                    </div>
                    <div style="background: #F0FDF4; border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">FOCUS TIME</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #10B981;">${this.formatMinutes(focusMins)}</div>
                    </div>
                    <div style="background: #F0FDF4; border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px;">STREAK</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #10B981;">${this.streakData.currentStreak}🔥</div>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 1rem;">TASKS COMPLETED PER DAY</div>
                    <div style="display: flex; align-items: flex-end; gap: 8px; height: 80px;">
                        ${dayBars.map(d => `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                <div style="width: 100%; background: ${d.count > 0 ? '#10B981' : '#E2E8F0'}; border-radius: 4px 4px 0 0; height: ${Math.max(4, (d.count / maxCount) * 60)}px; transition: height 0.4s ease;"></div>
                                <div style="font-size: 0.65rem; color: var(--text-muted);">${d.day}</div>
                                ${d.count > 0 ? `<div style="font-size: 0.7rem; font-weight: 700; color: #10B981;">${d.count}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background: #F0FDF4; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 0.5rem;">HABIT RATE TODAY</div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="flex: 1; background: #E2E8F0; border-radius: 8px; height: 8px; overflow: hidden;">
                            <div style="background: #10B981; width: ${habitRate}%; height: 100%; border-radius: 8px; transition: width 0.6s ease;"></div>
                        </div>
                        <span style="font-weight: 700; color: #10B981; font-size: 0.9rem;">${habitRate}%</span>
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, #065F46, #10B981); border-radius: 12px; padding: 1rem; color: white; text-align: center; margin-bottom: 1.5rem;">
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
                <div style="background: linear-gradient(135deg, #065F46, #10B981); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; color: white;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌿</div>
                    <h2 style="margin: 0; font-size: 1.5rem;">OrganizO Pro</h2>
                    <p style="margin: 8px 0 0; opacity: 0.85; font-size: 0.9rem;">Everything you need to grow — gently.</p>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 1rem;">₹49<span style="font-size: 1rem; font-weight: 400; opacity: 0.8;">/month</span></div>
                </div>

                <div style="text-align: left; margin-bottom: 1.5rem;">
                    ${[
                        ['🌙', 'Dark Mode', 'For late-night planning sessions'],
                        ['📓', 'Quiet Notes', 'Your private daily scratchpad'],
                        ['🎨', 'Custom Palettes', 'Matcha, Sakura, Slate, Ocean & Sandstone'],
                        ['🛡️', 'Streak Freeze', 'Protect your streak once a week'],
                        ['📊', 'Advanced Reports', 'Deep dive into your patterns'],
                        ['📤', 'Data Export', 'CSV & PDF export anytime'],
                    ].map(([icon, title, desc]) => `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
                            <span style="font-size: 1.3rem; width: 30px;">${icon}</span>
                            <div>
                                <div style="font-weight: 600; font-size: 0.9rem;">${title}</div>
                                <div style="color: var(--text-muted); font-size: 0.8rem;">${desc}</div>
                            </div>
                            <span style="margin-left: auto; color: #10B981; font-weight: 700;">✓</span>
                        </div>
                    `).join('')}
                </div>

                <div style="background: #FEF9C3; border-radius: 10px; padding: 0.75rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: #92400E;">
                    🚀 <strong>Coming Soon!</strong> Pro features are in development. Join the waitlist to get early access at 50% off.
                </div>

                <button class="btn-focus" id="pro-waitlist-btn" style="width: 100%; margin-bottom: 0.75rem;">Join Waitlist — Free</button>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem;">Maybe later</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#pro-waitlist-btn').addEventListener('click', () => {
            window.location.href = 'mailto:organizo089@gmail.com?subject=OrganizO Pro Waitlist&body=Hi! I want early access to OrganizO Pro.';
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
                                <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #F8FAFC; font-size: 0.85rem;">
                                    <span style="color: ${t.color}; font-size: 0.8rem;">◦</span>
                                    <span>${task.name}</span>
                                    ${task.priority === 'High' ? `<span style="margin-left: auto; font-size: 0.65rem; background: #FEF2F2; color: #EF4444; border-radius: 4px; padding: 1px 6px; font-weight: 600;">HIGH</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-focus apply-template-btn" data-template-id="${t.id}" style="width: 100%; background: ${t.color};">
                            Load ${t.name} Tasks
                        </button>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top: 2rem; padding: 1.5rem; background: #F0FDF4; border-radius: 16px; text-align: center;">
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
                    <span>🔍</span>
                    <input type="text" placeholder="Search your tasks..." id="search-input">
                </div>
                <div class="top-actions">
                    <button class="icon-btn" title="Weekly Report" onclick="window.organizoApp.showWeeklyReport()" style="font-size: 1rem;">📊</button>
                    <button class="icon-btn" title="OrganizO Pro" onclick="window.organizoApp.showProModal()" style="font-size: 1rem;">⭐</button>
                    <div class="user-avatar profile-edit-trigger" style="width: 32px; height: 32px; font-size: 0.8rem; cursor: pointer;" onclick="window.organizoApp.showProfileModal()">${this.sanitize(this.userData.initials)}</div>
                </div>
            </nav>

            <div class="dashboard-header" style="margin-bottom: 2rem;">
                <h1 id="greeting" style="margin: 0; line-height: 1.2;">Good afternoon, ${this.sanitize(this.userData.name)}</h1>
                <p style="margin: 5px 0 0 0; color: var(--text-muted);">Take a deep breath. It's ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.</p>
            </div>

            <section class="intention-card">
                <span class="intention-label">Today's Single Intention</span>
                <h2 class="intention-text" id="intention-display" style="margin-bottom: 0.5rem;">${this.sanitize(this.dailyIntention) || 'Click to set your daily intention...'}</h2>
                
                <div id="dashboard-timer" style="font-size: 3.5rem; font-weight: 700; color: var(--accent-green); margin-bottom: 1.5rem; font-family: 'Outfit', sans-serif; display: ${this.timer.isRunning ? 'block' : 'none'};">
                    ${String(this.timer.minutes).padStart(2, '0')}:${String(this.timer.seconds).padStart(2, '0')}
                </div>

                <div style="display: flex; justify-content: center; gap: 1rem;">
                    <button class="btn-focus start-timer-btn">${this.timer.isRunning ? 'Pause Timer' : 'Start Focus Session'}</button>
                    <button class="btn-focus edit-intention-btn" style="background: white; color: var(--text-dark); border: 1px solid #E2E8F0; box-shadow: none;">Edit Intention</button>
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
                        <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #F8FAF9; border-radius: 12px;">
                            <div style="position: relative; flex-shrink: 0;">
                                ${this.renderCompletionRing(completion.pct)}
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.75rem; font-weight: 800; color: var(--text-dark);">${completion.pct}%</div>
                            </div>
                            <div>
                                <div style="font-weight: 700; font-size: 0.9rem;">Daily Completion</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${completion.done} of ${completion.total} tasks today</div>
                                ${completion.pct === 100 ? '<div style="font-size: 0.8rem; color: #10B981; font-weight: 600; margin-top: 2px;">🎉 Perfect day!</div>' : ''}
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
                            <div style="font-size: 0.8rem; color: #10B981; margin-top: 4px;">${this.focusTime.sessions.filter(s => this.isToday(s.completedAt)).length} sessions completed</div>
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
            return '<div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);"><div style="font-size: 2rem; margin-bottom: 0.5rem;">🌱</div>No tasks yet. Add one to begin cultivating focus.</div>';
        }

        return this.tasks.slice(0, 5).map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="checkbox ${task.completed ? 'checked' : ''}">${task.completed ? '✓' : ''}</div>
                <div class="task-info">
                    <span class="task-name" style="${task.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${this.sanitize(task.name)}</span>
                    <div class="task-meta">${task.category || 'General'} ${task.priority ? '• ' + task.priority : ''}</div>
                </div>
                <span class="tag-priority ${task.priority === 'High' ? 'high' : ''}">${task.priority || 'Normal'}</span>
                <button class="delete-task" style="background: none; border: none; color: #EF4444; cursor: pointer; margin-left: 8px;">×</button>
            </div>
        `).join('');
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
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3 style="margin-bottom: 1.5rem;">Add New Task</h3>
                <input type="text" id="task-name" placeholder="Task name" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 1rem;">
                <select id="task-category" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 1rem;">
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Creativity">Creativity</option>
                    <option value="Health">Health</option>
                </select>
                <select id="task-priority" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 1.5rem;">
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Low">Low Priority</option>
                </select>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn-focus" id="save-task-btn" style="flex: 1;">Add Task</button>
                    <button class="btn-focus cancel-modal-btn" style="flex: 1; background: white; color: var(--text-dark); border: 1px solid #E2E8F0;">Cancel</button>
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

            if (name) {
                this.addTask(name, category, priority);
                modal.remove();
            }
        });

        setTimeout(() => document.getElementById('task-name').focus(), 100);
    }

    addTask(name, category, priority) {
        const task = {
            id: Date.now(),
            name,
            category,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.tasks.unshift(task);
        this.saveData('tasks', this.tasks);
        this.renderDashboard();
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
        mainContent.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; text-align: center; padding-top: 4rem;">
                <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Focus Timer</h1>
                <p style="color: var(--text-muted); margin-bottom: 3rem;">Deep work session</p>
                
                <div class="timer-display" style="font-size: 6rem; font-weight: 700; color: var(--accent-green); margin-bottom: 3rem;">
                    ${String(this.timer.minutes).padStart(2, '0')}:${String(this.timer.seconds).padStart(2, '0')}
                </div>

                <div class="timer-controls" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                    <button class="btn-focus start-timer-btn" style="padding: 1rem 2rem;">
                        ${this.timer.isRunning ? 'Pause' : 'Start'}
                    </button>
                    <button class="btn-focus reset-timer-btn" style="background: white; color: var(--text-dark); border: 1px solid #E2E8F0; padding: 1rem 2rem;">
                        Reset
                    </button>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="timer-mode-btn ${this.timer.mode === 'focus' ? 'active' : ''}" data-mode="focus" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #E2E8F0; background: ${this.timer.mode === 'focus' ? 'var(--accent-green)' : 'white'}; color: ${this.timer.mode === 'focus' ? 'white' : 'var(--text-dark)'}; cursor: pointer;">
                        Focus (25min)
                    </button>
                    <button class="timer-mode-btn ${this.timer.mode === 'shortBreak' ? 'active' : ''}" data-mode="shortBreak" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #E2E8F0; background: ${this.timer.mode === 'shortBreak' ? 'var(--accent-green)' : 'white'}; color: ${this.timer.mode === 'shortBreak' ? 'white' : 'var(--text-dark)'}; cursor: pointer;">
                        Short Break (5min)
                    </button>
                    <button class="timer-mode-btn ${this.timer.mode === 'longBreak' ? 'active' : ''}" data-mode="longBreak" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #E2E8F0; background: ${this.timer.mode === 'longBreak' ? 'var(--accent-green)' : 'white'}; color: ${this.timer.mode === 'longBreak' ? 'white' : 'var(--text-dark)'}; cursor: pointer;">
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

        // Show completion notification
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 2rem; right: 2rem; background: var(--accent-green); color: white; padding: 1rem 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 1000;';
        notification.textContent = this.timer.mode === 'focus' ? '🎉 Focus session complete!' : '✨ Break time over!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);

        this.resetTimer();
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
                    <span>🔍</span>
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
                    <div class="task-meta">${task.category || 'General'} ${task.priority ? '• ' + task.priority : ''}</div>
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
                    <span>🔍</span>
                    <input type="text" placeholder="Search events & holidays..." id="search-input">
                </div>
            </nav>

            <header class="header-section" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1>Monthly Sanctuary</h1>
                    <p>Tracking focus and milestones for ${monthName} ${year}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-focus prev-month" style="background: white; color: var(--text-dark); border: 1px solid #E2E8F0;">←</button>
                    <button class="btn-focus next-month" style="background: white; color: var(--text-dark); border: 1px solid #E2E8F0;">→</button>
                </div>
            </header>

            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; text-align: center; margin-bottom: 15px; font-weight: 600; font-size: 0.8rem; color: var(--text-muted);">
                <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
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
                             data-date="${dateStr}"
                             style="background: white; border-radius: 12px; padding: 10px; height: 120px; border: 1px solid ${isToday ? 'var(--accent-green)' : 'rgba(0,0,0,0.05)'}; cursor: pointer; transition: all 0.2s; overflow: hidden; display: flex; flex-direction: column;">
                            
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="font-size: 1.1rem; font-weight: 700; color: ${isToday ? 'var(--accent-green)' : 'var(--text-dark)'};">${day.getDate()}</div>
                                ${holiday ? `<span title="${holiday}" style="font-size: 1rem;">🎁</span>` : ''}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 5px; flex-grow: 1;">
                                ${this.renderCalendarTasks(day)}
                                ${dailyEvents.map(ev => `
                                    <div style="font-size: 0.6rem; background: ${ev.type === 'Deadline' ? '#FFFBEB' : '#F0F9FF'}; color: ${ev.type === 'Deadline' ? '#B45309' : '#0369A1'}; border-radius: 4px; padding: 2px 4px; border-left: 3px solid ${ev.type === 'Deadline' ? '#B45309' : '#0369A1'}; display: flex; justify-content: space-between;">
                                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.sanitize(ev.name)}</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            ${holiday ? `<div style="font-size: 0.55rem; color: #EF4444; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${holiday}</div>` : ''}
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

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px; padding: 2.5rem;">
                <h3 style="margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">Plan for ${dateStr}</h3>
                
                ${holiday ? `<div style="background: #FEF2F2; color: #EF4444; border-radius: 8px; padding: 12px; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 10px;"><span>🎁</span> ${holiday}</div>` : ''}

                ${tasksForDay.length > 0 ? `
                <div style="margin-bottom: 2rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 1rem;">Daily Flow Tasks</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${tasksForDay.map(t => `
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 0.95rem; color: ${t.completed ? 'var(--accent-green)' : 'var(--text-dark)'};">
                                <span>${t.completed ? '🟢' : '⚪'}</span>
                                <span style="${t.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this.sanitize(t.name)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 1rem;">Add Milestone / Goal</div>
                <input type="text" id="event-name" placeholder="Milestone or Deadline title" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 1rem;">
                <select id="event-type" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 1.5rem;">
                    <option value="Event">✨ Simple Event</option>
                    <option value="Deadline">🚨 Important Deadline</option>
                    <option value="Meeting">🤝 Meeting</option>
                </select>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn-focus" id="save-event-btn" style="flex: 1;">Save to Schedule</button>
                    <button class="btn-focus cancel-modal-btn" style="flex: 1; background: white; color: var(--text-dark); border: 1px solid #E2E8F0;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

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
                    <span>🔍</span>
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
        `;
        this.setupSearchFilter();
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
            if (hour < 12) greeting.textContent = "Good morning, Zen Seeker";
            else if (hour < 18) greeting.textContent = "Good afternoon, Zen Seeker";
            else greeting.textContent = "Good evening, Zen Seeker";
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
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 1.5rem;">${this.sanitize(this.userData.initials)}</div>
                <h3 style="margin-bottom: 0.5rem;">Edit Profile</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Personalize your sanctuary</p>
                
                <input type="text" id="edit-user-name" value="${this.sanitize(this.userData.name)}" placeholder="Your Name" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 1rem;">
                <input type="text" id="edit-user-initials" value="${this.sanitize(this.userData.initials)}" maxlength="2" placeholder="Initials (e.g. JS)" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 1.5rem;">
                
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <button id="save-profile-btn" class="btn-primary" style="flex: 1; padding: 12px; border-radius: 8px;">Save Changes</button>
                    <button id="close-profile-modal" class="btn-secondary" style="flex: 1; padding: 12px; border-radius: 8px; background: #f1f5f9;">Cancel</button>
                </div>
                
                <div style="border-top: 1px solid #E2E8F0; padding-top: 1.5rem;">
                    <button id="export-data-btn" class="btn-secondary" style="width: 100%; padding: 10px; border-radius: 8px; font-size: 0.9rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>📥</span> Export Backup (JSON)
                    </button>
                </div>
            </div>
        `;

        modal.querySelector('#close-profile-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#save-profile-btn').addEventListener('click', () => {
            const newName = document.getElementById('edit-user-name').value.trim();
            const newInitials = document.getElementById('edit-user-initials').value.trim().toUpperCase();

            if (newName && newInitials) {
                this.userData = { name: newName, initials: newInitials };
                this.saveData('userData', this.userData);
                this.updateUserUI();
                modal.remove();
            } else {
                alert('Please provide both a name and initials.');
            }
        });

        modal.querySelector('#export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

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
                from_name: this.sanitize(form.querySelector('#feedback-name').value) || 'Anonymous Zen Seeker',
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

    updateUserUI() {
        // Update greeting
        const greeting = document.getElementById('greeting');
        if (greeting) {
            const hour = new Date().getHours();
            let g = 'Good morning';
            if (hour >= 12 && hour < 17) g = 'Good afternoon';
            if (hour >= 17) g = 'Good evening';
            greeting.textContent = `${g}, ${this.userData.name}`;
        }

        // Update all avatars
        document.querySelectorAll('.user-avatar').forEach(avatar => {
            avatar.textContent = this.userData.initials;
        });

        // Update Sidebar info
        const nameEl = document.querySelector('.sidebar-user .user-name');
        if (nameEl) nameEl.textContent = this.userData.name;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new OrganizOApp();
    window.organizoApp = app; // Keep global access if needed
    app.updateUserUI(); // Call updateUserUI after app initialization
});
