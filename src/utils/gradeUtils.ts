export const calculateGPA = (grades: number[], weights: number[] = []): number => {
  if (grades.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  grades.forEach((grade, index) => {
    const weight = weights[index] || 1;
    weightedSum += grade * weight;
    totalWeight += weight;
  });

  return Math.round((weightedSum / totalWeight) * 100) / 100;
};

export const getGradeLetterFromPercentage = (
  percentage: number
): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

export const getGradeColor = (
  grade: number
): {
  text: string;
  background: string;
  light: string;
} => {
  if (grade >= 90) {
    return {
      text: '#31A24C',
      background: '#E8F5E9',
      light: '#C8E6C9',
    };
  }
  if (grade >= 80) {
    return {
      text: '#0A66C2',
      background: '#E3F2FD',
      light: '#BBDEFB',
    };
  }
  if (grade >= 70) {
    return {
      text: '#F02849',
      background: '#FFF3E0',
      light: '#FFE0B2',
    };
  }
  return {
    text: '#E0245E',
    background: '#FFEBEE',
    light: '#FFCDD2',
  };
};

export const calculateNeededGrade = (
  currentGrade: number,
  targetGrade: number,
  weight: number = 1
): number => {
  if (currentGrade >= targetGrade) return targetGrade;

  const neededPoints = targetGrade - currentGrade;
  return currentGrade + neededPoints / weight;
};

export const formatGradeForDisplay = (grade: number): string => {
  return grade.toFixed(1);
};

export const isPassingGrade = (grade: number, passingGrade: number = 60): boolean => {
  return grade >= passingGrade;
};
