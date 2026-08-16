export interface Variation {
  title: string;
  badge: string;
  subject: string;
  body: string;
}

export interface ResearchFocus {
  lab: string;
  topics: string[];
  priorities: string;
  achievements: string;
  recentPaper: string;
  futureImpact: string;
}

export interface PainPoints {
  currentGaps: string;
  challenges: string;
  bottlenecks: string;
  problemStatement: string;
  whySolutionsShort: string;
}

export interface ReplyData {
  received: boolean;
  type: 'positive' | 'neutral' | 'none';
  sentiment: string;
  date: string;
  snippet: string;
  nextAction: string;
}

export interface Contact {
  id: string;
  name: string;
  applicant: string;
  director: string;
  designation: string;
  department: string;
  institution: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  email: string;
  phone: string;
  webpage: string;
  profileVerified: boolean;
  scrapedPapers: string[];
  researchFocus: ResearchFocus;
  painPoints: PainPoints;
  evidenceId: string;
  confidence: number;
  status: 'Ready' | 'Claimed' | 'Sending' | 'Sent' | 'Delivered' | 'Bounced' | 'Error' | 'Replied' | 'Follow-up 1' | 'Pending Review' | 'Approved' | 'Rejected';
  selectedVariationIndex: number;
  variations: Variation[];
  outreachStatus: string;
  reply: ReplyData;
}

export interface Campaign {
  id: string;
  name: string;
  totalLeads: number;
  sent: number;
  opened: number;
  replied: number;
  positive: number;
  status: 'Active' | 'Paused' | 'Completed';
}

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Dr. Evelyn Vance',
    applicant: 'Sharad Verma',
    director: 'Dr. Evelyn Vance (Director)',
    designation: 'Director & Full Professor',
    department: 'Dept of Computer Science & AI Lab',
    institution: 'MIT CSAIL',
    address: '32 Vassar St, Cambridge, MA 02139',
    city: 'Cambridge',
    state: 'MA',
    pin: '02139',
    email: 'evance@mit.edu',
    phone: '+1 (617) 253-5888',
    webpage: 'https://csail.mit.edu/person/evelyn-vance',
    profileVerified: true,
    scrapedPapers: [
      'Fault-Tolerant Distributed Consensus in Multi-Agent Networks (2025)',
      'Autonomous Coordination across Heterogeneous Edge Clusters (2024)'
    ],
    researchFocus: {
      lab: 'Distributed Intelligence & Multi-Agent Systems Group',
      topics: ['Decentralized Consensus', 'Edge Robotics', 'Fault-Tolerant Microservices'],
      priorities: 'Scaling autonomous agent swarms with zero communication overhead',
      achievements: 'IEEE Fellow, Best Paper Award NeurIPS 2024 ($2.4M NSF Grant)',
      recentPaper: 'Distributed Multi-Agent Consensus with Bounded Latency (ICML 2025)',
      futureImpact: 'Next-gen decentralized infrastructure for autonomous aerospace systems'
    },
    painPoints: {
      currentGaps: 'High latency overhead during multi-cluster cross-regional coordination',
      challenges: 'Managing asynchronous Byzantine state replication without bottlenecking throughput',
      bottlenecks: 'Existing simulators cannot handle >10k concurrent distributed nodes',
      problemStatement: 'Lack of unified benchmarking tools for multi-agent swarm reliability',
      whySolutionsShort: 'Legacy frameworks either sacrifice Byzantine safety or experience exponential latency drop'
    },
    evidenceId: 'MIT-PAP-892',
    confidence: 96,
    status: 'Pending Review',
    selectedVariationIndex: 0,
    variations: [
      {
        title: 'Original Baseline',
        badge: 'Standard Hook',
        subject: 'Inquiry regarding recent publication on Distributed Multi-Agent Systems',
        body: 'Dear Dr. Vance,\n\nI read your team\'s recent paper on Distributed Multi-Agent Systems (2025) with great admiration. Your approach to fault-tolerant consensus aligns directly with our research initiative at the Outreach Consortium.\n\nWe have developed an open benchmarking harness that handles over 50,000 concurrent edge nodes with sub-millisecond sync. Given your lab\'s focus on autonomous aerospace swarms, I would love to explore if our open-access testbed could support your upcoming NSF milestones.\n\nWould you be open for a brief 10-minute introductory call next Tuesday at 2:00 PM EST?\n\nBest regards,\nCollege Outreach Team'
      },
      {
        title: 'Var 1: Research Synergy',
        badge: 'Synergy Angle',
        subject: 'Synergy with MIT CSAIL: Accelerating Distributed Multi-Agent Consensus Benchmarks',
        body: 'Dear Dr. Vance,\n\nYour recent paper "Distributed Multi-Agent Consensus with Bounded Latency" presented an elegant resolution to cross-cluster communication latency. Our research team has been building complementary infrastructure to test Byzantine state replication at 10x scale.\n\nWe would love to share our preliminary test results and explore a joint technical paper for NeurIPS 2026.\n\nWould 15 minutes next week work for an exploratory conversation?\n\nSincerely,\nAI Research Collaboration Lead'
      },
      {
        title: 'Var 2: Grant Opportunities',
        badge: 'Grant Alignment',
        subject: 'Collaboration opportunity on upcoming $2.4M NSF Autonomous Swarm Grant',
        body: 'Dear Dr. Vance,\n\nIn light of MIT CSAIL\'s recent NSF grant on autonomous coordination, our lab is assembling a multi-institution consortium to co-apply for the upcoming DARPA Distributed Edge program.\n\nOur platform eliminates the async replication bottlenecks highlighted in your recent lab overview. We would be honored to include CSAIL as a lead validation node.\n\nCan we schedule a 15-minute sync with your lab coordinator?\n\nBest regards,\nConsortium Director'
      },
      {
        title: 'Var 3: Bottleneck Solution',
        badge: 'Problem-Solver',
        subject: 'Solving the >10k concurrent node simulation barrier for CSAIL multi-agent tests',
        body: 'Dear Dr. Vance,\n\nOne common challenge highlighted by distributed systems labs is that current simulators fail once cluster size exceeds 10k nodes, creating simulation bottlenecks before hardware deployment.\n\nOur team has engineered a zero-overhead virtualization layer that scales cleanly to 100,000 nodes while maintaining strict Byzantine safety. We are offering free academic licenses to top AI labs.\n\nMay I send you a 2-page technical whitepaper and access key?\n\nWarm regards,\nSystems Engineering Lead'
      },
      {
        title: 'Var 4: Student Outcomes',
        badge: 'Education Impact',
        subject: 'Accelerating graduate student research in MIT CSAIL Distributed Systems',
        body: 'Dear Dr. Vance,\n\nWe are partnering with select doctoral programs to provide graduate students in distributed robotics with instant access to accelerated hardware testbeds, cutting simulation runtimes from days to minutes.\n\nWe would love to sponsor computational resources for your PhD candidates working on edge swarm consensus.\n\nCould we arrange a short walkthrough for your research group?\n\nBest regards,\nAcademic Outreach Team'
      },
      {
        title: 'Var 5: Lab Modernization',
        badge: 'Tooling Upgrade',
        subject: 'Modernizing testbed telemetry for MIT CSAIL Autonomous Swarm Lab',
        body: 'Dear Dr. Vance,\n\nModern distributed robotics requires real-time observability across asynchronous nodes. We\'ve developed an open-source telemetry suite that captures nanosecond trace events without altering execution paths.\n\nWe would love to deploy a private instance for your lab\'s upcoming edge experiments.\n\nAre you available for a brief demo next Wednesday?\n\nBest regards,\nDeveloper Relations'
      },
      {
        title: 'Var 6: Peer Citation',
        badge: 'Academic Citation',
        subject: 'Citing your 2025 paper in our upcoming Autonomous Systems Survey',
        body: 'Dear Dr. Vance,\n\nOur team is currently finalizing a comprehensive survey on Fault-Tolerant Consensus for ACM Computing Surveys, where we prominently feature your 2025 paper on bounded latency.\n\nWe would be thrilled to include a short interview quote regarding your vision for future aerospace swarm safety.\n\nCould you spare 5 minutes for a quick asynchronous Q&A?\n\nWith respect,\nEditorial Research Team'
      },
      {
        title: 'Var 7: Executive Brief',
        badge: 'Executive Brief',
        subject: 'Strategic Academic Partnership Proposal for MIT CSAIL',
        body: 'Dear Dr. Vance,\n\nAs Director of CSAIL, you oversee some of the world\'s most impactful computing initiatives. We are establishing an industry-academic alliance to fund next-generation autonomous systems infrastructure with zero IP lock-in.\n\nWe have earmarked initial research sponsorship and would value your guidance on strategic allocation for MIT.\n\nCould we schedule a 10-minute briefing at your convenience?\n\nRespectfully yours,\nVP of Strategic Partnerships'
      },
      {
        title: 'Var 8: Deep Technical PI',
        badge: 'Deep Tech PI',
        subject: 'Technical query on Bounded Latency proofs in multi-agent consensus',
        body: 'Dear Dr. Vance,\n\nIn Lemma 3.2 of your recent preprint on bounded latency, you establish an upper bound of O(log N) for Byzantine state convergence. We implemented your theorem on our rust-based runtime and observed near-linear throughput scaling.\n\nWe would love to share our benchmark data and discuss an extension to heterogeneous link delays.\n\nLet us know if you\'d be interested in reviewing the dataset!\n\nBest,\nDistributed Systems Core Team'
      },
      {
        title: 'Var 9: Joint Venture',
        badge: 'Joint Venture',
        subject: 'Commercialization & Testbed validation for MIT CSAIL AI swarm patents',
        body: 'Dear Dr. Vance,\n\nWe work with leading industry consortia to bridge cutting-edge academic prototypes into real-world autonomous grid deployments. We would love to explore co-developing a reference implementation based on your lab\'s consensus IP.\n\nWould you or your technology licensing officer be open for a discussion?\n\nWarm regards,\nTechnology Transfer Liaison'
      },
      {
        title: 'Var 10: Keynote Invitation',
        badge: 'Event Invitation',
        subject: 'Keynote Speaker Invitation: Global Autonomous Systems Summit 2026',
        body: 'Dear Dr. Vance,\n\nOn behalf of the organizing committee for the 2026 Global Autonomous Systems Summit, it is our distinct pleasure to invite you to deliver a Keynote Address on "Future Directions in Multi-Agent Swarm Safety".\n\nAll travel and honorarium are fully covered, and your session would headline the Opening Plenary.\n\nPlease let us know if you would be open to receiving the official formal invitation packet.\n\nWarmest regards,\nProgram Committee Chairs'
      }
    ],
    outreachStatus: 'Delivered',
    reply: {
      received: true,
      type: 'positive',
      sentiment: 'High Interest / Demo Request',
      date: 'Today, 10:42 AM',
      snippet: '"Thanks for reaching out! Your 50k-node benchmarking harness sounds directly applicable to our NSF project. Are you free next Tuesday at 2:00 PM EST for a quick Zoom call?"',
      nextAction: 'Suggested Meeting slot booked & VIP High-Value Lead Tagged'
    }
  },
  {
    id: '2',
    name: 'Prof. Marcus Chen',
    applicant: 'Rohit Sharma',
    director: 'Prof. Marcus Chen (HOD)',
    designation: 'Department Head & Professor',
    department: 'Stanford AI Lab (SAIL)',
    institution: 'Stanford University',
    address: '450 Jane Stanford Way, Stanford, CA 94305',
    city: 'Stanford',
    state: 'CA',
    pin: '94305',
    email: 'mchen@stanford.edu',
    phone: '+1 (650) 723-2300',
    webpage: 'https://ai.stanford.edu/people/marcus-chen',
    profileVerified: true,
    scrapedPapers: [
      'Automated Code Synthesis with Neuro-Symbolic Verification (2025)',
      'High-Throughput Compiler Optimizations for Neural Accelerators (2024)'
    ],
    researchFocus: {
      lab: 'Automated Reasoning & Code Synthesis Lab',
      topics: ['Neuro-symbolic AI', 'Formal Program Verification', 'Custom Neural Compilers'],
      priorities: 'Guaranteeing 100% semantic correctness in LLM-generated software pipelines',
      achievements: 'ACM Turing Award Fellow nomination, Principal Investigator on DARPA HACMS',
      recentPaper: 'Provably Correct Code Synthesis via SMT-Guided LLMs (PLDI 2025)',
      futureImpact: 'Zero-bug mission-critical software generation for robotics and healthcare'
    },
    painPoints: {
      currentGaps: 'State-space explosion during SMT theorem solver verification runs',
      challenges: 'Compiler toolchains fail to preserve formal safety invariants during optimization',
      bottlenecks: 'Lack of real-time SAT/SMT cloud acceleration infrastructure',
      problemStatement: 'Current synthesis techniques hallucinate corner cases and fail safety audits',
      whySolutionsShort: 'Existing tools separate the generator from the verifier, causing massive compute waste'
    },
    evidenceId: 'STAN-RES-401',
    confidence: 91,
    status: 'Approved',
    selectedVariationIndex: 1,
    variations: [
      {
        title: 'Original Baseline',
        badge: 'Standard Hook',
        subject: 'Inquiry regarding Provably Correct Code Synthesis research at SAIL',
        body: 'Dear Prof. Chen,\n\nI have followed your lab\'s remarkable work on SMT-guided code generation. We have built an accelerated cloud solver that speeds up SAT verification by 14x.\n\nWould you be open to a 10-minute sync to see how SAIL researchers could utilize this infrastructure?\n\nBest regards,\nOutreach Automation Team'
      },
      {
        title: 'Var 1: Research Synergy',
        badge: 'Synergy Angle',
        subject: 'Accelerating SMT Solver passes for Stanford SAIL Neuro-symbolic synthesis',
        body: 'Dear Prof. Chen,\n\nYour PLDI 2025 paper demonstrated the power of neuro-symbolic verification. We\'ve designed a distributed solver backend that mitigates state-space explosion during large AST checks.\n\nWe\'d love to benchmark your formal verification dataset on our cluster.\n\nBest,\nAI Systems Group'
      }
    ],
    outreachStatus: 'Sent',
    reply: {
      received: true,
      type: 'neutral',
      sentiment: 'Out of Office / Auto-reply',
      date: 'Yesterday, 02:15 PM',
      snippet: '"I am currently out of office attending ICML 2026. I will return on August 22nd. For urgent matters contact my lab admin."',
      nextAction: 'Automated Follow-up 1 scheduled for Aug 23 (after 3 days)'
    }
  },
  {
    id: '3',
    name: 'Dr. Sarah Jenkins',
    applicant: 'Priya Patel',
    director: 'Dr. Sarah Jenkins (Associate Dean)',
    designation: 'Associate Dean of Research & Associate Professor',
    department: 'EECS & Quantum Computing Institute',
    institution: 'UC Berkeley',
    address: 'Berkeley, CA 94720',
    city: 'Berkeley',
    state: 'CA',
    pin: '94720',
    email: 'sjenkins@berkeley.edu',
    phone: '+1 (510) 642-6000',
    webpage: 'https://eecs.berkeley.edu/faculty/sarah-jenkins',
    profileVerified: true,
    scrapedPapers: [
      'Quantum Graph Neural Networks for Molecular Drug Discovery (2025)',
      'Error Mitigation in Intermediate-Scale Quantum Processors (2024)'
    ],
    researchFocus: {
      lab: 'Berkeley Quantum Information & Bio-Design Lab',
      topics: ['Quantum ML', 'Variational Quantum Circuits', 'Molecular Simulation'],
      priorities: 'Achieving quantum advantage in biochemical docking simulations',
      achievements: 'Sloan Research Fellow, NSF CAREER Award',
      recentPaper: 'Graph Quantum Embeddings for Macromolecular Folding (Nature QC 2025)',
      futureImpact: 'Ultra-rapid personalized pharmaceutical discovery pipelines'
    },
    painPoints: {
      currentGaps: 'High decoherence noise in 128+ qubit QPU simulators',
      challenges: 'Barren plateaus during gradient descent in variational quantum eigensolvers',
      bottlenecks: 'Simulating quantum molecular states takes weeks on standard GPU clusters',
      problemStatement: 'Severe shortage of high-performance quantum circuit tensor network simulators',
      whySolutionsShort: 'Existing tensor networks lack GPU tensor-core optimization for complex graphs'
    },
    evidenceId: 'UCB-NSF-112',
    confidence: 94,
    status: 'Ready',
    selectedVariationIndex: 0,
    variations: [
      {
        title: 'Original Baseline',
        badge: 'Standard Hook',
        subject: 'Quantum Graph Neural Networks research partnership inquiry',
        body: 'Dear Dr. Jenkins,\n\nYour recent paper in Nature QC on Quantum Graph Embeddings has set a new standard for molecular simulation. We have developed an accelerated tensor-network emulator that cuts simulation times from 72 hours to 45 minutes.\n\nWe would love to offer Berkeley Quantum Lab direct API access for your upcoming research grant.\n\nWould you have 10 minutes for a brief call next week?\n\nSincerely,\nQuantum Outreach Lead'
      }
    ],
    outreachStatus: 'Queued',
    reply: {
      received: false,
      type: 'none',
      sentiment: 'Pending Dispatch',
      date: 'Scheduled for today',
      snippet: 'No reply received yet. Drip sequence active.',
      nextAction: 'Automated Follow-up 1 will trigger after 3 days if unreplied'
    }
  },
  {
    id: '4',
    name: 'Dr. Aris Thorne',
    applicant: 'Devendra Rao',
    director: 'Dr. Aris Thorne (Principal Investigator)',
    designation: 'Assistant Professor & Robotics PI',
    department: 'The Robotics Institute',
    institution: 'Carnegie Mellon University',
    address: '5000 Forbes Ave, Pittsburgh, PA 15213',
    city: 'Pittsburgh',
    state: 'PA',
    pin: '15213',
    email: 'athorne@cmu.edu',
    phone: '+1 (412) 268-2000',
    webpage: 'https://ri.cmu.edu/faculty/aris-thorne',
    profileVerified: true,
    scrapedPapers: [
      'Sim-to-Real Transfer in Dexterous Bimanual Manipulation (2025)',
      'Visual Tactile Feedback for High-Precision Micro-Assembly (2024)'
    ],
    researchFocus: {
      lab: 'Dexterous Manipulation & Tactile Robotics Group',
      topics: ['Sim-to-Real Transfer', 'Tactile Sensing', 'Bimanual Coordination'],
      priorities: 'Zero-shot sim-to-real transfer for fragile object assembly',
      achievements: 'RSS Best Paper Finalist 2025, DARPA SubT Challenge Winner',
      recentPaper: 'High-Density Tactile Skin Arrays for Sub-Millimeter Gripping (ICRA 2025)',
      futureImpact: 'Human-level dexterous robots for automated surgical assistance'
    },
    painPoints: {
      currentGaps: 'Contact dynamics reality gap between simulation and real pneumatic actuators',
      challenges: 'Sensor drift and noise in high-density tactile sensor matrices',
      bottlenecks: 'Collecting physical manipulation trials is dangerously slow and expensive',
      problemStatement: 'Lack of high-fidelity differentiable physics engines with soft-body contact',
      whySolutionsShort: 'Traditional rigid body physics engines cannot simulate compliant elastomeric fingers'
    },
    evidenceId: 'CMU-KEY-504',
    confidence: 98,
    status: 'Replied',
    selectedVariationIndex: 0,
    variations: [
      {
        title: 'Original Baseline',
        badge: 'Standard Hook',
        subject: 'High-Fidelity Soft-Body Physics Simulator for CMU Dexterous Manipulation Lab',
        body: 'Dear Dr. Thorne,\n\nWe loved your recent ICRA paper on tactile skin arrays. We have built a GPU-differentiable soft body contact engine that reduces sim-to-real tactile error by 82%.\n\nWe\'d love to sponsor your lab with free cluster licenses.\n\nCan we set up a 10-minute demo?\n\nBest,\nRobotics Consortium'
      }
    ],
    outreachStatus: 'Replied',
    reply: {
      received: true,
      type: 'positive',
      sentiment: 'Demo / Meeting Request (High Value VIP)',
      date: 'Today, 09:30 AM',
      snippet: '"This differentiable soft-body engine looks like exactly what we need for our NSF tactile proposal. Could we schedule a 20-min Zoom demo this Thursday at 11am EST?"',
      nextAction: 'VIP Lead Confirmed & One-Click Meeting Slot Generated'
    }
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'default', name: 'Fall 2026 CS Research Outreach', totalLeads: 142, sent: 89, opened: 64, replied: 28, positive: 19, status: 'Active' },
  { id: 'bio', name: 'Biomedical Engineering Grants', totalLeads: 54, sent: 40, opened: 31, replied: 12, positive: 8, status: 'Active' },
  { id: 'ml', name: 'AI/ML Lab Partnerships', totalLeads: 210, sent: 180, opened: 125, replied: 49, positive: 35, status: 'Paused' }
];
