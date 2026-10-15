export type SeedQuestion = {
  prompt: string;
  explanation: string;
  options: { label: string; correct: boolean }[];
};

export type SeedLesson = {
  slug: string;
  topic: string;
  title: string;
  bite: string;
  sourceTitle: string;
  sourceUrl: string;
  questions: SeedQuestion[];
};

const sourceTitle = "WAEC Mathematics syllabus alignment";
const sourceUrl = "https://www.waeconline.org.ng/";
const q = (prompt: string, correct: string, others: string[], explanation: string): SeedQuestion => ({
  prompt,
  explanation,
  options: [correct, ...others].map((label, index) => ({ label, correct: index === 0 })),
});

export const seedLessons: SeedLesson[] = [
  {
    slug: "place-value-and-operations", topic: "Number", title: "Place value and operations",
    bite: "Every digit has a value set by its position. In 4,582, the 5 means five hundred. Before calculating, line up place values and estimate the size of an answer. Estimation is a quick way to spot a misplaced decimal or an impossible result.", sourceTitle, sourceUrl,
    questions: [q("What is the value of 7 in 3,742?", "700", ["70", "7", "7,000"], "The 7 is in the hundreds place."), q("Estimate 398 + 207.", "600", ["500", "700", "605"], "Round to 400 and 200 first."), q("Which is greatest?", "0.72", ["0.702", "0.27", "0.7"], "Compare tenths, then hundredths.")],
  },
  {
    slug: "fractions-decimals-percentages", topic: "Number", title: "Fractions, decimals and percentages",
    bite: "Fractions, decimals and percentages are three names for parts of a whole. Divide the numerator by the denominator for a decimal; multiply a decimal by 100 for a percentage. Convert to one form before comparing quantities.", sourceTitle, sourceUrl,
    questions: [q("What is 3/4 as a percentage?", "75%", ["25%", "34%", "0.75%"], "3 ÷ 4 = 0.75, and 0.75 × 100 = 75%."), q("Which equals 0.125?", "1/8", ["1/4", "1/5", "1/10"], "One eighth equals 0.125."), q("Find 20% of 250.", "50", ["25", "75", "200"], "20% is 0.2; 0.2 × 250 = 50.")],
  },
  {
    slug: "ratio-and-proportion", topic: "Number", title: "Ratio and proportion",
    bite: "A ratio compares quantities in the same units. Simplify it by dividing every term by the same factor. A proportion says two ratios are equal, so you can use multiplication or a unitary method to find a missing value.", sourceTitle, sourceUrl,
    questions: [q("Simplify 12:18.", "2:3", ["3:2", "6:9", "4:6"], "Divide both terms by 6."), q("If 3 books cost ₦900, what do 5 cost at the same rate?", "₦1,500", ["₦1,200", "₦1,800", "₦2,700"], "One book costs ₦300; five cost ₦1,500."), q("Share 40 in the ratio 1:3. What is the smaller share?", "10", ["20", "30", "40"], "There are 4 parts, so one part is 10.")],
  },
  {
    slug: "indices-and-standard-form", topic: "Algebra", title: "Indices and standard form",
    bite: "Indices are short forms for repeated multiplication: 2³ means 2 × 2 × 2. When multiplying equal bases, add indices. Standard form writes a number as a value from 1 to less than 10 multiplied by a power of ten.", sourceTitle, sourceUrl,
    questions: [q("Evaluate 2³.", "8", ["6", "9", "12"], "2 × 2 × 2 = 8."), q("Simplify x² × x³.", "x⁵", ["x⁶", "2x⁵", "x"], "Add the indices: 2 + 3 = 5."), q("Write 45,000 in standard form.", "4.5 × 10⁴", ["45 × 10³", "4.5 × 10³", "0.45 × 10⁵"], "Move the decimal four places left.")],
  },
  {
    slug: "linear-expressions", topic: "Algebra", title: "Linear expressions",
    bite: "An expression combines numbers and variables. Collect like terms—terms with the same variable and power—before substituting values. A coefficient is the number multiplying a variable, such as 3 in 3x.", sourceTitle, sourceUrl,
    questions: [q("Simplify 3x + 5x.", "8x", ["15x", "8", "x⁸"], "3 and 5 are like coefficients of x."), q("Find 2a + 3 when a = 4.", "11", ["8", "14", "5"], "2(4) + 3 = 11."), q("Which terms are like terms?", "4y and -2y", ["4y and 4x", "y and y²", "2 and 2x"], "They both have y to the first power.")],
  },
  {
    slug: "linear-equations", topic: "Algebra", title: "Solving linear equations",
    bite: "An equation says two expressions are equal. Keep it balanced: whatever operation you perform on one side, perform on the other. Undo addition or multiplication step by step, then check the solution in the original equation.", sourceTitle, sourceUrl,
    questions: [q("Solve x + 7 = 15.", "8", ["22", "7", "15"], "Subtract 7 from both sides."), q("Solve 3y = 21.", "7", ["18", "24", "63"], "Divide both sides by 3."), q("Solve 2x - 4 = 10.", "7", ["3", "12", "28"], "Add 4, then divide by 2.")],
  },
  {
    slug: "angles-and-lines", topic: "Geometry", title: "Angles on lines",
    bite: "Angles on a straight line add to 180°. Angles around a point add to 360°. Vertically opposite angles are equal. Draw a small diagram and mark known angles before choosing the rule that applies.", sourceTitle, sourceUrl,
    questions: [q("Angles on a straight line total:", "180°", ["90°", "270°", "360°"], "A straight angle is 180°."), q("One angle on a line is 65°. The other is:", "115°", ["65°", "125°", "295°"], "180° − 65° = 115°."), q("Vertically opposite angles are:", "equal", ["supplementary only", "always 90°", "unrelated"], "Opposite angles formed by crossing lines have equal size.")],
  },
  {
    slug: "triangles-and-polygons", topic: "Geometry", title: "Triangles and polygons",
    bite: "The interior angles of a triangle add to 180°. For a polygon, the sum is (n − 2) × 180°, where n is the number of sides. Use the sum to find a missing angle and then check whether the result is sensible.", sourceTitle, sourceUrl,
    questions: [q("The angles in a triangle total:", "180°", ["90°", "270°", "360°"], "This is the triangle angle-sum rule."), q("Find the third angle: 50°, 60°, ___.", "70°", ["80°", "90°", "110°"], "180 − 50 − 60 = 70."), q("A quadrilateral has how many sides?", "4", ["3", "5", "6"], "Quad means four.")],
  },
  {
    slug: "perimeter-and-area", topic: "Geometry", title: "Perimeter and area",
    bite: "Perimeter is the distance around a shape; area is the surface inside it. Add side lengths for perimeter. For a rectangle, area is length × width. Keep units: perimeter uses cm, while area uses cm².", sourceTitle, sourceUrl,
    questions: [q("Area of a 6 cm by 4 cm rectangle:", "24 cm²", ["10 cm", "20 cm²", "24 cm"], "Multiply length by width."), q("Perimeter of the same rectangle:", "20 cm", ["24 cm", "10 cm", "20 cm²"], "2(6 + 4) = 20."), q("Which unit suits area?", "m²", ["m", "m³", "kg"], "Area is measured in square units.")],
  },
  {
    slug: "data-tables-and-mean", topic: "Statistics", title: "Tables and mean",
    bite: "A data table organizes observations. The mean is the total of all values divided by the number of values. It describes the centre, but check the full data too: one unusually large or small value can change the mean.", sourceTitle, sourceUrl,
    questions: [q("Find the mean of 2, 4, 6.", "4", ["3", "6", "12"], "Their total is 12; 12 ÷ 3 = 4."), q("Which measure uses the total divided by count?", "mean", ["mode", "range", "median"], "That is the definition of the mean."), q("The range of 3, 8, 10 is:", "7", ["21", "10", "5"], "Largest minus smallest: 10 − 3.")],
  },
  {
    slug: "probability-basics", topic: "Statistics", title: "Probability basics",
    bite: "Probability measures how likely an event is, from 0 (impossible) to 1 (certain). For equally likely outcomes, probability is favourable outcomes divided by total outcomes. Your answer should never be negative or greater than 1.", sourceTitle, sourceUrl,
    questions: [q("Probability of heads on a fair coin:", "1/2", ["0", "1", "2"], "One favourable outcome out of two equally likely outcomes."), q("An impossible event has probability:", "0", ["1", "1/2", "-1"], "Impossible means it cannot happen."), q("A bag has 3 red and 2 blue balls. P(red) is:", "3/5", ["2/5", "3/2", "1/5"], "Three favourable outcomes out of five total." )],
  },
  {
    slug: "coordinates-and-gradient", topic: "Algebra", title: "Coordinates and gradient",
    bite: "Coordinates locate a point: (x, y) means move across x first, then up or down y. Gradient measures steepness: change in y divided by change in x. A positive gradient rises from left to right.", sourceTitle, sourceUrl,
    questions: [q("Which coordinate is 3 across and 2 up?", "(3, 2)", ["(2, 3)", "(-3, 2)", "(3, -2)"], "Coordinates are written x, then y."), q("Gradient equals:", "change in y ÷ change in x", ["x ÷ y", "x + y", "rise × run"], "Gradient is rise over run."), q("A line that rises left to right has a:", "positive gradient", ["negative gradient", "zero gradient", "undefined gradient"], "Its y-values increase as x increases.")],
  },
];

export const topicOrder = ["Number", "Algebra", "Geometry", "Statistics"];
