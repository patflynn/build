/**
 * Basement Lab - Workout Tracker
 * State management and UI logic
 */

const STATE_KEY = 'basement_lab_state';
const LOG_KEY = 'basement_lab_log';

let programData = null;
let currentState = null;

// Initialize app
async function init() {
  loadState();
  await loadProgram();
  render();
  bindEvents();
}

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem(STATE_KEY);
  if (saved) {
    currentState = JSON.parse(saved);
  } else {
    currentState = {
      globalDay: 1,
      currentPhase: 'p1'
    };
    saveState();
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(currentState));
}

// Load exercise log from localStorage
function loadLog() {
  const saved = localStorage.getItem(LOG_KEY);
  return saved ? JSON.parse(saved) : {};
}

// Save exercise log to localStorage
function saveLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

// Load program data from JSON
async function loadProgram() {
  try {
    const response = await fetch('data/program.json');
    programData = await response.json();
  } catch (error) {
    console.error('Failed to load program:', error);
    document.getElementById('workout-name').textContent = 'Error loading program';
  }
}

// Get current phase data
function getCurrentPhase() {
  if (!programData) return null;
  return programData.phases.find(p => p.id === currentState.currentPhase);
}

// Get workout type for current day
function getWorkoutType() {
  const phase = getCurrentPhase();
  if (!phase || !phase.schedule_pattern) return null;

  // Day 1 = index 0, so subtract 1
  const dayIndex = (currentState.globalDay - 1) % phase.schedule_pattern.length;
  return phase.schedule_pattern[dayIndex];
}

// Get workout data for current day
function getTodaysWorkout() {
  const phase = getCurrentPhase();
  const workoutType = getWorkoutType();

  if (!phase || !workoutType || workoutType === 'Rest') {
    return null;
  }

  return phase.workouts[workoutType];
}

// Render the UI
function render() {
  // Update day counter
  document.getElementById('current-day').textContent = currentState.globalDay;

  const workout = getTodaysWorkout();
  const workoutCard = document.getElementById('workout-card');
  const restDay = document.getElementById('rest-day');

  if (!workout) {
    // Rest day
    workoutCard.classList.add('hidden');
    restDay.classList.remove('hidden');
    return;
  }

  // Workout day
  workoutCard.classList.remove('hidden');
  restDay.classList.add('hidden');

  document.getElementById('workout-name').textContent = workout.name;
  document.getElementById('workout-focus').textContent = workout.focus;

  const exercisesList = document.getElementById('exercises-list');
  const log = loadLog();

  exercisesList.innerHTML = workout.exercises.map((ex, index) => {
    const exerciseKey = `${currentState.globalDay}_${index}`;
    const lastWeight = getLastWeight(ex.name);
    const currentWeight = log[exerciseKey]?.weight || '';

    return `
      <div class="exercise" data-index="${index}">
        <div class="exercise-header">
          <span class="exercise-name">${ex.name}</span>
          ${ex.video_id ? `<button class="video-btn" data-video="${ex.video_id}">VIDEO</button>` : '<button class="video-btn" disabled>NO VIDEO</button>'}
        </div>
        <div class="exercise-details">
          <span><strong>${ex.sets}</strong> sets</span>
          <span><strong>${ex.reps}</strong> reps</span>
          <span><strong>${ex.rest}</strong> rest</span>
        </div>
        ${ex.note ? `<div class="exercise-note">${ex.note}</div>` : ''}
        <div class="weight-input">
          <label>Weight:</label>
          <input type="number"
                 class="weight-field"
                 data-exercise="${ex.name}"
                 data-key="${exerciseKey}"
                 value="${currentWeight}"
                 placeholder="${lastWeight || '—'}">
          <span class="unit">lbs</span>
        </div>
      </div>
    `;
  }).join('');
}

// Get the last recorded weight for an exercise
function getLastWeight(exerciseName) {
  const log = loadLog();
  let lastWeight = null;
  let lastDay = 0;

  for (const key in log) {
    if (log[key].exercise === exerciseName && log[key].day > lastDay) {
      lastWeight = log[key].weight;
      lastDay = log[key].day;
    }
  }

  return lastWeight;
}

// Bind event listeners
function bindEvents() {
  // Complete & Advance button
  document.getElementById('complete-btn').addEventListener('click', completeWorkout);

  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetProgress);

  // Video buttons (delegated)
  document.getElementById('exercises-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('video-btn') && !e.target.disabled) {
      openVideo(e.target.dataset.video);
    }
  });

  // Close modal
  document.getElementById('close-modal').addEventListener('click', closeVideo);
  document.getElementById('video-modal').addEventListener('click', (e) => {
    if (e.target.id === 'video-modal') closeVideo();
  });

  // Weight inputs (delegated)
  document.getElementById('exercises-list').addEventListener('input', (e) => {
    if (e.target.classList.contains('weight-field')) {
      saveWeightInput(e.target);
    }
  });
}

// Save weight input to log
function saveWeightInput(input) {
  const log = loadLog();
  const key = input.dataset.key;
  const weight = input.value;

  if (weight) {
    log[key] = {
      exercise: input.dataset.exercise,
      weight: parseFloat(weight),
      day: currentState.globalDay,
      timestamp: Date.now()
    };
  } else {
    delete log[key];
  }

  saveLog(log);
}

// Complete workout and advance day
function completeWorkout() {
  if (currentState.globalDay >= 365) {
    alert('Congratulations! You completed the 365-day program!');
    return;
  }

  currentState.globalDay++;

  // Check for phase transition (simplified - would need more logic for real phases)
  const phase = getCurrentPhase();
  if (phase) {
    const daysInPhase = phase.duration_weeks * 7;
    if (currentState.globalDay > daysInPhase && programData.phases.length > 1) {
      const currentIndex = programData.phases.findIndex(p => p.id === currentState.currentPhase);
      if (currentIndex < programData.phases.length - 1) {
        currentState.currentPhase = programData.phases[currentIndex + 1].id;
      }
    }
  }

  saveState();
  render();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset all progress
function resetProgress() {
  if (confirm('Reset all progress? This will clear your day count and exercise log.')) {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(LOG_KEY);
    currentState = { globalDay: 1, currentPhase: 'p1' };
    saveState();
    render();
  }
}

// Open video modal
function openVideo(videoId) {
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('video-container');

  container.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;

  modal.classList.remove('hidden');
}

// Close video modal
function closeVideo() {
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('video-container');

  container.innerHTML = '';
  modal.classList.add('hidden');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
