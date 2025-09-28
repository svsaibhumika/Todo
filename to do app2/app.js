let currentPriorityFilter = 'All';
document.getElementById("priorityFilter").addEventListener("change", function (e) {
  currentPriorityFilter = e.target.value;
  updateTasksList();
});

document.addEventListener("DOMContentLoaded", () => {
  const storedTasks = JSON.parse(localStorage.getItem("tasks"))
  if (storedTasks) {
    storedTasks.forEach((task) => tasks.push(task));
    updateTasksList();
    updateStats();
  }
});


let tasks = [];

const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

let currentSubtasks = [];

document.getElementById("subtaskInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const subtask = e.target.value.trim();
    if (subtask) {
      currentSubtasks.push({ text: subtask, completed: false });
      e.target.value = "";
    }
  }
});

const addTask = () => {
  const taskInput = document.getElementById("taskInput").value.trim();
  const dueDate = document.getElementById("dueDate").value;
  const priority = document.getElementById("priority").value;
  const notes = document.getElementById("notes").value.trim();
  const recurrence = document.getElementById("recurrence").value;

  if (taskInput) {
    const newTask = {
      text: taskInput,
      completed: false,
      dueDate,
      priority,
      notes,
      recurrence,
      subtasks: currentSubtasks,
    };

    if (isEditing && editingIndex !== null) {
      tasks[editingIndex] = newTask;
      isEditing = false;
      editingIndex = null;
    } else {
      tasks.push(newTask);
    }

    currentSubtasks = []; // reset
    clearForm();
    updateTasksList();
    updateStats();
    saveTasks();
  }
};



const clearForm = () => {
  document.getElementById("taskInput").value = "";
  document.getElementById("dueDate").value = "";
  document.getElementById("priority").value = "Low";
  document.getElementById("notes").value = "";
  document.getElementById("recurrence").value = "None";
};


const toggleTestComplete = (index) => {
  tasks[index].completed = !tasks[index].completed;
  updateTasksList();
  updateStats();
  saveTasks();
};

const deleteTask = (index) => {
  tasks.splice(index, 1);
  updateTasksList();
  updateStats();
  saveTasks();
};

let isEditing = false;
let editingIndex = null;

const editTask = (index) => {
  const task = tasks[index];

  // Fill the form with existing data
  document.getElementById("taskInput").value = task.text;
  document.getElementById("dueDate").value = task.dueDate;
  document.getElementById("priority").value = task.priority;
  document.getElementById("notes").value = task.notes;
  document.getElementById("recurrence").value = task.recurrence;

  // Store current subtasks for reuse after editing
  currentSubtasks = task.subtasks || [];

  // Set edit state
  isEditing = true;
  editingIndex = index;
};



const updateStats = () => {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  let progress = 0;
  if (totalTasks > 0) {
    progress = (completedTasks / totalTasks) * 100;
  }
  const progressBar = document.getElementById("progress");
  progressBar.style.width = `${progress}%`;
  document.getElementById("numbers").innerText = `${completedTasks}/${totalTasks}`;

  // Only show confetti if there are tasks and all are completed
  if (totalTasks > 0 && completedTasks === totalTasks) {
    blastConfetti();
  }

};


const updateTasksList = () => {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = "";

  // Create array of [task, realIndex] pairs based on filter
  const filteredTaskPairs = tasks
    .map((task, idx) => ({ task, idx }))
    .filter(pair => currentPriorityFilter === "All" || pair.task.priority === currentPriorityFilter);

  filteredTaskPairs.forEach(({ task, idx }) => {
    const listItem = document.createElement('li');

    // 🔹 Deadline countdown logic
    let urgencyClass = "";
    let countdownText = "";

    if (task.dueDate) {
      const now = new Date();
      const deadline = new Date(task.dueDate);
      const diff = deadline - now;
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      countdownText = daysLeft >= 0
        ? `${daysLeft} day(s) left`
        : `Overdue by ${Math.abs(daysLeft)} day(s)`;
      urgencyClass = daysLeft < 1 ? "urgent" : "";
    }

    let subtaskHTML = "";
    if (task.subtasks && task.subtasks.length > 0) {
      subtaskHTML =
        `<ul class="subtasks">` +
        task.subtasks
          .map(
            (st, stIdx) => `
        <li class="${st.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                ${st.completed ? "checked" : ""}
                onchange="toggleSubtask(${idx}, ${stIdx})"
            />
            <span id="subtask-text-${idx}-${stIdx}" onclick="enableSubtaskEdit(${idx}, ${stIdx})">${st.text}</span>
            <input 
                class="subtask-input" 
                id="subtask-input-${idx}-${stIdx}" 
                value="${st.text}" 
                style="display: none;" 
                onblur="saveSubtaskEdit(${idx}, ${stIdx}, this.value)" 
                onkeydown="handleSubtaskKey(event, ${idx}, ${stIdx})"
            />
            <span class="edit-subtask" onclick="enableSubtaskEdit(${idx}, ${stIdx})">✏️</span>
        </li>`
          )
          .join("") +
        `</ul>`;
    }

    // 🔹 Render task item with all features
    listItem.innerHTML = `
      <div class="taskItem ${urgencyClass}">
          <div class="task ${task.completed ? 'completed' : ''}">
              <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}/>
              <div>
                  <p><strong>${task.text}</strong></p>
                  <p>📅 ${task.dueDate || 'No due date'} | ⏱️ ${task.priority} | ⏳ ${countdownText}</p>
                  <p>📝 ${task.notes}</p>
                  <p>🔁 ${task.recurrence}</p>
                  ${subtaskHTML}
              </div>
          </div>
          <div class="icons">
              <img src="./img/edit.png" onClick="editTask(${idx})"/>
              <img src="./img/bin.png" onClick="deleteTask(${idx})"/>
          </div>
      </div>
    `;

    // Use the real index for toggling
    listItem.querySelector('.checkbox').addEventListener("change", (e) => {
      e.stopPropagation(); // prevent bubbling up
      toggleTestComplete(idx);
    });
    taskList.append(listItem);
  });
};



document.getElementById("newTask").addEventListener('click', function (e) {
  e.preventDefault();
  addTask();
});

const toggleSubtask = (taskIndex, subtaskIndex) => {
  const task = tasks[taskIndex];
  const subtask = task.subtasks[subtaskIndex];

  // Toggle the subtask state
  subtask.completed = !subtask.completed;

  // ✅ If all subtasks are completed, mark task completed
  const allCompleted = task.subtasks.every(st => st.completed);
  task.completed = allCompleted;

  // ✅ If any subtask is incomplete, unmark the task
  if (!allCompleted) {
    task.completed = false;
  }

  updateTasksList();
  updateStats();
  saveTasks();
};

const saveSubtaskEdit = (taskIndex, subtaskIndex, newText) => {
  tasks[taskIndex].subtasks[subtaskIndex].text = newText.trim();
  saveTasks();
  updateTasksList();
};

// ✅ Called when user presses a key in subtask input
const handleSubtaskKey = (e, taskIndex, subtaskIndex) => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.target.blur(); // trigger save on Enter
  }
};

const enableSubtaskEdit = (taskIndex, subtaskIndex) => {
  const input = document.getElementById(`subtask-input-${taskIndex}-${subtaskIndex}`);
  const span = document.getElementById(`subtask-text-${taskIndex}-${subtaskIndex}`);
  input.style.display = "inline-block";
  span.style.display = "none";
  input.focus();
};


const blastConfetti = () => {
  const count = 200,
    defaults = {
      origin: { y: 0.7 },
    };

  function fire(particleRatio, opts) {
    confetti(
      Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio),
      })
    );
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}