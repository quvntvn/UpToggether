const fr = {
  appName: 'UpTogether',
  slogan: 'Ne te réveille pas seul.',
  common: {
    cancel: 'Annuler',
    save: 'Enregistrer',
    stop: 'Arrêter',
    backHome: 'Retour à l’accueil',
  },
  home: {
    nextAlarm: 'Prochain réveil',
    noAlarmSaved: 'Aucun réveil enregistré',
    emptyAlarmDescription: 'Programme ton premier réveil pour bien lancer tes matinées.',
    scheduledFor: 'Prévu le {{date}} à {{time}}',
    setAlarm: 'Régler le réveil',
    friends: 'Amis',
    settings: 'Paramètres',
    previewWakeResult: 'Aperçu du résultat du réveil',
    testWake: 'Tester le réveil',
  },
  setAlarm: {
    title: 'Régler le réveil',
    selectedTime: 'Heure sélectionnée',
    helper: 'Si l’heure du jour est déjà passée, le réveil sonnera demain.',
    saveAlarm: 'Enregistrer le réveil',
    saving: 'Enregistrement...',
    notificationsDisabledTitle: 'Notifications désactivées',
    notificationsDisabledMessage:
      'Autorise les notifications pour recevoir tes rappels de réveil locaux dans une build de développement.',
    alarmSavedTitle: 'Réveil enregistré',
    alarmSavedMessage: 'Ton prochain réveil est réglé pour {{time}}.',
    alarmSavedButton: 'Super',
    saveFailedTitle: 'Impossible d’enregistrer le réveil',
    saveFailedMessage:
      'Réessaie dans une build de développement avec les notifications activées.',
  },
  friends: {
    title: 'Amis',
    subtitle: 'Ton équipe de réveil apparaîtra ici.',
    memberLabel: 'Membre de l’équipe de réveil',
  },
  result: {
    title: 'Résultat du réveil',
    kicker: 'Résultat du réveil',
    reactionTime: 'Temps de réaction',
    percentile: '{{value}}e percentile',
    fasterThanUsers: 'Plus rapide que {{value}} % des utilisateurs',
    whatHappened: 'Ce qu’il s’est passé',
    whatHappenedBody:
      'Ton réveil a lancé le parcours de réveil, tu as appuyé sur ARRÊTER, et l’app a mesuré ta vitesse de réaction.',
  },
  wake: {
    title: 'Réveille-toi',
    kicker: 'Réveil en cours',
    timerLabel: 'Chrono de réaction',
  },
  settings: {
    title: 'Paramètres',
    subtitle: 'Choisis la langue utilisée par UpTogether.',
    languageSection: 'Langue',
    french: 'Français',
    english: 'English',
    activeLabel: 'Sélectionné',
  },
} as const;

export default fr;
