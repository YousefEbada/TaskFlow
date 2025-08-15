// Tailwind Configuration
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-subtle": "bounceSubtle 0.4s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
    },
  },
};

// Theme Management Class
class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadTheme();
    this.bindThemeToggle();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    this.updateButtonText();
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.updateButtonText();
  }

  updateButtonText() {
    const themeToggle = document.getElementById('themeToggle');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
      themeToggle.innerHTML = '<span>☀️ Light Mode</span>';
    } else {
      themeToggle.innerHTML = '<span>🌙 Dark Mode</span>';
    }
  }

  bindThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }
}

// Task Management Class
class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    this.currentFilter = "all";
    this.editingTaskId = null;
    this.searchQuery = "";
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderTasks();
    this.updateStats();
  }

  bindEvents() {
    // Form submission
    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Edit form submission
    document.getElementById("editForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveEdit();
    });

    // Cancel edit
    document.getElementById("cancelEdit").addEventListener("click", () => {
      this.hideEditModal();
    });

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.setFilter(btn.dataset.filter);
      });
    });

    // Search
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.searchTasks(e.target.value);
    });

    // Close modal on backdrop click
    document.getElementById("editModal").addEventListener("click", (e) => {
      if (e.target.id === "editModal") {
        this.hideEditModal();
      }
    });
  }

  addTask() {
    const taskInput = document.getElementById("taskInput");
    const prioritySelect = document.getElementById("prioritySelect");
    const dueDateInput = document.getElementById("dueDateInput");
    const categoryInput = document.getElementById("categoryInput");

    const textValue = taskInput.value.trim();
    const priorityValue = prioritySelect.value;
    const dueDateValue = dueDateInput.value;
    const categoryValue = categoryInput.value.trim();

    if (!textValue) {
      this.showNotification("Please enter a task description!");
      return;
    }

    const task = {
      id: Date.now(),
      text: textValue,
      completed: false,
      priority: priorityValue,
      dueDate: dueDateValue,
      category: categoryValue,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.showNotification("Task added successfully!");

    // Reset form
    document.getElementById("taskForm").reset();
    prioritySelect.value = "low";
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.showNotification("Task deleted successfully!");
  }

  toggleTask(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
    }
  }

  editTask(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      this.editingTaskId = id;
      document.getElementById("editTaskInput").value = task.text;
      document.getElementById("editPrioritySelect").value = task.priority;
      document.getElementById("editDueDateInput").value = task.dueDate;
      document.getElementById("editCategoryInput").value = task.category;
      this.showEditModal();
    }
  }

  saveEdit() {
    const task = this.tasks.find((task) => task.id === this.editingTaskId);
    if (task) {
      task.text = document.getElementById("editTaskInput").value.trim();
      task.priority = document.getElementById("editPrioritySelect").value;
      task.dueDate = document.getElementById("editDueDateInput").value;
      task.category = document.getElementById("editCategoryInput").value.trim();

      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.hideEditModal();
      this.showNotification("Task updated successfully!");
    }
  }

  showEditModal() {
    document.getElementById("editModal").classList.remove("hidden");
    document.getElementById("editModal").classList.add("flex");
  }

  hideEditModal() {
    document.getElementById("editModal").classList.add("hidden");
    document.getElementById("editModal").classList.remove("flex");
    this.editingTaskId = null;
  }

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active", "bg-blue-500", "text-white");
      btn.classList.add("text-gray-600", "dark:text-gray-300");
    });

    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    activeBtn.classList.add("active", "bg-blue-500", "text-white");
    activeBtn.classList.remove("text-gray-600", "dark:text-gray-300");

    this.renderTasks();
  }

  searchTasks(query) {
    this.searchQuery = query.toLowerCase();
    this.renderTasks();
  }

  getFilteredTasks() {
    let filtered = this.tasks;

    // Apply status filter
    if (this.currentFilter === "completed") {
      filtered = filtered.filter((task) => task.completed);
    } else if (this.currentFilter === "pending") {
      filtered = filtered.filter((task) => !task.completed);
    }

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.text.toLowerCase().includes(this.searchQuery) ||
          (task.category && task.category.toLowerCase().includes(this.searchQuery))
      );
    }

    return filtered;
  }

  renderTasks() {
    const container = document.getElementById("tasksContainer");
    const emptyState = document.getElementById("emptyState");
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      container.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    container.innerHTML = filteredTasks
      .map((task) => this.createTaskHTML(task))
      .join("");

    // Add event listeners
    container.querySelectorAll(".toggle-task").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.toggleTask(parseInt(e.target.closest('.toggle-task').dataset.id));
      });
    });

    container.querySelectorAll(".edit-task").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.editTask(parseInt(e.target.dataset.id));
      });
    });

    container.querySelectorAll(".delete-task").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.deleteTask(parseInt(e.target.dataset.id));
      });
    });
  }

  createTaskHTML(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    const dueDateString = dueDate ? dueDate.toLocaleDateString() : "";

    return `
      <div class="task-item glass-effect rounded-xl p-4 priority-${
        task.priority
      } ${task.completed ? "task-completed" : ""} ${
      isOverdue ? "border-red-300 bg-red-50/50 dark:bg-red-900/20" : ""
    }">
        <div class="flex items-start gap-4">
          <button class="toggle-task mt-1 w-5 h-5 rounded-full border-2 ${
            task.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 dark:border-gray-600"
          } hover:border-green-500 transition-all duration-300 flex items-center justify-center" data-id="${
      task.id
    }">
            ${
              task.completed
                ? '<span class="text-white text-xs">✓</span>'
                : ""
            }
          </button>
          
          <div class="flex-1 min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h3 class="font-medium text-gray-800 dark:text-white ${
                task.completed
                  ? "line-through opacity-60"
                  : ""
              } break-words">
                ${task.text}                        
              </h3>
              <div class="flex items-center gap-2 flex-wrap">
                ${
                  task.category
                    ? `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">${task.category}</span>`
                    : ""
                }
                <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full capitalize">${
                  task.priority
                }</span>
                ${
                  isOverdue
                    ? '<span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">Overdue</span>'
                    : ""
                }
              </div>
            </div>
            
            ${
              dueDateString
                ? `<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Due: ${dueDateString}</p>`
                : ""
            }
            
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400 dark:text-gray-500">
                Created ${new Date(
                  task.createdAt
                ).toLocaleDateString()}
              </span>
              <div class="flex gap-2">
                <button class="edit-task px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300" data-id="${
                  task.id
                }">
                  Edit
                </button>
                <button class="delete-task px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300" data-id="${
                  task.id
                }">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((task) => task.completed).length;
    const pending = total - completed;

    document.getElementById(
      "taskStats"
    ).textContent = `${total} tasks (${completed} done, ${pending} pending)`;
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 glass-effect px-4 py-2 rounded-xl text-sm font-medium z-50 animate-slide-up";
    notification.style.background = "rgba(34, 197, 94, 0.9)";
    notification.style.color = "white";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme manager first
  window.themeManager = new ThemeManager();
  
  // Initialize task manager
  // window.taskManager = new TaskManager();
});

