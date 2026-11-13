/**
 * Curated Multi-Domain Academic Training & Evaluation Corpus
 *
 * Clearly documented seed benchmark datasets used to train, validate, and evaluate
 * ResearchScholar AI's in-house custom statistical NLP and ranking models:
 *  1. DOMAIN_DATASET: 108 labeled multi-sentence paper abstracts across 9 academic disciplines.
 *  2. RANKING_BENCHMARK: Query-paper relevance triplets for Learning-to-Rank calibration.
 *  3. SENTENCE_ROLE_DATASET: 120 labeled scholarly sentences across 6 extraction roles.
 */

export const DOMAIN_LABELS = [
  'Computer Science / Artificial Intelligence',
  'Biomedicine & Health Sciences',
  'Physics & Astronomy',
  'Materials Science & Chemistry',
  'Environmental & Climate Sciences',
  'Mathematics & Statistics',
  'Economics & Quantitative Finance',
  'Social & Cognitive Sciences',
  'Engineering & Robotics'
];

export const DOMAIN_DATASET = [
  // Computer Science / Artificial Intelligence (12)
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Sparse multi-head self-attention for long-context transformer language models reduces quadratic GPU memory complexity during autoregressive token generation and neural pre-training. Benchmarks across reasoning and coding tasks confirm fast inference latency.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Federated learning with differential privacy preserves training gradient confidentiality across decentralized neural network nodes under non-IID data partitions. Experimental evaluation on distributed edge clients demonstrates high classification accuracy.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Graph neural networks using message passing layers improve node classification and link prediction accuracy on large heterogeneous knowledge graphs. We benchmark deep learning architectures on multi-relational citation networks.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Vision transformers and convolutional neural network object detectors evaluated on ImageNet and COCO computer vision benchmarks demonstrate improved semantic segmentation precision and real-time GPU throughput.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Retrieval-augmented generation pairs dense vector embedding index lookup with transformer neural architectures for factual open-domain question answering and natural language processing.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Deep reinforcement learning with proximal policy optimization stabilizes continuous multi-agent policy gradient convergence in simulated software environments and sequential decision-making benchmarks.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Quantization-aware training compresses billion-parameter neural language models to 4-bit integer weights with minimal perplexity degradation on GLUE natural language understanding benchmarks.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Byzantine-resilient distributed stochastic gradient descent detects adversarial worker updates during asynchronous deep neural network optimization across GPU clusters.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Automated software vulnerability detection combines abstract syntax tree embeddings with self-supervised transformer encoders trained on source code repositories to flag buffer overflows and injection bugs.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Contrastive self-supervised representation learning aligns multimodal image-text embeddings without manual labels, improving zero-shot neural retrieval and downstream visual classification accuracy.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Zero-knowledge cryptographic compiler verification proves memory safety and deterministic execution invariants for distributed cloud microservices and database query engines.'
  },
  {
    domain: 'Computer Science / Artificial Intelligence',
    text: 'Mixture-of-experts sparse routing scales large language model parameter capacity while keeping per-token floating-point computation constant during distributed GPU training and inference.'
  },

  // Biomedicine & Health Sciences (12)
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'CRISPR-Cas9 gene editing targeting oncogenic mutations reduces off-target DNA cleavage in primary human T-cell oncology assays and xenograft tumor mouse models, improving therapeutic clinical safety.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Randomized controlled clinical trial evaluating mRNA vaccine neutralizing antibody titers, T-cell immune responses, and adverse events across elderly patient hospital cohorts.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Single-cell RNA sequencing reveals macrophage heterogeneity within the hepatocellular carcinoma tumor microenvironment and uncovers immunotherapy checkpoint resistance pathways in patient biopsies.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Whole-exome genomic profiling identifies pathogenic BRCA1 biomarkers predictive of PARP inhibitor chemotherapy survival and clinical prognosis in ovarian cancer patients.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Cardiovascular MRI biomarker quantification detects subclinical myocardial fibrosis and left ventricular diastolic dysfunction in hypertensive diabetes patient cohorts.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Gut microbiome dysbiosis modulates mucosal inflammatory cytokine secretion and metabolic insulin resistance in longitudinal clinical cohort colon biopsies.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Antimicrobial resistance genomic surveillance of carbapenemase-producing Klebsiella pneumoniae bacterial isolates from intensive care hospital wards tracks nosocomial infection outbreaks.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Monoclonal antibody pharmacokinetics and blood-brain barrier receptor transcytosis attenuate amyloid plaque pathology and neuroinflammation in Alzheimer transgenic mouse models.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Liquid biopsy circulating tumor DNA sequencing enables non-invasive early-stage colorectal cancer relapse screening and longitudinal chemotherapy treatment monitoring in oncology clinics.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Induced pluripotent stem cell cardiomyocyte organoids recapitulate inherited arrhythmia electrophysiology for high-throughput pharmacological drug toxicity screening.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Proteomic mass spectrometry profiling of cerebrospinal fluid biomarkers distinguishes Parkinson neurodegenerative progression from atypical movement disorders in multicenter patient cohorts.'
  },
  {
    domain: 'Biomedicine & Health Sciences',
    text: 'Adjuvant radiation therapy combined with PD-1 immune checkpoint blockade improves disease-free survival and tumor regression in locally advanced head and neck squamous cell carcinoma patients.'
  },

  // Physics & Astronomy (12)
  {
    domain: 'Physics & Astronomy',
    text: 'Quantum entanglement entropy and topological phase transitions measured across superconducting qubit spin chains in cryogenic dilution refrigerators reveal non-abelian quasiparticle braiding signatures.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Gravitational wave interferometer laser strain spectroscopy constrains binary neutron star merger tidal deformability and relativistic nuclear equations of state.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Exoplanet atmospheric transmission spectroscopy detected water vapor, carbon dioxide, and methane absorption lines using infrared space telescope astrophysical observations.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Magnetohydrodynamic simulations of relativistic accretion disk jets around supermassive black holes explain non-thermal gamma-ray synchrotron flares in active galactic nuclei.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Bose-Einstein condensation in ultracold rubidium optical lattices probes strongly correlated Hubbard quantum many-body dynamics and superfluid-insulator phase transitions.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'High-energy proton-proton collider calorimeter reconstruction searches for supersymmetric dark matter particle candidates and anomalous Higgs boson decays beyond the Standard Model.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Tokamak plasma magnetic confinement suppresses edge-localized instabilities via resonant magnetic perturbation coils in deuterium-tritium fusion reactor experiments.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Precision optical lattice atomic clock interferometry tests Lorentz invariance and constrains cosmic temporal drift in the electromagnetic fine-structure constant.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Cosmic microwave background polarization anisotropy measurements constrain primordial inflationary gravitational waves, neutrino masses, and cold dark matter cosmological parameters.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Angle-resolved photoemission spectroscopy uncovers unconventional d-wave superconducting energy gaps and Dirac fermion surface states in layered topological quantum crystals.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Fast radio burst dispersion measure observations localize extragalactic magnetar progenitors and trace ionized baryon density across the intergalactic medium.'
  },
  {
    domain: 'Physics & Astronomy',
    text: 'Ultrafast attosecond laser pulse pump-probe spectroscopy resolves sub-femtosecond electron tunneling and coherent quantum wavepacket dynamics in noble gas atoms.'
  },

  // Materials Science & Chemistry (12)
  {
    domain: 'Materials Science & Chemistry',
    text: 'Halide perovskite solar cell surface passivation layers suppress non-radiative defect recombination at grain boundaries and boost photovoltaic power conversion efficiency and thermal stability.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Solid-state lithium-ion battery garnet ceramic electrolytes inhibit lithium dendrite nucleation during high-rate electrochemical galvanostatic charge-discharge cycling.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Density functional theory electrocatalysis modeling optimizes platinum-cobalt nanoparticle surface adsorption free energy for fuel-cell oxygen reduction chemical reactions.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Metal-organic framework porous crystalline adsorbents synthesized via solvothermal crystallization achieve high selective carbon dioxide gas capture capacity and regeneration stability.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Synchrotron X-ray diffraction and transmission electron microscopy characterize dislocation slip planes and grain-boundary precipitation in high-entropy alloys under tensile stress.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Biodegradable polylactic acid polymer nanocomposites reinforced with surface-grafted cellulose nanocrystals exhibit enhanced tensile modulus, crystallinity, and thermal barrier stability.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Photocatalytic water splitting over bismuth vanadate semiconductor heterostructures increases solar hydrogen evolution quantum yield under visible light irradiation.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Asymmetric organocatalytic aldol condensation chemical reactions yield chiral beta-hydroxy ketones with high enantiomeric excess and catalytic turnover in green organic solvents.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Two-dimensional transition metal dichalcogenide monolayers synthesized via chemical vapor deposition exhibit tunable excitonic photoluminescence and low-resistance electrical contacts.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Electrochemical carbon dioxide reduction over copper single-atom nanocatalysts achieves high Faradaic selectivity toward multi-carbon ethylene products in alkaline flow electrolyzers.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Click-chemistry covalent crosslinking yields self-healing polyurethane elastomers with reversible hydrogen bonding networks and high fracture toughness after mechanical damage.'
  },
  {
    domain: 'Materials Science & Chemistry',
    text: 'Nuclear magnetic resonance spectroscopy and molecular dynamics simulations elucidate ionic liquid solvation shells and high-voltage electrochemical electrolyte decomposition pathways.'
  },

  // Environmental & Climate Sciences (12)
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Coupled ocean-atmosphere climate model projections quantify Arctic sea-ice albedo feedback and permafrost greenhouse carbon emission sensitivity under global warming scenarios.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Satellite remote sensing soil moisture anomalies track agricultural drought severity, vegetation stress, and land-surface evapotranspiration fluxes across semi-arid river watersheds.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Marine phytoplankton primary productivity and ocean acidification pH shifts disrupt tropical coral reef calcification and pelagic food webs along continental shelves.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Tropical rainforest biodiversity loss and forest habitat fragmentation alter avian pollination networks and reduce aboveground terrestrial biomass carbon sequestration.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Hydrological watershed runoff modeling assesses Himalayan glacial meltwater contribution and downstream flood hazard under extreme monsoon precipitation variability.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Atmospheric PM2.5 particulate aerosol chemical source apportionment evaluates urban air pollution exposure, visibility impairment, and tropospheric ozone formation.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Saltmarsh blue-carbon coastal wetland restoration enhances storm-surge wave attenuation and long-term organic sediment carbon burial accretion rates.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Microplastic trophic bioaccumulation in freshwater riverine ecosystems alters benthic macroinvertebrate biodiversity richness and degraded surface water quality.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Boreal wildfire smoke plumes inject black carbon aerosols into the lower stratosphere, altering regional radiative forcing and summer precipitation anomalies.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Groundwater aquifer depletion monitoring via satellite gravimetry quantifies unsustainable irrigation extraction and seasonal hydrological drought recovery across alluvial basins.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Constructed biochar soil amendments reduce nitrous oxide greenhouse emissions from fertilized agricultural croplands while improving watershed nitrate retention.'
  },
  {
    domain: 'Environmental & Climate Sciences',
    text: 'Species distribution modeling projects alpine plant range contractions and phenological mismatch under 21st-century mountain climate warming trajectories.'
  },

  // Mathematics & Statistics (12)
  {
    domain: 'Mathematics & Statistics',
    text: 'Bayesian hierarchical Markov chain Monte Carlo posterior inference establishes minimax convergence rates and posterior contraction bounds for high-dimensional sparse regression.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Stochastic partial differential equations driven by fractional Brownian noise admit unique mild solutions and regularity estimates on bounded Sobolev manifolds.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Spectral graph theory Laplacian eigenvalues bound mixing times and Cheeger isoperimetric constants of reversible random walks on expander polytope graphs.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Conformal prediction distribution-free hypothesis testing guarantees finite-sample statistical coverage bounds and minimax risk control under exchangeable covariate shift.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Convex optimization primal-dual interior-point algorithms prove superlinear convergence rates and duality gap bounds for semidefinite matrix completion.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Algebraic topology persistent homology characterizes Betti number stability invariants and bottleneck distance bounds across metric simplicial filtrations.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Asymptotic central limit theorems for dependent stationary martingale differences establish uniform Berry-Esseen normal approximation convergence bounds.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Analytic number theory sieve methods establish prime gap distribution moments and Dirichlet character sum estimates along arithmetic progressions.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Nonparametric kernel density estimation minimax theorems characterize optimal bandwidth selection and pointwise asymptotic variance under heavy-tailed probability distributions.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Riemannian geometry Ricci flow monotonicity formulas prove compactness and curvature pinching bounds on compact three-dimensional smooth manifolds.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Random matrix theory universality proves Tracy-Widom spectral edge fluctuations and Marchenko-Pastur empirical eigenvalue convergence for large sample covariance matrices.'
  },
  {
    domain: 'Mathematics & Statistics',
    text: 'Optimal transport Wasserstein barycenter duality establishes existence, uniqueness, and stability inequalities for probability measures on compact metric spaces.'
  },

  // Economics & Quantitative Finance (12)
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Monetary policy central bank interest-rate shocks transmitted through household mortgage balance sheets dampen aggregate inflation and consumer expenditure.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Difference-in-differences causal panel econometrics evaluates minimum wage employment elasticity and household income distribution across regional labor markets.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Stochastic volatility option pricing calibration captures implied volatility skew surface dynamics and tail risk hedging premiums in derivative equity markets.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Central bank digital currency liquidity competition alters commercial bank deposit funding spreads, credit supply, and systemic interbank contagion risk.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Sovereign bond yield curve macroeconomic forecasting incorporates fiscal deficit risk premia, inflation expectations, and international trade tariff shocks.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Algorithmic market microstructure limit order-book liquidity imbalance predicts short-horizon bid-ask spread volatility and institutional trade execution slippage.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Carbon pricing cap-and-trade emissions auction mechanisms incentivize industrial decarbonization investment and marginal abatement cost equalization across firms.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Mean-variance portfolio optimization with shrinkage covariance estimators lowers out-of-sample downside drawdown and improves Sharpe ratios during financial crises.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Instrumental variable structural econometrics estimates firm productivity spillovers from foreign direct investment and global supply chain tariff liberalization.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Macroprudential bank capital adequacy stress testing evaluates mortgage default correlation and fire-sale asset contagion across systemic financial institutions.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'Dynamic stochastic general equilibrium business cycle models analyze fiscal stimulus multipliers when nominal policy interest rates hit the zero lower bound.'
  },
  {
    domain: 'Economics & Quantitative Finance',
    text: 'High-frequency econometric realized volatility jump tests decompose intraday equity return variance into continuous diffusion and macroeconomic announcement shocks.'
  },

  // Social & Cognitive Sciences (12)
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Functional neuroimaging working memory experiments demonstrate prefrontal cortex oscillatory coupling during human executive cognitive control and attention switching tasks.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Longitudinal social psychology survey analysis measures online news feed polarization, partisan attitude change, and civic institutional trust erosion.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Developmental psycholinguistics eye-tracking paradigms assess bilingual phonological awareness and reading comprehension acquisition in early childhood classrooms.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Behavioral decision theory framing biases influence intertemporal discounting and risk aversion under uncertain public policy and household choices.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Sociological network ethnography examines urban housing segregation, neighborhood social capital cohesion, and intergenerational educational mobility.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Electroencephalography event-related potentials index attentional blink suppression, semantic priming, and visual consciousness perceptual thresholds in human participants.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Cross-cultural moral judgment experimental vignettes evaluate prosocial cooperation norms, fairness heuristics, and altruistic punishment across diverse societies.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Educational psychology randomized classroom interventions test spaced retrieval practice effects on student metacognitive retention calibration and exam recall.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Cognitive aging longitudinal cohort assessments evaluate episodic memory decline, processing speed, and bilingual cognitive reserve in older adults.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Experimental political sociology survey experiments investigate how deliberative civic assemblies reduce affective polarization and increase policy compromise.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Visual psychophysics reaction-time modeling characterizes multisensory audiovisual temporal binding windows during speech perception under background noise.'
  },
  {
    domain: 'Social & Cognitive Sciences',
    text: 'Organizational psychology field surveys examine remote workplace autonomy, team psychological safety, and employee occupational burnout recovery.'
  },

  // Engineering & Robotics (12)
  {
    domain: 'Engineering & Robotics',
    text: 'Model predictive control and nonlinear LiDAR SLAM enable agile autonomous quadrotor obstacle avoidance and trajectory tracking in GPS-denied subterranean tunnels.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Soft pneumatic robotic grippers integrated with tactile piezoresistive sensor arrays perform compliant fragile object manipulation and closed-loop force control.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Finite element structural fatigue analysis of wind turbine composite rotor blades predicts cyclic ply delamination under turbulent aerodynamic mechanical loads.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Inverse kinematics whole-body impedance control stabilizes bipedal humanoid robot locomotion over uneven compliant terrain with joint force-torque actuator feedback.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Power electronics silicon carbide inverter pulse-width modulation minimizes harmonic switching losses and thermal stress in electric vehicle traction motor drives.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Computational fluid dynamics hypersonic boundary-layer regenerative cooling channels reduce peak thermal stress on aerospace rocket propulsion nozzles.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Swarm robotics decentralized consensus formation controllers maintain collision-free multi-robot connectivity under noisy millimeter-wave radar ranging.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Microelectromechanical gyroscope Kalman filter sensor fusion eliminates inertial attitude drift in compact surgical robotic navigation instruments.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Adaptive PID and sliding-mode servo actuator control suppresses elastic joint vibration in six-degree-of-freedom industrial robotic assembly manipulators.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Ultrasonic phased-array non-destructive structural inspection detects subsurface weld cracks in offshore steel bridge girders and pressure vessels.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Autonomous underwater vehicle acoustic Doppler navigation and thruster fault-tolerant control stabilize seabed pipeline inspection trajectories in strong ocean currents.'
  },
  {
    domain: 'Engineering & Robotics',
    text: 'Additive laser powder-bed fusion manufacturing process monitoring correlates melt-pool thermal imaging with fatigue porosity in titanium aerospace brackets.'
  }
];

/**
 * Query-paper relevance benchmark pairs for Learning-to-Rank calibration and evaluation.
 * Grouped by query_id with ground-truth binary relevance (1 = relevant, 0 = off-topic/weak).
 */
export const RANKING_BENCHMARK = [
  {
    query_id: 'q1',
    topic: 'federated learning differential privacy medical imaging',
    question: 'How does differential privacy affect non-IID medical imaging clients?',
    keywords: ['federated learning', 'privacy', 'medical imaging'],
    candidates: [
      {
        paper_id: 'r1-1',
        title: 'Privacy-Preserving Federated Learning for Multi-Center Medical Imaging Diagnostics',
        abstract: 'We evaluate differential privacy budgets across decentralized hospital radiology clients with heterogeneous non-IID MRI scans and measure Dice accuracy.',
        keywords: ['federated learning', 'differential privacy', 'medical imaging'],
        year: 2024,
        citation_count: 145,
        relevance: 1
      },
      {
        paper_id: 'r1-2',
        title: 'Adaptive Gradient Clipping in Differentially Private Federated MRI Segmentation',
        abstract: 'Differential privacy noise degrades segmentation convergence under cross-silo clinical imbalance; adaptive clipping restores diagnostic robustness.',
        keywords: ['differential privacy', 'federated learning', 'MRI'],
        year: 2025,
        citation_count: 38,
        relevance: 1
      },
      {
        paper_id: 'r1-3',
        title: 'General Distributed Training Algorithms for Edge Devices',
        abstract: 'Decentralized SGD communication compression speeds up IoT sensor aggregation without privacy budgets or medical benchmarks.',
        keywords: ['edge computing', 'sgd'],
        year: 2021,
        citation_count: 85,
        relevance: 0
      },
      {
        paper_id: 'r1-4',
        title: 'Photovoltaic Efficiency of Perovskite Tandem Cells',
        abstract: 'Interface passivation increases solar cell open-circuit voltage over 1000 hours of thermal aging.',
        keywords: ['solar cell', 'perovskite'],
        year: 2025,
        citation_count: 210,
        relevance: 0
      }
    ]
  },
  {
    query_id: 'q2',
    topic: 'linear attention long context transformer',
    question: 'How do linear attention mechanisms scale sequence memory?',
    keywords: ['linear attention', 'transformer', 'long context'],
    candidates: [
      {
        paper_id: 'r2-1',
        title: 'Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention',
        abstract: 'Kernel feature maps rewrite self-attention to achieve O(N) linear time and memory complexity for long context autoregressive sequences.',
        keywords: ['linear attention', 'transformer', 'memory complexity'],
        year: 2023,
        citation_count: 1200,
        relevance: 1
      },
      {
        paper_id: 'r2-2',
        title: 'FlashLinearAttention: IO-Aware Hardware Kernels for Sub-Quadratic Context Scaling',
        abstract: 'Hardware-efficient linear attention kernels scale long context language models beyond 128k tokens with minimal perplexity loss.',
        keywords: ['linear attention', 'long context', 'transformer'],
        year: 2025,
        citation_count: 64,
        relevance: 1
      },
      {
        paper_id: 'r2-3',
        title: 'A Historical Review of Feedforward Perceptrons in Pattern Recognition',
        abstract: 'Early multilayer perceptrons solved small tabular classification benchmarks before recurrent sequence networks emerged.',
        keywords: ['perceptron', 'tabular'],
        year: 2016,
        citation_count: 300,
        relevance: 0
      },
      {
        paper_id: 'r2-4',
        title: 'Soil Carbon Turnover Under Tropical Agroforestry Systems',
        abstract: 'Field measurements across tropical farms track organic carbon storage and microbial respiration.',
        keywords: ['soil carbon', 'agroforestry'],
        year: 2024,
        citation_count: 18,
        relevance: 0
      }
    ]
  },
  {
    query_id: 'q3',
    topic: 'crispr off-target cleavage gene editing',
    question: 'How can high-fidelity Cas9 variants minimize off-target DNA breaks?',
    keywords: ['crispr', 'cas9', 'off-target'],
    candidates: [
      {
        paper_id: 'r3-1',
        title: 'Engineered High-Fidelity Cas9 Nucleases Eliminate Genome-Wide Off-Target Cleavage',
        abstract: 'We benchmark CRISPR-Cas9 variants using GUIDE-seq and demonstrate >95% reduction in off-target cleavage across primary human T cells.',
        keywords: ['crispr', 'cas9', 'off-target cleavage'],
        year: 2024,
        citation_count: 290,
        relevance: 1
      },
      {
        paper_id: 'r3-2',
        title: 'Prime Editing and Base Editors Reduce Double-Strand Off-Target Risks in Therapeutic Editing',
        abstract: 'Comparative analysis of CRISPR prime editing specificity and chromosomal translocation rates relative to wild-type Cas9.',
        keywords: ['crispr', 'gene editing', 'off-target'],
        year: 2025,
        citation_count: 72,
        relevance: 1
      },
      {
        paper_id: 'r3-3',
        title: 'Automated Fluorescence Microscopy Segmentation of Yeast Nuclei',
        abstract: 'Image thresholding software counts yeast cell budding cycles without genomic editing or Cas9 assays.',
        keywords: ['microscopy', 'yeast'],
        year: 2020,
        citation_count: 42,
        relevance: 0
      },
      {
        paper_id: 'r3-4',
        title: 'Monetary Policy Shocks and Sovereign Debt Spreads',
        abstract: 'Panel econometrics measures central bank bond yield reactions across emerging economies.',
        keywords: ['monetary policy', 'bonds'],
        year: 2025,
        citation_count: 12,
        relevance: 0
      }
    ]
  },
  {
    query_id: 'q4',
    topic: 'solid state lithium battery dendrite electrolyte',
    question: 'What ceramic electrolytes suppress lithium dendrite penetration?',
    keywords: ['solid-state battery', 'lithium', 'dendrite', 'electrolyte'],
    candidates: [
      {
        paper_id: 'r4-1',
        title: 'Suppressing Lithium Dendrite Propagation in Garnet Ceramic Solid-State Electrolytes',
        abstract: 'Interface grain-boundary engineering prevents lithium dendrite penetration in solid-state batteries above 2 mA/cm2 critical current density.',
        keywords: ['solid-state battery', 'dendrite', 'ceramic electrolyte'],
        year: 2024,
        citation_count: 175,
        relevance: 1
      },
      {
        paper_id: 'r4-2',
        title: 'Sulfide vs Oxide Solid Electrolytes: Interfacial Resistance and Lithium Plating Mechanics',
        abstract: 'Cryo-EM reveals how chemo-mechanical stack pressure governs lithium dendrite growth in all-solid-state cells.',
        keywords: ['solid electrolyte', 'lithium dendrite', 'battery'],
        year: 2025,
        citation_count: 55,
        relevance: 1
      },
      {
        paper_id: 'r4-3',
        title: 'Thermal Management of Electric Vehicle Liquid Cooling Plates',
        abstract: 'CFD channel geometry optimization reduces aluminum cold-plate pressure drop during fast charging.',
        keywords: ['cooling', 'cfd'],
        year: 2022,
        citation_count: 34,
        relevance: 0
      },
      {
        paper_id: 'r4-4',
        title: 'Bilingual Phonological Awareness in Primary Education',
        abstract: 'Classroom longitudinal reading comprehension assessments measure vocabulary retention.',
        keywords: ['education', 'phonology'],
        year: 2024,
        citation_count: 9,
        relevance: 0
      }
    ]
  },
  {
    query_id: 'q5',
    topic: 'autonomous quadrotor obstacle avoidance slam robotics',
    question: 'How does LiDAR SLAM support agile drone navigation in GPS-denied tunnels?',
    keywords: ['quadrotor', 'slam', 'obstacle avoidance', 'robotics'],
    candidates: [
      {
        paper_id: 'r5-1',
        title: 'High-Speed Autonomous Quadrotor Flight in Subterranean Tunnels via LiDAR-Inertial SLAM',
        abstract: 'Tightly coupled LiDAR-inertial odometry and model predictive control enable collision-free obstacle avoidance at 12 m/s without GPS.',
        keywords: ['quadrotor', 'slam', 'obstacle avoidance'],
        year: 2024,
        citation_count: 112,
        relevance: 1
      },
      {
        paper_id: 'r5-2',
        title: 'Reactive Potential Fields for Micro Aerial Vehicle Corridor Navigation',
        abstract: 'Onboard depth-camera SLAM generates real-time trajectory replanning in cluttered indoor robotics environments.',
        keywords: ['aerial vehicle', 'slam', 'robotics'],
        year: 2023,
        citation_count: 68,
        relevance: 1
      },
      {
        paper_id: 'r5-3',
        title: 'Finite Element Modal Analysis of Fixed-Wing Carbon Spar Wingtips',
        abstract: 'Static wing loading simulations determine composite ply delamination thresholds in wind tunnel tests.',
        keywords: ['aerospace', 'composites'],
        year: 2021,
        citation_count: 27,
        relevance: 0
      },
      {
        paper_id: 'r5-4',
        title: 'Ocean Acidification Impacts on Tropical Coral Larvae',
        abstract: 'Mesocosm pH elevation experiments track skeletal calcification rates over six weeks.',
        keywords: ['coral', 'ocean acidification'],
        year: 2025,
        citation_count: 31,
        relevance: 0
      }
    ]
  }
];

/**
 * Curated sentence role classification dataset (90 sentences across 6 extraction roles:
 * objective, problem_statement, methodology, results, limitations, future_work).
 */
export const SENTENCE_ROLE_LABELS = [
  'objective',
  'problem_statement',
  'methodology',
  'results',
  'limitations',
  'future_work'
];

export const SENTENCE_ROLE_DATASET = [
  // objective (20)
  { role: 'objective', text: 'In this paper, we aim to design a privacy-preserving federated optimization framework for clinical MRI classification.' },
  { role: 'objective', text: 'Our primary objective is to develop an IO-aware linear attention kernel capable of scaling to 128k context lengths.' },
  { role: 'objective', text: 'We investigate whether conformal prediction intervals maintain calibrated coverage under covariate shift in healthcare cohorts.' },
  { role: 'objective', text: 'The goal of this study is to evaluate high-fidelity Cas9 nucleases for minimizing genome-wide off-target DNA breaks.' },
  { role: 'objective', text: 'This work proposes a hybrid ceramic-polymer electrolyte tailored to suppress lithium dendrite propagation.' },
  { role: 'objective', text: 'To address these challenges, we introduce a sparse graph message-passing architecture for molecular property prediction.' },
  { role: 'objective', text: 'We seek to characterize how ocean-atmosphere warming alters regional monsoon precipitation extremes.' },
  { role: 'objective', text: 'The objective of this article is to formulate a primal-dual solver with provable linear convergence for semidefinite programs.' },
  { role: 'objective', text: 'In this study, we examine the causal effect of central bank rate hikes on household mortgage consumption.' },
  { role: 'objective', text: 'We present a compliant tactile robotic gripper designed for fragile agricultural harvesting without bruising.' },
  { role: 'objective', text: 'Here we establish an empirical benchmark comparing five attention approximations on long-document summarization.' },
  { role: 'objective', text: 'This research develops an interpretable biomarker panel to stratify early-stage pancreatic cancer patients.' },
  { role: 'objective', text: 'Our purpose is to quantify the trade-off between compression ratio and perplexity across quantized foundation models.' },
  { role: 'objective', text: 'We construct a decentralized swarm consensus controller for GPS-denied underground tunnel exploration.' },
  { role: 'objective', text: 'The focus of this paper is to build an accurate solar irradiance forecasting pipeline from geostationary satellite imagery.' },
  { role: 'objective', text: 'This paper aims to bridge single-cell spatial transcriptomics with histopathological tissue morphology.' },
  { role: 'objective', text: 'We set out to analyze how soil biochar amendments affect agricultural nitrous oxide fluxes over multiple growing seasons.' },
  { role: 'objective', text: 'Our goal is to design a non-intrusive acoustic monitoring system for offshore steel bridge fatigue cracks.' },
  { role: 'objective', text: 'We systematically evaluate whether shrinkage covariance estimators stabilize out-of-sample portfolio drawdowns.' },
  { role: 'objective', text: 'The main objective is to verify finite-sample error bounds for sparse high-dimensional Bayesian regression.' },

  // problem_statement (20)
  { role: 'problem_statement', text: 'Standard softmax self-attention incurs quadratic O(N^2) memory and time bottlenecks as sequence length grows.' },
  { role: 'problem_statement', text: 'However, centralized medical data pooling remains legally prohibited due to strict patient privacy regulations.' },
  { role: 'problem_statement', text: 'Existing solid-state batteries suffer from rapid lithium dendrite short-circuiting above moderate current densities.' },
  { role: 'problem_statement', text: 'A major challenge in automated diagnostics is severe performance degradation under out-of-distribution scanner shift.' },
  { role: 'problem_statement', text: 'Current off-the-shelf nucleases induce unwanted off-target cleavage events that hinder safe clinical gene therapy.' },
  { role: 'problem_statement', text: 'Conventional Kalman filters diverge rapidly when LiDAR point clouds become featureless inside smoke-filled tunnels.' },
  { role: 'problem_statement', text: 'Despite recent progress, calibrating climate models across sparse Arctic observation stations remains unresolved.' },
  { role: 'problem_statement', text: 'High annotation costs create acute label scarcity for rare histopathological tumor subtypes.' },
  { role: 'problem_statement', text: 'Existing macroeconomic forecasting models fail to capture structural regime breaks during liquidity crises.' },
  { role: 'problem_statement', text: 'Non-radiative defect recombination at perovskite grain boundaries limits commercial photovoltaic longevity.' },
  { role: 'problem_statement', text: 'The computational overhead of MCMC sampling becomes prohibitive when parameter dimensionality exceeds ten thousand.' },
  { role: 'problem_statement', text: 'Over-smoothing across deep graph convolutional layers degrades node discrimination on heterophilic networks.' },
  { role: 'problem_statement', text: 'Prior robotic manipulation controllers struggle with unmodeled deformable friction during contact transitions.' },
  { role: 'problem_statement', text: 'Unverified generative summaries frequently hallucinate unsupported clinical statistics not grounded in source texts.' },
  { role: 'problem_statement', text: 'Inconsistent benchmark train-test splits prevent fair empirical comparisons across competing anomaly detectors.' },
  { role: 'problem_statement', text: 'Real-world clinical registries often suffer from severe class imbalance and missing longitudinal follow-up measurements.' },
  { role: 'problem_statement', text: 'Existing catalyst screening methods are unable to capture explicit solvent hydrogen-bonding dynamics at electrode interfaces.' },
  { role: 'problem_statement', text: 'Subsurface turbine blade delamination frequently remains undetected until catastrophic structural failure occurs.' },
  { role: 'problem_statement', text: 'Sparse hydrological gauge coverage hampers accurate flash-flood early warning across remote mountain catchments.' },
  { role: 'problem_statement', text: 'A critical bottleneck in edge robotics is high inference latency on power-constrained embedded processors.' },

  // methodology (20)
  { role: 'methodology', text: 'We trained a 12-layer Transformer encoder using AdamW optimizer with cosine learning-rate decay over 100 epochs.' },
  { role: 'methodology', text: 'Our pipeline integrates TF-IDF chunk retrieval with a hierarchical cross-attention pooling module.' },
  { role: 'methodology', text: 'Each hospital node clips local gradient norms and adds Gaussian differential privacy noise before FedAvg aggregation.' },
  { role: 'methodology', text: 'We synthesized garnet ceramic pellets via solid-state sintering at 1150 C and coated them with ultrathin zinc oxide.' },
  { role: 'methodology', text: 'Participants completed a double-blind randomized controlled crossover protocol across three longitudinal clinical visits.' },
  { role: 'methodology', text: 'We formulate the trajectory planner as a constrained nonlinear model predictive control problem solved at 50 Hz.' },
  { role: 'methodology', text: 'Gene-editing specificity was assayed using genome-wide GUIDE-seq sequencing alongside targeted amplicon deep sequencing.' },
  { role: 'methodology', text: 'Using difference-in-differences panel regression with county fixed effects, we estimate employment elasticity.' },
  { role: 'methodology', text: 'Density functional theory calculations employed the PBE exchange-correlation functional with a 500 eV plane-wave cutoff.' },
  { role: 'methodology', text: 'To enforce permutation equivariance, we stack four radial graph message-passing blocks with residual skip connections.' },
  { role: 'methodology', text: 'We applied z-score channel normalization, 5-fold stratified cross-validation, and Benjamini-Hochberg FDR correction.' },
  { role: 'methodology', text: 'Acoustic telemetry sensors sampled benthic currents continuously at 10 Hz across twelve estuarine transects.' },
  { role: 'methodology', text: 'We implemented a primal-dual interior-point algorithm with adaptive step-size line search on sparse matrices.' },
  { role: 'methodology', text: 'Eye-tracking gaze fixations were recorded at 1000 Hz while children read phonetically controlled word pairs.' },
  { role: 'methodology', text: 'We quantized attention projection weights using symmetric per-channel 4-bit scaling without retraining.' },
  { role: 'methodology', text: 'Samples were imaged using cryogenic transmission electron microscopy operated at 300 kV under low-dose mode.' },
  { role: 'methodology', text: 'We calibrated the hydrological model via Markov chain Monte Carlo sampling across 15 years of daily streamflows.' },
  { role: 'methodology', text: 'Tissue biopsies were dissociated enzymatically and profiled with droplet-based single-cell RNA barcoding.' },
  { role: 'methodology', text: 'To isolate causal policy effects, we construct an instrumental variable two-stage least-squares specification.' },
  { role: 'methodology', text: 'Finite element meshes containing 1.2 million tetrahedral elements were simulated under cyclic aerodynamic loading.' },

  // results (20)
  { role: 'results', text: 'Experimental results on ImageNet demonstrate that our architecture achieves 84.6% top-1 accuracy while reducing FLOPs by 32%.' },
  { role: 'results', text: 'The proposed federated model outperforms local baselines by 7.4% AUROC and reaches 0.912 F1 score on test scans.' },
  { role: 'results', text: 'Our solid-state cell retained 91.5% capacity after 500 galvanostatic cycles at 2.5 mA/cm2 without short-circuiting.' },
  { role: 'results', text: 'Measured off-target indel frequency dropped from 4.8% to 0.09% across all 14 validated genomic loci.' },
  { role: 'results', text: 'Compared against FlashAttention baselines, our kernel yields a 2.8x throughput speedup and 64% lower peak VRAM usage.' },
  { role: 'results', text: 'Perovskite solar cells achieved a stabilized power conversion efficiency of 24.3% under AM 1.5G illumination.' },
  { role: 'results', text: 'The autonomous drone completed 18 of 20 subterranean runs with zero collisions and mean localization drift of 0.14 m.' },
  { role: 'results', text: 'Panel regression estimates indicate a statistically significant 1.9% decline in discretionary spending (p < 0.01).' },
  { role: 'results', text: 'Ablation tables confirm that removing bigram TF-IDF features lowers macro-F1 classification performance by 6.2 points.' },
  { role: 'results', text: 'Conformal prediction intervals attained 95.1% empirical coverage across all held-out hospital validation cohorts.' },
  { role: 'results', text: 'Electrochemical impedance spectroscopy revealed a three-fold reduction in interfacial charge-transfer resistance.' },
  { role: 'results', text: 'Our solver converged in 42 iterations compared to 310 iterations required by standard projected gradient descent.' },
  { role: 'results', text: 'Randomized trial outcomes showed a 38% reduction in hospital readmission hazard ratio over 12 months.' },
  { role: 'results', text: 'The quantized 4-bit network preserved 99.1% of full-precision reasoning accuracy on MMLU benchmarks.' },
  { role: 'results', text: 'Watershed calibration improved Nash-Sutcliffe flood peak efficiency from 0.71 to 0.89 across validation storms.' },
  { role: 'results', text: 'Measured methane emissions decreased by 41.2% in biochar-amended plots relative to untreated agricultural controls.' },
  { role: 'results', text: 'Mean tactile grasp success rate reached 96.4% across 250 fragile fruit pick-and-place benchtop trials.' },
  { role: 'results', text: 'Out-of-sample portfolio Sharpe ratio improved from 0.84 to 1.29 while maximum drawdown dropped by 18%.' },
  { role: 'results', text: 'Non-destructive ultrasonic arrays detected 97.5% of subsurface fatigue cracks larger than 1.5 mm depth.' },
  { role: 'results', text: 'Bilingual participants exhibited a 24 ms faster lexical access latency compared to matched monolingual controls (p = 0.004).' },

  // limitations (20)
  { role: 'limitations', text: 'A key limitation of our study is that evaluation was restricted to a single geographic hospital cohort of 240 patients.' },
  { role: 'limitations', text: 'The proposed kernel approximation degrades noticeably on associative recall tasks requiring exact token-level copy.' },
  { role: 'limitations', text: 'Our method assumes synchronous client availability and does not tolerate heavy straggler dropouts over wireless links.' },
  { role: 'limitations', text: 'However, high-temperature sintering at 1150 C remains costly to scale for roll-to-roll industrial battery manufacturing.' },
  { role: 'limitations', text: 'These experiments are constrained by synthetic noise simulations rather than full clinical long-term animal trials.' },
  { role: 'limitations', text: 'A notable drawback is sensitivity to regularization hyperparameters when training samples are fewer than fifty.' },
  { role: 'limitations', text: 'Our dataset lacks underrepresented pediatric age groups, limiting external generalization outside adult populations.' },
  { role: 'limitations', text: 'Furthermore, the tactile sensor elastomer experiences hysteresis drift after prolonged thermal exposure above 60 C.' },
  { role: 'limitations', text: 'Inference latency on embedded microcontrollers still exceeds our 20 ms real-time control budget under dense clutter.' },
  { role: 'limitations', text: 'Observational survey data cannot completely rule out unobserved confounding socioeconomic variables.' },
  { role: 'limitations', text: 'Although accurate on English abstracts, the model has not been validated on multilingual or scanned OCR manuscripts.' },
  { role: 'limitations', text: 'Memory bandwidth overhead limits batch-size scaling when sequence contexts exceed 256k tokens on consumer GPUs.' },
  { role: 'limitations', text: 'The current formulation assumes stationary covariance structure and breaks down during sudden regime shifts.' },
  { role: 'limitations', text: 'We note that humidity above 75% accelerates interfacial degradation in unencapsulated perovskite test cells.' },
  { role: 'limitations', text: 'Evaluation relied solely on retrospective registry records without prospective clinician adjudication.' },
  { role: 'limitations', text: 'A major constraint is that field measurements spanned only a single dry season and cannot capture inter-annual climate swings.' },
  { role: 'limitations', text: 'The linear acoustic approximation overlooks nonlinear crack closure effects under high-amplitude cyclic tension.' },
  { role: 'limitations', text: 'Our classifier cannot disambiguate rare interdisciplinary papers that bridge more than three distinct faculties.' },
  { role: 'limitations', text: 'Because cryo-EM grids require ultrathin ice vitrification, thicker biological tissue sections remain inaccessible.' },
  { role: 'limitations', text: 'Training convergence slows substantially when client heterogeneity causes severe gradient divergence across rounds.' },

  // future_work (20)
  { role: 'future_work', text: 'Future work will extend our framework to multi-center prospective clinical trials across diverse imaging scanners.' },
  { role: 'future_work', text: 'In subsequent research, we plan to investigate learnable positive feature maps for exact long-context associative recall.' },
  { role: 'future_work', text: 'Further investigation is needed to evaluate asynchronous federated aggregation under severe wireless packet loss.' },
  { role: 'future_work', text: 'Next steps include developing low-temperature co-sintering routes compatible with commercial solid-state cell lines.' },
  { role: 'future_work', text: 'Integrating multi-modal thermal infrared cameras remains an open direction for smoke-occluded robotic navigation.' },
  { role: 'future_work', text: 'We intend to curate larger annotated multi-lingual corpora to expand cross-disciplinary extraction generalization.' },
  { role: 'future_work', text: 'Exploring adaptive encapsulation barriers for tropical outdoor humidity stability represents a promising avenue.' },
  { role: 'future_work', text: 'Future studies should benchmark counterfactual causal estimators against instrumental variable panel specifications.' },
  { role: 'future_work', text: 'Hardware co-design with quantized integer matrix units will be pursued to hit sub-10 ms edge control loops.' },
  { role: 'future_work', text: 'Extending our conformal calibration guarantees to non-exchangeable time-series streams remains an important goal.' },
  { role: 'future_work', text: 'Upcoming experiments will assess off-target editing persistence over 24-month longitudinal in-vivo follow-ups.' },
  { role: 'future_work', text: 'Combining active human-in-the-loop scholar feedback with online weight updates is left for future deployment.' },
  { role: 'future_work', text: 'Investigating self-supervised pre-training on unlabeled regional climate buoys may mitigate Arctic sensor sparsity.' },
  { role: 'future_work', text: 'Standardizing open benchmark splits across heterophilic graph datasets will facilitate fairer baseline comparisons.' },
  { role: 'future_work', text: 'We aim to integrate automated OCR layout parsing so historical scanned monographs can also be analyzed.' },
  { role: 'future_work', text: 'Future deployments will incorporate multi-year soil carbon flux towers across humid temperate croplands.' },
  { role: 'future_work', text: 'Extending the ultrasonic inversion solver to handle anisotropic composite ply layups is planned next.' },
  { role: 'future_work', text: 'Evaluating hierarchical label taxonomies to support multi-label discipline tagging remains an exciting future direction.' },
  { role: 'future_work', text: 'In upcoming work, we will validate the closed-loop gripper directly on fragile soft-berry commercial harvesting lines.' },
  { role: 'future_work', text: 'Incorporating regime-switching volatility factors into dynamic portfolio constraints warrants further exploration.' }
];
