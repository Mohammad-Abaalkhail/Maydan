/**
 * Arabic Text Utilities
 * Centralized Arabic text for consistency and easy updates
 */

export const ARABIC_TEXT = {
  // Common
  loading: 'جاري التحميل...',
  error: 'حدث خطأ',
  success: 'نجح',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  close: 'إغلاق',
  
  // Auth
  login: {
    title: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    submit: 'تسجيل الدخول',
    loading: 'جاري تسجيل الدخول...',
    noAccount: 'ليس لديك حساب؟',
    registerLink: 'سجل الآن',
    usernamePlaceholder: 'أدخل اسم المستخدم',
    passwordPlaceholder: 'أدخل كلمة المرور',
  },
  
  register: {
    title: 'إنشاء حساب جديد',
    username: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    submit: 'إنشاء حساب',
    loading: 'جاري التسجيل...',
    hasAccount: 'لديك حساب بالفعل؟',
    loginLink: 'سجل الدخول',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    passwordTooShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  },
  
  // Lobby
  lobby: {
    title: 'الميدان يا حميدان',
    welcome: 'مرحباً',
    connected: '● متصل',
    disconnected: '● غير متصل',
    logout: 'تسجيل الخروج',
    createRoom: 'إنشاء غرفة جديدة',
    creating: 'جاري الإنشاء...',
    joinByCode: 'الانضمام برمز',
    roomCodePlaceholder: 'أدخل رمز الغرفة',
    join: 'انضم',
    availableRooms: 'الغرف المتاحة',
    noRooms: 'لا توجد غرف متاحة حالياً',
    createFirstRoom: 'أنشئ غرفة جديدة للبدء',
    waiting: 'في الانتظار',
    playing: 'قيد اللعب',
    players: 'لاعب',
    notConnected: 'غير متصل بالخادم',
    roomNotFound: 'الغرفة غير موجودة',
    joinFailed: 'فشل الانضمام للغرفة',
  },
  
  // Game Room
  gameRoom: {
    room: 'الغرفة',
    leave: 'مغادرة الغرفة',
    waiting: 'في الانتظار',
    playing: 'قيد اللعب',
    ended: 'انتهت',
    players: 'اللاعبون',
    yourTurn: '👈',
    points: 'النقاط',
    ready: '✓ جاهز',
    startGame: 'بدء اللعبة',
    minPlayers: 'عدد اللاعبين غير كافٍ',
    question: 'السؤال',
    yourAnswer: 'إجابتك',
    answerPlaceholder: 'اكتب إجابتك هنا...',
    submitAnswer: 'تقديم الإجابة',
    voting: 'التصويت',
    from: 'من',
    votes: 'الأصوات',
    accept: 'قبول',
    reject: 'رفض',
    yourCards: 'بطاقاتك',
    powerCards: 'بطاقات القوة',
    skipTurn: 'تخطي الدور',
    doubleVote: 'تصويت مزدوج',
    waitingForStart: 'في انتظار بدء اللعبة...',
    minPlayersRequired: 'يجب أن يكون هناك 3 لاعبين على الأقل لبدء اللعبة',
    winner: '🎉 الفائز!',
    diceRoll: '🎲 النرد',
    answerSubmitted: 'تم تقديم إجابة من',
    answerAccepted: 'تم قبول الإجابة!',
    answerRejected: 'تم رفض الإجابة',
    doubleVoteApplied: 'تم تطبيق التصويت المزدوج!',
    gameEnded: 'فاز',
    notConnected: 'غير متصل بالخادم',
    startFailed: 'فشل بدء اللعبة',
    answerFailed: 'فشل تقديم الإجابة',
    voteFailed: 'فشل التصويت',
    powerCardFailed: 'فشل استخدام بطاقة القوة',
  },
  
  // Errors
  errors: {
    authRequired: 'غير مصرح - Access token required',
    tokenExpired: 'غير مصرح - Token expired or invalid',
    roomFull: 'الغرفة ممتلئة',
    roomNotFound: 'الغرفة غير موجودة',
    roomBadState: 'الغرفة في حالة غير صالحة',
    gameBadState: 'اللعبة في حالة غير صالحة',
    notYourTurn: 'ليس دورك',
    alreadyVoted: 'لقد صوّتت بالفعل',
    powerUsed: 'تم استخدام بطاقة القوة بالفعل',
    powerBadState: 'لا يمكن استخدام بطاقة القوة في هذه الحالة',
    powerNotOwner: 'أنت لست صاحب الدور',
    rateLimit: 'تم تجاوز الحد المسموح',
  },
};

/**
 * Get Arabic text by key path
 * Example: getText('login.title') => 'تسجيل الدخول'
 */
export function getText(path, fallback = '') {
  const keys = path.split('.');
  let value = ARABIC_TEXT;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback || path;
    }
  }
  
  return typeof value === 'string' ? value : fallback || path;
}

