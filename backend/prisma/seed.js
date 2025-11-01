import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DISABLED IN PRODUCTION
if (process.env.NODE_ENV === 'production') {
  console.log('❌ Seeding disabled in production environment');
  process.exit(0);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-actors' },
      update: {},
      create: {
        id: 'cat-actors',
        nameAr: 'ممثلين',
        descriptionAr: 'ممثلين كويتيين مشهورين',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-plays' },
      update: {},
      create: {
        id: 'cat-plays',
        nameAr: 'مسرحيات',
        descriptionAr: 'مسرحيات كويتية كلاسيكية',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-movies' },
      update: {},
      create: {
        id: 'cat-movies',
        nameAr: 'أفلام',
        descriptionAr: 'أفلام كويتية مشهورة',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-series' },
      update: {},
      create: {
        id: 'cat-series',
        nameAr: 'مسلسلات',
        descriptionAr: 'مسلسلات كويتية شعبية',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create Card Types
  const regularCardType = await prisma.cardType.upsert({
    where: { id: 'cardtype-regular' },
    update: {},
    create: {
      id: 'cardtype-regular',
      nameAr: 'بطاقة عادية',
      type: 'regular',
    },
  });

  console.log('✅ Created card types');

  // Create Power Cards
  const powerCards = await Promise.all([
    prisma.powerCard.upsert({
      where: { code: 'help' },
      update: {},
      create: {
        nameAr: 'بساعدك',
        code: 'help',
        descriptionAr: 'تم احتساب عنصر واحد مفقود كمتحقق.',
        icon: 'help',
        active: true,
      },
    }),
    prisma.powerCard.upsert({
      where: { code: 'drop_hand' },
      update: {},
      create: {
        nameAr: 'نزل اللي بايدك',
        code: 'drop_hand',
        descriptionAr: 'تم تفريغ يد {player} وسحب ٣ بطاقات جديدة.',
        icon: 'drop_hand',
        active: true,
      },
    }),
    prisma.powerCard.upsert({
      where: { code: 'give_take' },
      update: {},
      create: {
        nameAr: 'عطني',
        code: 'give_take',
        descriptionAr: 'تم تبادل بطاقة بينك وبين {player}.',
        icon: 'give_take',
        active: true,
      },
    }),
    prisma.powerCard.upsert({
      where: { code: 'skip_next' },
      update: {},
      create: {
        nameAr: 'اقعد مكانك',
        code: 'skip_next',
        descriptionAr: 'تم تخطي دور {player} في الدورة القادمة.',
        icon: 'skip_next',
        active: true,
      },
    }),
    prisma.powerCard.upsert({
      where: { code: 'ask_card' },
      update: {},
      create: {
        nameAr: 'شيرني',
        code: 'ask_card',
        descriptionAr: '{player} يمتلك البطاقة المطلوبة وتم نقلها إليك.',
        icon: 'ask_card',
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${powerCards.length} power cards`);

  // Create Sample Cards (for each category)
  const sampleCards = [
    // Actors
    { textAr: 'عبد الحسين عبد الرضا', categoryId: 'cat-actors' },
    { textAr: 'سعد الفرج', categoryId: 'cat-actors' },
    { textAr: 'محمد المنصور', categoryId: 'cat-actors' },
    { textAr: 'حياة الفهد', categoryId: 'cat-actors' },
    { textAr: 'داوود حسين', categoryId: 'cat-actors' },
    // Plays
    { textAr: 'باي باي لندن', categoryId: 'cat-plays' },
    { textAr: 'قرقيعان', categoryId: 'cat-plays' },
    { textAr: 'زين العابدين', categoryId: 'cat-plays' },
    { textAr: 'حمدان والقط', categoryId: 'cat-plays' },
    { textAr: 'عبد الله في الكويت', categoryId: 'cat-plays' },
    // Movies
    { textAr: 'باي باي لندن', categoryId: 'cat-movies' },
    { textAr: 'المسافر', categoryId: 'cat-movies' },
    { textAr: 'قصة حب', categoryId: 'cat-movies' },
    { textAr: 'حب في الكويت', categoryId: 'cat-movies' },
    { textAr: 'أيام من حياتي', categoryId: 'cat-movies' },
    // Series
    { textAr: 'درب الزلق', categoryId: 'cat-series' },
    { textAr: 'مسرح الكويت', categoryId: 'cat-series' },
    { textAr: 'سحابة صيف', categoryId: 'cat-series' },
    { textAr: 'طاش ما طاش', categoryId: 'cat-series' },
    { textAr: 'قاصد خير', categoryId: 'cat-series' },
  ];

  for (const card of sampleCards) {
    await prisma.card.upsert({
      where: {
        id: `card-${card.textAr.replace(/\s+/g, '-').toLowerCase()}`,
      },
      update: {},
      create: {
        id: `card-${card.textAr.replace(/\s+/g, '-').toLowerCase()}`,
        textAr: card.textAr,
        categoryId: card.categoryId,
        cardTypeId: regularCardType.id,
      },
    });
  }

  console.log(`✅ Created ${sampleCards.length} sample cards`);

  // Create Sample Questions
  const sampleQuestions = [
    {
      textAr: 'اذكر ثلاث مسرحيات كويتية مشهورة',
      categoryId: 'cat-plays',
      difficulty: 'easy',
    },
    {
      textAr: 'من هم أشهر خمسة ممثلين كويتيين؟',
      categoryId: 'cat-actors',
      difficulty: 'medium',
    },
    {
      textAr: 'اذكر أربعة مسلسلات كويتية كلاسيكية',
      categoryId: 'cat-series',
      difficulty: 'medium',
    },
    {
      textAr: 'ما هي أسماء ثلاثة أفلام كويتية مشهورة؟',
      categoryId: 'cat-movies',
      difficulty: 'easy',
    },
  ];

  for (const question of sampleQuestions) {
    await prisma.question.upsert({
      where: {
        id: `q-${question.textAr.substring(0, 10).replace(/\s+/g, '-').toLowerCase()}`,
      },
      update: {},
      create: {
        id: `q-${question.textAr.substring(0, 10).replace(/\s+/g, '-').toLowerCase()}`,
        textAr: question.textAr,
        categoryId: question.categoryId,
        difficulty: question.difficulty,
      },
    });
  }

  console.log(`✅ Created ${sampleQuestions.length} sample questions`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

