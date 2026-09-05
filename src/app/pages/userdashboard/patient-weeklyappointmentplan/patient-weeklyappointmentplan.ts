import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DayPlan, DayExercise } from '../../../models/usermode';

@Component({
  selector: 'app-patient-weeklyappointmentplan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-weeklyappointmentplan.html',
  styleUrl: './patient-weeklyappointmentplan.css',
})
export class PatientWeeklyappointmentplan {
  selectedDayIndex = 0;
  painLevel = 3;

  weeklyPlan: DayPlan[] = [
    { dayName: 'Monday', dayShort: 'Mon', dayNumber: 1, focus: 'Lumbar Mobility & Core Activation', exercises: [
      { id: 'ex-1', name: 'Cat-Camel Spinal Mobilization', targetArea: 'Spine & Paraspinal Muscles', sets: '3 sets × 12 reps', duration: '5 mins', difficulty: 'Beginner', notes: 'Move fluidly with your breath.', completed: true },
      { id: 'ex-2', name: 'Bird-Dog Core Stability', targetArea: 'Transverse Abdominis & Glutes', sets: '3 sets × 10 reps each side', duration: '6 mins', difficulty: 'Beginner', notes: 'Keep hips completely level.', completed: true },
      { id: 'ex-3', name: 'Pelvic Tilts on Mat', targetArea: 'Lower Abdominals & Pelvis', sets: '2 sets × 15 reps', duration: '4 mins', difficulty: 'Beginner', notes: 'Flatten lower back firmly into the floor.', completed: true }
    ]},
    { dayName: 'Tuesday', dayShort: 'Tue', dayNumber: 2, focus: 'Hip Flexor & Hamstring Release', exercises: [
      { id: 'ex-4', name: 'Supine Hamstring Stretch with Strap', targetArea: 'Hamstrings & Posterior Chain', sets: '3 sets × 30s holds', duration: '5 mins', difficulty: 'Beginner', notes: 'Keep opposite knee straight.', completed: true },
      { id: 'ex-5', name: 'Half-Kneeling Hip Flexor Stretch', targetArea: 'Psoas & Quad Complex', sets: '3 sets × 30s holds', duration: '6 mins', difficulty: 'Moderate', notes: 'Tuck pelvis under before leaning forward.', completed: false },
      { id: 'ex-6', name: 'Glute Bridge with 3s Pause', targetArea: 'Gluteus Maximus & Hamstrings', sets: '3 sets × 12 reps', duration: '5 mins', difficulty: 'Beginner', notes: 'Drive through your heels.', completed: false }
    ]},
    { dayName: 'Wednesday', dayShort: 'Wed', dayNumber: 3, focus: 'Active Rest & Gentle Walking', exercises: [
      { id: 'ex-7', name: 'Brisk Low-Impact Walk', targetArea: 'Cardiovascular & Joint Lubrication', sets: '1 continuous block', duration: '25 mins', difficulty: 'Beginner', notes: 'Maintain tall upright posture.', completed: false },
      { id: 'ex-8', name: 'Thoracic Foam Rolling', targetArea: 'Mid-Back & Shoulder Blades', sets: '2 sets × 60s', duration: '4 mins', difficulty: 'Beginner', notes: 'Avoid rolling onto the lower lumbar area.', completed: false }
    ]},
    { dayName: 'Thursday', dayShort: 'Thu', dayNumber: 4, focus: 'Dynamic Core & Posterior Chain', exercises: [
      { id: 'ex-9', name: 'Dead Bug Arm & Leg Reaches', targetArea: 'Deep Core Stabilizers', sets: '3 sets × 10 reps each side', duration: '7 mins', difficulty: 'Moderate', notes: 'Maintain constant lower-back contact with the ground.', completed: false },
      { id: 'ex-10', name: 'Prone Cobra Extension', targetArea: 'Mid-Back & Scapular Retractors', sets: '3 sets × 10 reps (5s hold)', duration: '5 mins', difficulty: 'Moderate', notes: 'Focus on pinching shoulder blades downward.', completed: false },
      { id: 'ex-11', name: 'Clamshell with Resistance Band', targetArea: 'Gluteus Medius', sets: '3 sets × 15 reps each side', duration: '6 mins', difficulty: 'Moderate', notes: 'Do not allow upper hip to roll backwards.', completed: false }
    ]},
    { dayName: 'Friday', dayShort: 'Fri', dayNumber: 5, focus: 'Functional Movement & Posture', exercises: [
      { id: 'ex-12', name: 'Wall Angels for Posture', targetArea: 'Scapula & Upper Spine', sets: '3 sets × 10 reps', duration: '5 mins', difficulty: 'Beginner', notes: 'Keep elbows and wrists flat against the wall.', completed: false },
      { id: 'ex-13', name: 'Bodyweight Box Squat', targetArea: 'Quads, Glutes & Hip Hinge', sets: '3 sets × 12 reps', duration: '6 mins', difficulty: 'Moderate', notes: 'Sit hips back without spinal collapse.', completed: false }
    ]},
    { dayName: 'Saturday', dayShort: 'Sat', dayNumber: 6, focus: 'Deep Stretching & Recovery Flow', exercises: [
      { id: 'ex-14', name: "Child's Pose with Lat Reach", targetArea: 'Thoracolumbar Fascia & Lats', sets: '3 sets × 45s holds', duration: '6 mins', difficulty: 'Beginner', notes: 'Deep diaphragmatic breathing into the lower ribs.', completed: false },
      { id: 'ex-15', name: 'Piriformis Figure-4 Stretch', targetArea: 'Deep Hip Rotators & Sciatic Path', sets: '3 sets × 30s each side', duration: '5 mins', difficulty: 'Beginner', notes: 'Keep neck relaxed on mat.', completed: false }
    ]},
    { dayName: 'Sunday', dayShort: 'Sun', dayNumber: 7, focus: 'Complete Rest & Recovery Check-in', exercises: [
      { id: 'ex-16', name: 'Hot/Cold Contrast Compress & Hydration', targetArea: 'Whole Body Recovery', sets: '1 routine', duration: '15 mins', difficulty: 'Beginner', notes: 'Log your weekly pain and mobility feedback.', completed: false }
    ]},
  ];

  get currentDayPlan(): DayPlan {
    return this.weeklyPlan[this.selectedDayIndex];
  }

  selectDay(index: number): void {
    this.selectedDayIndex = index;
  }

  toggleExercise(exercise: DayExercise): void {
    exercise.completed = !exercise.completed;
  }

  get weeklyCompletionRate(): number {
    let total = 0, completed = 0;
    for (const day of this.weeklyPlan) {
      for (const ex of day.exercises) {
        total++;
        if (ex.completed) completed++;
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}
