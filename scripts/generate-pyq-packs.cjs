const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Chapters definition
const physicsChapters = [
  'Units & Dimensions', 'Kinematics', 'Laws of Motion', 'Work Energy & Power',
  'Rotational Motion', 'Gravitation', 'Thermodynamics & KTG', 'Oscillations & Waves',
  'Electrostatics', 'Current Electricity', 'Magnetic Effects of Current',
  'Electromagnetic Induction', 'Alternating Current', 'Ray Optics',
  'Wave Optics', 'Dual Nature & Modern Physics', 'Semiconductors'
];

const chemistryChapters = [
  'Some Basic Concepts of Chemistry (Mole Concept)', 'Atomic Structure',
  'Chemical Bonding & Molecular Structure', 'Chemical Thermodynamics',
  'Chemical Kinetics', 'Solutions & Colligative Properties', 'Electrochemistry',
  'Surface Chemistry', 'General Organic Chemistry (GOC)', 'Hydrocarbons',
  'Aldehydes, Ketones & Carboxylic Acids', 'Amines', 'Biomolecules',
  'Coordination Compounds', 'p-Block Elements', 'd- and f-Block Elements', 'Equilibrium'
];

const mathsChapters = [
  'Sets, Relations & Functions', 'Complex Numbers & Quadratic Equations',
  'Matrices & Determinants', 'Permutations & Combinations', 'Binomial Theorem',
  'Sequences & Series', 'Limits, Continuity & Differentiability',
  'Application of Derivatives', 'Indefinite Integration', 'Definite Integration',
  'Differential Equations', 'Straight Lines & Circles', 'Conic Sections (Parabola, Ellipse, Hyperbola)',
  'Vector Algebra', 'Three Dimensional Geometry (3D)', 'Probability', 'Trigonometry'
];

// Generator functions returning full question objects
const mathGenerators = [
  (i, year, chapter) => ({
    topic: "Definite Integrals & Properties",
    questionText: `Evaluate the definite integral:
$$I = \\int_{0}^{\\pi/2} \\frac{\\sin^{${2 + (i % 4)}} x}{\\sin^{${2 + (i % 4)}} x + \\cos^{${2 + (i % 4)}} x} \\, dx$$`,
    options: [
      { id: 'A', text: '$\\frac{\\pi}{4}$' },
      { id: 'B', text: '$\\frac{\\pi}{2}$' },
      { id: 'C', text: '$\\frac{\\pi}{8}$' },
      { id: 'D', text: '$1$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: King's Property", content: "Using $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$, replace $x$ with $\\pi/2 - x$." },
        { title: "Step 2: Add Integrals", content: "Adding both integrals yields $2I = \\int_0^{\\pi/2} 1 \\, dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["King's Property of Definite Integrals", "Symmetry"],
      shortcutMethod: "Whenever $f(x) + f(a-x) = C$, the integral is strictly $\\frac{a-0}{2} = \\frac{\\pi/2}{2} = \\frac{\\pi}{4}$."
    }
  }),
  (i, year, chapter) => ({
    topic: "Matrices & Determinants",
    questionText: `If $A = \\begin{bmatrix} 1 & 1 \\\\ 0 & 1 \\end{bmatrix}$, then the matrix $A^{${10 + (i % 15)}}$ is equal to:`,
    options: [
      { id: 'A', text: `$\\begin{bmatrix} 1 & ${10 + (i % 15)} \\\\ 0 & 1 \\end{bmatrix}$` },
      { id: 'B', text: `$\\begin{bmatrix} ${10 + (i % 15)} & 1 \\\\ 0 & 1 \\end{bmatrix}$` },
      { id: 'C', text: '$\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$' },
      { id: 'D', text: `$\\begin{bmatrix} 1 & 1 \\\\ 0 & ${10 + (i % 15)} \\end{bmatrix}$` }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: Mathematical Induction / Nilpotent Matrix", content: "Let $N = \\begin{bmatrix} 0 & 1 \\\\ 0 & 0 \\end{bmatrix}$. Notice $N^2 = 0$." },
        { title: "Step 2: Binomial Expansion", content: `Since $A = I + N$, $A^n = I + nN = \\begin{bmatrix} 1 & n \\\\ 0 & 1 \\end{bmatrix}$. Here $n = ${10 + (i % 15)}$.` }
      ],
      finalAnswer: 'A',
      keyConcepts: ["Matrix Exponentiation", "Nilpotent Matrices"]
    }
  }),
  (i, year, chapter) => ({
    topic: "Vectors & 3D Geometry",
    questionText: `Find the value of $\\lambda$ such that the vectors $\\vec{a} = 2\\hat{i} - \\hat{j} + \\hat{k}$, $\\vec{b} = \\hat{i} + 2\\hat{j} - 3\\hat{k}$ and $\\vec{c} = 3\\hat{i} + \\lambda\\hat{j} + 5\\hat{k}$ are coplanar:`,
    options: [
      { id: 'A', text: '$-4$' },
      { id: 'B', text: '$2$' },
      { id: 'C', text: '$4$' },
      { id: 'D', text: '$-2$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: Condition for Coplanarity", content: "Three vectors are coplanar if and only if their scalar triple product $[\\vec{a} \\,\\vec{b} \\,\\vec{c}] = 0$." },
        { title: "Step 2: Determinant Expansion", content: "$\\begin{vmatrix} 2 & -1 & 1 \\\\ 1 & 2 & -3 \\\\ 3 & \\lambda & 5 \\end{vmatrix} = 2(10 + 3\\lambda) + 1(5 + 9) + 1(\\lambda - 6) = 20 + 6\\lambda + 14 + \\lambda - 6 = 7\\lambda + 28 = 0 \\implies \\lambda = -4$." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["Scalar Triple Product", "Coplanar Vectors"]
    }
  }),
  (i, year, chapter) => ({
    topic: "Limits & Continuity",
    questionText: `Evaluate the limit:
$$\\lim_{x \\to 0} \\frac{\\tan x - \\sin x}{x^3}$$`,
    options: [
      { id: 'A', text: '$\\frac{1}{2}$' },
      { id: 'B', text: '$1$' },
      { id: 'C', text: '$\\frac{1}{4}$' },
      { id: 'D', text: '$0$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: Trigonometric Factorization", content: "$\\tan x - \\sin x = \\sin x \\left(\\frac{1 - \\cos x}{\\cos x}\\right) = \\tan x \\cdot (1 - \\cos x) = \\tan x \\cdot 2\\sin^2(x/2)$." },
        { title: "Step 2: Standard Limits", content: "$\\lim_{x \\to 0} \\left(\\frac{\\tan x}{x}\\right) \\cdot \\frac{2\\sin^2(x/2)}{(x/2)^2 \\cdot 4} = 1 \\cdot \\frac{2}{4} = \\frac{1}{2}$." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["Standard Trigonometric Limits", "L'Hopital / Series expansion"]
    }
  })
];

const physicsGenerators = [
  (i, year, chapter) => ({
    topic: "Rotational Dynamics",
    questionText: `A solid cylinder of mass $M = ${2 + (i % 6)}\\,\\text{kg}$ and radius $R = 0.5\\,\\text{m}$ rolls without slipping down an inclined plane of inclination $\\theta = 30^\\circ$. The linear acceleration of the cylinder is:`,
    options: [
      { id: 'A', text: '$\\frac{1}{3} g$' },
      { id: 'B', text: '$\\frac{1}{2} g$' },
      { id: 'C', text: '$\\frac{2}{3} g$' },
      { id: 'D', text: '$\\frac{5}{7} g$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: Rolling Acceleration Formula", content: "$a = \\frac{g\\sin\\theta}{1 + \\frac{I_{\\text{cm}}}{MR^2}}$." },
        { title: "Step 2: Solid Cylinder Inertia", content: "For a solid cylinder $I_{\\text{cm}} = \\frac{1}{2} MR^2$, so $1 + \\frac{1}{2} = \\frac{3}{2}$. Hence $a = \\frac{g\\sin 30^\\circ}{3/2} = \\frac{g(1/2)}{3/2} = \\frac{1}{3} g$." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["Pure Rolling on Incline", "Rotational Dynamics"]
    }
  }),
  (i, year, chapter) => ({
    topic: "Electromagnetic Induction",
    questionText: `A circular coil of radius $r = 10\\,\\text{cm}$ and $N = ${50 + (i % 50)}$ turns rotates with uniform angular speed $\\omega = 100\\,\\text{rad/s}$ in a magnetic field $B = 0.2\\,\\text{T}$ perpendicular to the rotation axis. The peak EMF induced is:`,
    options: [
      { id: 'A', text: `$${(0.2 * (50 + (i % 50)) * Math.PI * 0.01 * 100).toFixed(1)}\\,\\text{V}$` },
      { id: 'B', text: `$${(0.1 * (50 + (i % 50)) * Math.PI * 0.01 * 100).toFixed(1)}\\,\\text{V}$` },
      { id: 'C', text: `$${(0.4 * (50 + (i % 50)) * Math.PI * 0.01 * 100).toFixed(1)}\\,\\text{V}$` },
      { id: 'D', text: '$0\\,\\text{V}$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: AC Generator Peak EMF Formula", content: "$\\mathcal{E}_0 = N B A \\omega$ where $A = \\pi r^2 = \\pi (0.1)^2 = 0.01\\pi\\,\\text{m}^2$." },
        { title: "Step 2: Calculation", content: `$\\mathcal{E}_0 = ${50 + (i % 50)} \\times 0.2 \\times (0.01\\pi) \\times 100 = ${(0.2 * (50 + (i % 50)) * Math.PI * 0.01 * 100).toFixed(1)}\\,\\text{V}$.` }
      ],
      finalAnswer: 'A',
      keyConcepts: ["Faraday's Law", "AC Generator Principle"]
    }
  }),
  (i, year, chapter) => ({
    topic: "Modern Physics & Dual Nature",
    questionText: `The de Broglie wavelength of an electron accelerated from rest through a potential difference of $V = 100\\,\\text{V}$ is approximately:`,
    options: [
      { id: 'A', text: '$1.227\\,\\text{\\AA}$' },
      { id: 'B', text: '$0.123\\,\\text{\\AA}$' },
      { id: 'C', text: '$12.27\\,\\text{\\AA}$' },
      { id: 'D', text: '$0.542\\,\\text{\\AA}$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: de Broglie Wavelength of Electron", content: "$\\lambda = \\frac{h}{\\sqrt{2m_e q V}} = \\frac{12.27}{\\sqrt{V}}\\,\\text{\\AA}$." },
        { title: "Step 2: Substitute $V = 100\\,\\text{V}$", content: "$\\lambda = \\frac{12.27}{\\sqrt{100}} = \\frac{12.27}{10} = 1.227\\,\\text{\\AA}$." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["de Broglie Wavelength", "Matter Waves"]
    }
  })
];

const chemGenerators = [
  (i, year, chapter) => ({
    topic: "Chemical Kinetics",
    questionText: `For a first order chemical reaction, the time required to complete $99.9\\%$ of the reaction is approximately related to half-life $t_{1/2}$ by:`,
    options: [
      { id: 'A', text: '$t_{99.9\\%} = 10 \\, t_{1/2}$' },
      { id: 'B', text: '$t_{99.9\\%} = 5 \\, t_{1/2}$' },
      { id: 'C', text: '$t_{99.9\\%} = 20 \\, t_{1/2}$' },
      { id: 'D', text: '$t_{99.9\\%} = 3.32 \\, t_{1/2}$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: Integrated Rate Equation", content: "$t = \\frac{2.303}{k} \\log\\left(\\frac{[A]_0}{[A]_t}\\right)$." },
        { title: "Step 2: At $99.9\\%$ Completion", content: "$[A]_t = [A]_0 - 0.999[A]_0 = 0.001[A]_0 = 10^{-3}[A]_0$. So $\\log(10^3) = 3$. Hence $t_{99.9\\%} = \\frac{2.303 \\times 3}{k} = \\frac{6.909}{k} = 10 \\times \\frac{0.693}{k} = 10 \\, t_{1/2}$." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["First Order Kinetics", "Half Life Relationship"]
    }
  }),
  (i, year, chapter) => ({
    topic: "Coordination Chemistry",
    questionText: `According to Crystal Field Theory, the hybridization and magnetic behavior of $[\\text{Ni}(\\text{CN})_4]^{2-}$ are respectively: (Atomic number of $\\text{Ni} = 28$)`,
    options: [
      { id: 'A', text: '$dsp^2$ and diamagnetic' },
      { id: 'B', text: '$sp^3$ and paramagnetic' },
      { id: 'C', text: '$sp^3$ and diamagnetic' },
      { id: 'D', text: '$dsp^2$ and paramagnetic' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: Oxidation State and Configuration", content: "$\\text{Ni}^{2+}$ has configuration $3d^8 4s^0$." },
        { title: "Step 2: Strong Field Ligand Pairing", content: "$\\text{CN}^-$ is a strong field ligand (carbon donor). It causes pairing of the 8 electrons in four $3d$ orbitals, leaving one inner $3d$ orbital vacant." },
        { title: "Step 3: Geometry & Hybridization", content: "The empty $3d, 4s,$ and two $4p$ orbitals hybridize into square planar $dsp^2$. All electrons are paired $\\implies$ diamagnetic." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["Crystal Field Theory", "Square Planar Hybridization", "Spectrochemical Series"]
    }
  }),
  (i, year, chapter) => ({
    topic: "Thermodynamics",
    questionText: `For the reaction $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)$, $\\Delta H = -92.4\\,\\text{kJ}$. The value of $\\Delta n_g$ for this reaction is:`,
    options: [
      { id: 'A', text: '$-2$' },
      { id: 'B', text: '$+2$' },
      { id: 'C', text: '$-1$' },
      { id: 'D', text: '$0$' }
    ],
    correctAnswer: 'A',
    solution: {
      steps: [
        { title: "Step 1: Formula for $\\Delta n_g$", content: "$\\Delta n_g = \\sum n_{\\text{gaseous products}} - \\sum n_{\\text{gaseous reactants}}$." },
        { title: "Step 2: Calculation", content: "$\\Delta n_g = 2 - (1 + 3) = 2 - 4 = -2$." }
      ],
      finalAnswer: 'A',
      keyConcepts: ["Relation $\\Delta H = \\Delta U + \\Delta n_g RT$", "Gaseous mole changes"]
    }
  })
];

function buildPack(subject, chapters, generators, count) {
  const years = [];
  for (let y = 2002; y <= 2026; y++) years.push(y);

  const examTypes = ['JEE Main', 'JEE Advanced'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const types = ['single_choice', 'single_choice', 'multi_correct', 'numerical'];

  const questions = [];

  for (let i = 0; i < count; i++) {
    const year = years[i % years.length];
    const chapter = chapters[i % chapters.length];
    const gen = generators[i % generators.length];
    const generated = gen(i, year, chapter);
    const examType = i % 4 === 3 ? 'JEE Advanced' : 'JEE Main';
    const diff = difficulties[i % difficulties.length];
    const qType = types[i % types.length];
    const session = (i % 2 === 0) ? `${year} Jan Shift 1` : `${year} Apr Shift 2`;

    questions.push({
      id: `${subject.slice(0, 3)}-${year}-${String(i + 1).padStart(4, '0')}`,
      subject,
      chapter,
      year,
      examType,
      type: qType,
      difficulty: diff,
      session,
      questionText: generated.questionText,
      options: generated.options,
      correctAnswer: qType === 'multi_correct' ? ['A', 'C'] : generated.correctAnswer,
      solution: generated.solution,
      stats: {
        totalAttempts: 1200 + (i * 43) % 4500,
        accuracy: 48 + (i * 11) % 45,
        timeSpentSeconds: 65 + (i * 5) % 110
      }
    });
  }

  return questions;
}

console.log('Generating Mathematics PYQs...');
const maths = buildPack('maths', mathsChapters, mathGenerators, 500);
fs.writeFileSync(path.join(dataDir, 'maths_pyqs.json'), JSON.stringify(maths));

console.log('Generating Physics PYQs...');
const physics = buildPack('physics', physicsChapters, physicsGenerators, 500);
fs.writeFileSync(path.join(dataDir, 'physics_pyqs.json'), JSON.stringify(physics));

console.log('Generating Chemistry PYQs...');
const chemistry = buildPack('chemistry', chemistryChapters, chemGenerators, 500);
fs.writeFileSync(path.join(dataDir, 'chemistry_pyqs.json'), JSON.stringify(chemistry));

console.log(`Successfully generated 1500 starter PYQs across 2002-2026 into /public/data/`);
