// Initialize GSAP ScrollTrigger
        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger, Draggable);

        // App State
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let userStats = JSON.parse(localStorage.getItem('userStats')) || {
            level: 1,
            xp: 0,
            streak: 0,
            totalCompleted: 0
        };
        let currentFilter = 'all';
        let selectedDate = new Date().toISOString().slice(0, 10); // Default to today
        let sortDirection = 'asc';
        let currentSort = 'date';

        // Add default tasks for new users
        if (!localStorage.getItem('tasks') || tasks.length === 0) {
            const today = new Date().toISOString().slice(0, 10);
            tasks = [
                {
                    id: Date.now() + 1,
                    text: 'Welcome to TaskFlow! ✔️',
                    category: 'personal',
                    completed: true,
                    createdAt: new Date().toISOString(),
                    date: today
                },
                {
                    id: Date.now() + 2,
                    text: 'Try adding your first task!',
                    category: 'work',
                    completed: true,
                    createdAt: new Date().toISOString(),
                    date: today
                },
                {
                    id: Date.now() + 3,
                    text: 'Mark a task as complete ✅',
                    category: 'urgent',
                    completed: true,
                    createdAt: new Date().toISOString(),
                    date: today
                }
            ];
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        // Initialize app on load
        document.addEventListener('DOMContentLoaded', function() {
            initLandingAnimations();
            initTheme();
            renderCalendar();
            renderTasks();
            updateStats();

            // Add event listener for the Add button
            document.getElementById('addButton').addEventListener('click', addTask);
        });

        // Landing Page Animations
        function initLandingAnimations() {
            // Hero animations
            gsap.timeline()
                .to('.hero-title', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
                .to('.hero-subtitle', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.5')
                .to('.cta-button', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.5');

            // Floating elements animation
            gsap.to('.floating-element', {
                y: 'random(-50, 50)',
                x: 'random(-30, 30)',
                rotation: 'random(-180, 180)',
                duration: 'random(3, 6)',
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut',
                stagger: 0.2
            });

            // Parallax effect
            gsap.to('.floating-elements', {
                yPercent: -50,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.landing',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });
        }

        // Enter main app
        function enterApp() {
            gsap.to('#landingPage', {
                opacity: 0,
                scale: 0.8,
                duration: 0.8,
                ease: 'power2.inOut',
                onComplete: () => {
                    document.getElementById('landingPage').style.display = 'none';
                    document.getElementById('app').style.display = 'block';
                    
                    // Animate app entrance
                    gsap.from('.header', { y: -100, opacity: 0, duration: 0.8, ease: 'power3.out' });
                    gsap.from('.task-section', { x: -100, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
                    gsap.from('.sidebar', { x: 100, opacity: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' });
                }
            });
        }

        // Theme Management
        function initTheme() {
            const isDark = localStorage.getItem('theme') === 'dark' || 
                          (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            if (isDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
                document.querySelector('.theme-toggle').textContent = '☀️';
            }
        }

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme === 'light' ? null : 'dark');
            document.querySelector('.theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('theme', newTheme);
        }

        // Task Management
        function addTask() {
            const taskInput = document.getElementById('taskInput');
            const descriptionInput = document.getElementById('taskDescription');
            const categorySelect = document.getElementById('categorySelect');
            const datePicker = document.getElementById('datePicker');
            const timePicker = document.getElementById('timePicker');
            
            const taskText = taskInput.value.trim();
            const description = descriptionInput.value.trim();
            const category = categorySelect.value;
            const date = datePicker.value;
            const time = timePicker.value;
            
            if (taskText) {
                const task = {
                    id: Date.now(),
                    text: taskText,
                    description: description,
                    category: category,
                    completed: false,
                    date: date,
                    time: time
                };
                
                tasks.push(task);
                saveTasks();
                renderTasks();
                
                // Clear inputs
                taskInput.value = '';
                descriptionInput.value = '';
                datePicker.value = new Date().toISOString().slice(0, 10);
                timePicker.value = '';
            }
        }

        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            
            task.completed = !task.completed;
            
            if (task.completed) {
                addXP(10);
                userStats.totalCompleted++;
                checkAchievements();
                
                // Celebration animation
                const taskElement = document.querySelector(`[data-id="${id}"]`);
                gsap.to(taskElement, {
                    scale: 1.1,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.out'
                });
            }
            
            saveTasks();
            renderTasks();
            updateStats();
        }

        function deleteTask(id) {
            const taskElement = document.querySelector(`[data-id="${id}"]`);
            
            gsap.to(taskElement, {
                x: 300,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    tasks = tasks.filter(t => t.id !== id);
                    saveTasks();
                    renderTasks();
                    updateStats();
                }
            });
        }

        function sortTasks() {
            currentSort = document.getElementById('sortSelect').value;
            renderTasks();
        }

        function toggleSortDirection() {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            const sortBtn = document.getElementById('sortDirection');
            sortBtn.innerHTML = `<i class="fas fa-sort-amount-${sortDirection === 'asc' ? 'down' : 'up'}"></i>`;
            renderTasks();
        }

        function getSortedTasks(tasks) {
            return [...tasks].sort((a, b) => {
                let comparison = 0;
                
                switch(currentSort) {
                    case 'date':
                        comparison = new Date(a.date) - new Date(b.date);
                        break;
                    case 'priority':
                        const priorityOrder = { urgent: 0, work: 1, personal: 2, other: 3 };
                        comparison = priorityOrder[a.category] - priorityOrder[b.category];
                        break;
                    case 'name':
                        comparison = a.text.localeCompare(b.text);
                        break;
                    case 'completion':
                        comparison = (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
                        break;
                }
                
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        function renderTasks() {
            const container = document.getElementById('taskList');
            if (!container) return;
            
            let filteredTasks = currentFilter === 'all' ? tasks : tasks.filter(t => t.category === currentFilter);
            filteredTasks = filteredTasks.filter(t => t.date === selectedDate);
            filteredTasks = getSortedTasks(filteredTasks);
            
            container.innerHTML = '';
            
            filteredTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `task-item ${task.category} ${task.completed ? 'completed' : ''}`;
                taskElement.setAttribute('data-id', task.id);
                taskElement.onclick = (e) => {
                    // Don't toggle if clicking on action buttons
                    if (!e.target.closest('.task-actions')) {
                        toggleTask(task.id);
                    }
                };
                
                const timeDisplay = task.time ? 
                    `<div class="task-time"><i class="fas fa-clock"></i> ${task.time}</div>` : '';
                
                taskElement.innerHTML = `
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
                    <div class="task-content">
                        <div class="task-text">${task.text}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        ${timeDisplay}
                    </div>
                    <div class="task-category ${task.category}">${task.category}</div>
                    <div class="task-actions">
                        <button class="action-btn edit-btn" onclick="event.stopPropagation(); editTask(${task.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteTask(${task.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                container.appendChild(taskElement);
            });
        }

        function filterTasks(category) {
            currentFilter = category;
            
            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            renderTasks();
        }

        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const progress = total > 0 ? (completed / total) * 100 : 0;
            
            document.getElementById('totalTasks').textContent = total;
            document.getElementById('completedTasks').textContent = completed;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('streakCount').textContent = userStats.streak;
            document.getElementById('xpPoints').textContent = userStats.xp;
            document.getElementById('userLevel').textContent = `Level ${userStats.level}`;
        }

        function addXP(points) {
            userStats.xp += points;
            const oldLevel = userStats.level;
            userStats.level = Math.floor(userStats.xp / 100) + 1;
            
            if (userStats.level > oldLevel) {
                showAchievement(`Level Up! You reached Level ${userStats.level}! 🎉`);
            }
            
            localStorage.setItem('userStats', JSON.stringify(userStats));
        }

        function checkAchievements() {
            const milestones = [5, 10, 25, 50, 100];
            const completed = userStats.totalCompleted;
            
            if (milestones.includes(completed)) {
                showAchievement(`Amazing! You've completed ${completed} tasks! 🏆`);
            }
        }

        function showAchievement(text) {
            const popup = document.getElementById('achievementPopup');
            document.getElementById('achievementText').textContent = text;
            
            popup.classList.add('show');
            setTimeout(() => popup.classList.remove('show'), 3000);
        }

        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('userStats', JSON.stringify(userStats));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.id === 'taskInput') {
                addTask();
            }
        });

        // Auto-save periodically
        setInterval(saveTasks, 30000);

        // Calendar rendering
        function renderCalendar() {
            const calendar = document.getElementById('calendar');
            if (!calendar) return;
            const now = selectedDate ? new Date(selectedDate) : new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const todayStr = new Date().toISOString().slice(0, 10);

            // Get first day of month
            const firstDay = new Date(year, month, 1);
            const startDay = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Header
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            let html = weekDays.map(d => `<div class='calendar-header'>${d}</div>`).join('');

            // Empty slots before first day
            for (let i = 0; i < startDay; i++) html += `<div></div>`;

            // Days
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                let classes = 'calendar-day';
                if (dateStr === selectedDate) classes += ' selected';
                if (dateStr === todayStr) classes += ' today';
                
                // Check for incomplete tasks for this day
                const incompleteTasks = tasks.filter(task => 
                    task.date === dateStr && !task.completed
                );
                const taskDots = incompleteTasks.length > 0 ? 
                    `<div class="task-dots incomplete" title="${incompleteTasks.length} incomplete task${incompleteTasks.length > 1 ? 's' : ''}"></div>` : '';
                
                html += `
                    <div class='${classes}' data-date='${dateStr}'>
                        <span class="day-number">${d}</span>
                        ${taskDots}
                    </div>`;
            }
            calendar.innerHTML = html;

            // Add click listeners
            calendar.querySelectorAll('.calendar-day').forEach(day => {
                day.addEventListener('click', function() {
                    selectedDate = this.dataset.date;
                    document.getElementById('datePicker').value = selectedDate;
                    renderCalendar();
                    renderTasks();
                });
            });
        }

        // Update date picker and calendar on load
        if (document.getElementById('datePicker')) {
            document.getElementById('datePicker').value = selectedDate;
            document.getElementById('datePicker').addEventListener('change', function() {
                selectedDate = this.value;
                renderCalendar();
                renderTasks();
            });
        }

        function editTask(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            // Create and show edit modal
            const modal = document.createElement('div');
            modal.className = 'edit-modal';
            modal.innerHTML = `
                <div class="edit-modal-content">
                    <h3>Edit Task</h3>
                    <input type="text" id="editTaskText" class="task-input" value="${task.text}">
                    <textarea id="editTaskDescription" class="task-input description-input" placeholder="Add description (optional)">${task.description || ''}</textarea>
                    <div class="category-container">
                        <select id="editCategorySelect" class="task-input">
                            <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
                            <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>Personal</option>
                            <option value="urgent" ${task.category === 'urgent' ? 'selected' : ''}>Urgent</option>
                            <option value="other" ${task.category === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="datetime-container">
                        <div class="input-with-icon">
                            <i class="fas fa-calendar"></i>
                            <input type="date" id="editDatePicker" class="task-input" value="${task.date}">
                        </div>
                        <div class="input-with-icon">
                            <i class="fas fa-clock"></i>
                            <input type="time" id="editTimePicker" class="task-input" value="${task.time || ''}">
                        </div>
                    </div>
                    <div class="edit-modal-actions">
                        <button class="cancel-btn" onclick="closeEditModal()">Cancel</button>
                        <button class="save-btn" onclick="saveTaskEdit(${task.id})">Save Changes</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 10);
        }

        function closeEditModal() {
            const modal = document.querySelector('.edit-modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        }

        function saveTaskEdit(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const newText = document.getElementById('editTaskText').value.trim();
            const newDescription = document.getElementById('editTaskDescription').value.trim();
            const newCategory = document.getElementById('editCategorySelect').value;
            const newDate = document.getElementById('editDatePicker').value;
            const newTime = document.getElementById('editTimePicker').value;

            if (newText) {
                task.text = newText;
                task.description = newDescription;
                task.category = newCategory;
                task.date = newDate;
                task.time = newTime;

                saveTasks();
                renderTasks();
                closeEditModal();
            }
        }

        // Add click outside to close modal
        document.addEventListener('click', (e) => {
            const modal = document.querySelector('.edit-modal');
            if (modal && e.target === modal) {
                closeEditModal();
            }
        });