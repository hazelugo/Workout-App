export const queryKeys = {
  history: {
    all: ['history'],
    sessions: () => [...queryKeys.history.all, 'sessions'],
  },
  customDays: {
    all: ['customDays'],
    list: () => [...queryKeys.customDays.all, 'list'],
  },
  programs: {
    all: ['programs'],
    list: () => [...queryKeys.programs.all, 'list'],
  },
  profile: {
    all: ['profile'],
    detail: (userId) => [...queryKeys.profile.all, userId],
  },
  savedExercises: {
    all: ['savedExercises'],
    list: (userId) => [...queryKeys.savedExercises.all, userId],
  },
}
