import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Blueprint Categories
  console.log('📋 Seeding Blueprint Categories...');

  const categories = [
    {
      code: 'BC01',
      name: 'Wiring Methods & Materials',
      description: 'Wiring methods, materials, and installations including raceways, cables, and boxes',
      weight: 15.0,
      isActive: true,
    },
    {
      code: 'BC02',
      name: 'Wiring & Protection',
      description: 'Branch circuits, feeders, services, grounding, and overcurrent protection',
      weight: 12.0,
      isActive: true,
    },
    {
      code: 'BC03',
      name: 'General Electrical Theory',
      description: 'Definitions, calculations, and fundamental electrical theory',
      weight: 10.0,
      isActive: true,
    },
    {
      code: 'BC04',
      name: 'Equipment for General Use',
      description: 'Appliances, motors, air conditioning, refrigeration, and general use equipment',
      weight: 10.0,
      isActive: true,
    },
    {
      code: 'BC05',
      name: 'Plan Reading',
      description: 'Blueprint reading, electrical symbols, and construction documents',
      weight: 8.0,
      isActive: true,
    },
    {
      code: 'BC06',
      name: 'Communication Systems',
      description: 'Communication circuits, data systems, and low-voltage installations',
      weight: 5.0,
      isActive: true,
    },
    {
      code: 'BC07',
      name: 'Motors & Controls',
      description: 'Motor circuits, controllers, and control devices',
      weight: 15.0,
      isActive: true,
    },
    {
      code: 'BC08',
      name: 'Special Conditions',
      description: 'Emergency systems, standby power, fire alarms, and special conditions',
      weight: 8.0,
      isActive: true,
    },
    {
      code: 'BC09',
      name: 'Special Equipment',
      description: 'Electric signs, cranes, elevators, welders, and special equipment',
      weight: 10.0,
      isActive: true,
    },
    {
      code: 'BC10',
      name: 'Special Occupancies',
      description: 'Hazardous locations, commercial garages, and special occupancies',
      weight: 7.0,
      isActive: true,
    },
  ];

  for (const category of categories) {
    await prisma.blueprintCategory.upsert({
      where: { code: category.code },
      update: category,
      create: category,
    });
  }

  console.log(`✅ Seeded ${categories.length} blueprint categories`);

  // Seed NEC References (one per category with real NEC 2020 articles)
  console.log('📖 Seeding NEC References...');

  const necRefs = [
    {
      article: '300',
      section: '5',
      title: 'Underground Installations',
      edition: '2020',
    },
    {
      article: '210',
      section: '19',
      title: 'Branch Circuits - Dwelling Unit Receptacle Outlets',
      edition: '2020',
    },
    {
      article: '100',
      section: '',
      title: 'Definitions',
      edition: '2020',
    },
    {
      article: '430',
      section: '22',
      title: 'Motor Circuit - Single Motor',
      edition: '2020',
    },
    {
      article: '220',
      section: '12',
      title: 'General Lighting Load',
      edition: '2020',
    },
    {
      article: '800',
      section: '2',
      title: 'Communication Circuits - Definitions',
      edition: '2020',
    },
    {
      article: '430',
      section: '32',
      title: 'Motor Overload Protection',
      edition: '2020',
    },
    {
      article: '700',
      section: '12',
      title: 'Emergency Systems - General Requirements',
      edition: '2020',
    },
    {
      article: '600',
      section: '6',
      title: 'Electric Signs and Outline Lighting - Disconnects',
      edition: '2020',
    },
    {
      article: '511',
      section: '3',
      title: 'Commercial Garages - Classification of Locations',
      edition: '2020',
    },
  ];

  for (const necRef of necRefs) {
    await prisma.necRef.create({
      data: necRef,
    });
  }

  console.log(`✅ Seeded ${necRefs.length} NEC references`);

  console.log('✨ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
