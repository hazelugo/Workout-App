export const queryKeys = {
  history: {
    all: ['history'],
    sessions: () => [...queryKeys.history.all, 'sessions'],
  },
  customDays: {
    all: ['customDays'],
    list: () => [...queryKeys.customDays.all, 'list'],
  },
  profile: {
    all: ['profile'],
    detail: (userId) => [...queryKeys.profile.all, userId],
  },
}
