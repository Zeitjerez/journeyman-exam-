import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'db';

export const dynamic = 'force-dynamic';

interface CategoryDistribution {
  categoryCode: string;
  categoryName: string;
  weight: number | null;
  questionsAllocated: number;
}

interface ExamPreviewResponse {
  totalQuestions: number;
  distribution: CategoryDistribution[];
  engine: 'proportional' | 'uniform';
}

/**
 * Blueprint Weight Engine
 * Distributes questions across categories based on weights
 * Ensures no rounding drift: sum of allocated questions always equals totalQuestions
 */
function distributeQuestions(
  categories: Array<{ code: string; name: string; weight: number | null }>,
  totalQuestions: number
): CategoryDistribution[] {
  // Check if all categories have weights
  const hasWeights = categories.every((cat) => cat.weight !== null);
  const engine: 'proportional' | 'uniform' = hasWeights ? 'proportional' : 'uniform';

  let distribution: CategoryDistribution[];

  if (engine === 'proportional') {
    // Calculate total weight
    const totalWeight = categories.reduce((sum, cat) => sum + (cat.weight ?? 0), 0);

    // Calculate exact proportional allocation (as floats)
    const exactAllocations = categories.map((cat) => ({
      categoryCode: cat.code,
      categoryName: cat.name,
      weight: cat.weight,
      exact: ((cat.weight ?? 0) / totalWeight) * totalQuestions,
      allocated: 0,
    }));

    // First pass: allocate floor values
    let allocated = 0;
    exactAllocations.forEach((item) => {
      item.allocated = Math.floor(item.exact);
      allocated += item.allocated;
    });

    // Second pass: distribute remaining questions to categories with largest fractional parts
    const remaining = totalQuestions - allocated;
    const sorted = exactAllocations
      .map((item, index) => ({
        index,
        fractional: item.exact - item.allocated,
      }))
      .sort((a, b) => b.fractional - a.fractional);

    for (let i = 0; i < remaining; i++) {
      exactAllocations[sorted[i].index].allocated++;
    }

    distribution = exactAllocations.map((item) => ({
      categoryCode: item.categoryCode,
      categoryName: item.categoryName,
      weight: item.weight,
      questionsAllocated: item.allocated,
    }));
  } else {
    // Uniform distribution
    const baseQuestions = Math.floor(totalQuestions / categories.length);
    const remainder = totalQuestions % categories.length;

    distribution = categories.map((cat, index) => ({
      categoryCode: cat.code,
      categoryName: cat.name,
      weight: cat.weight,
      questionsAllocated: baseQuestions + (index < remainder ? 1 : 0),
    }));
  }

  // Verify no rounding drift
  const sum = distribution.reduce((acc, item) => acc + item.questionsAllocated, 0);
  if (sum !== totalQuestions) {
    throw new Error(
      `Rounding drift detected: allocated ${sum} questions but expected ${totalQuestions}`
    );
  }

  return distribution;
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameter
    const searchParams = request.nextUrl.searchParams;
    const questionsParam = searchParams.get('questions');
    const totalQuestions = questionsParam ? parseInt(questionsParam, 10) : 40;

    // Validate questions parameter
    if (isNaN(totalQuestions) || totalQuestions < 1 || totalQuestions > 1000) {
      return NextResponse.json(
        { error: 'Invalid questions parameter. Must be between 1 and 1000.' },
        { status: 400 }
      );
    }

    // Fetch active blueprint categories
    const categories = await prisma.blueprintCategory.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      select: {
        code: true,
        name: true,
        weight: true,
      },
    });

    if (categories.length === 0) {
      return NextResponse.json(
        { error: 'No active blueprint categories found' },
        { status: 404 }
      );
    }

    // Convert Decimal weights to numbers
    const categoriesWithNumericWeights = categories.map((cat) => ({
      code: cat.code,
      name: cat.name,
      weight: cat.weight ? Number(cat.weight) : null,
    }));

    // Distribute questions using blueprint weight engine
    const distribution = distributeQuestions(categoriesWithNumericWeights, totalQuestions);

    // Determine engine type
    const engine = categoriesWithNumericWeights.every((cat) => cat.weight !== null)
      ? 'proportional'
      : 'uniform';

    const response: ExamPreviewResponse = {
      totalQuestions,
      distribution,
      engine,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in /api/exam/preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
