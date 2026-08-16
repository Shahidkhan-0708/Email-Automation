/**
 * College Outreach Automation System V2 — Frontend Application
 * Architecture: End-to-End Pipeline based on Workflow Diagram
 * (Input -> Cleaning -> Context Interpretation -> AI 10-Variants -> Review -> Outreach -> Replies Decision Tree)
 */

(function () {
  'use strict';

  // Comprehensive Pipeline Mock State
  const state = {
    currentView: 'pipeline',
    collapsed: false,
    selectedCampaign: 'default',
    selectedLeadIndex: 0,
    selectedVariantTab: 0,
    activeInspectorNode: 'context',

    // Sample Academic Contacts with Full Diagram Attributes
    contacts: [
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
            title: 'Var 2: Grant & Funding Opportunities',
            badge: 'Grant Alignment',
            subject: 'Collaboration opportunity on upcoming $2.4M NSF Autonomous Swarm Grant',
            body: 'Dear Dr. Vance,\n\nIn light of MIT CSAIL\'s recent NSF grant on autonomous coordination, our lab is assembling a multi-institution consortium to co-apply for the upcoming DARPA Distributed Edge program.\n\nOur platform eliminates the async replication bottlenecks highlighted in your recent lab overview. We would be honored to include CSAIL as a lead validation node.\n\nCan we schedule a 15-minute sync with your lab coordinator?\n\nBest regards,\nConsortium Director'
          },
          {
            title: 'Var 3: Pain Point & Bottleneck Solution',
            badge: 'Problem-Solver',
            subject: 'Solving the >10k concurrent node simulation barrier for CSAIL multi-agent tests',
            body: 'Dear Dr. Vance,\n\nOne common challenge highlighted by distributed systems labs is that current simulators fail once cluster size exceeds 10k nodes, creating simulation bottlenecks before hardware deployment.\n\nOur team has engineered a zero-overhead virtualization layer that scales cleanly to 100,000 nodes while maintaining strict Byzantine safety. We are offering free academic licenses to top AI labs.\n\nMay I send you a 2-page technical whitepaper and access key?\n\nWarm regards,\nSystems Engineering Lead'
          },
          {
            title: 'Var 4: Student & Faculty Outcomes',
            badge: 'Education Impact',
            subject: 'Accelerating graduate student research in MIT CSAIL Distributed Systems',
            body: 'Dear Dr. Vance,\n\nWe are partnering with select doctoral programs to provide graduate students in distributed robotics with instant access to accelerated hardware testbeds, cutting simulation runtimes from days to minutes.\n\nWe would love to sponsor computational resources for your PhD candidates working on edge swarm consensus.\n\nCould we arrange a short walkthrough for your research group?\n\nBest regards,\nAcademic Outreach Team'
          },
          {
            title: 'Var 5: Lab Modernization & Tools',
            badge: 'Tooling Upgrade',
            subject: 'Modernizing testbed telemetry for MIT CSAIL Autonomous Swarm Lab',
            body: 'Dear Dr. Vance,\n\nModern distributed robotics requires real-time observability across asynchronous nodes. We\'ve developed an open-source telemetry suite that captures nanosecond trace events without altering execution paths.\n\nWe would love to deploy a private instance for your lab\'s upcoming edge experiments.\n\nAre you available for a brief demo next Wednesday?\n\nBest regards,\nDeveloper Relations'
          },
          {
            title: 'Var 6: Peer Citation & Collaboration',
            badge: 'Academic Citation',
            subject: 'Citing your 2025 paper in our upcoming Autonomous Systems Survey',
            body: 'Dear Dr. Vance,\n\nOur team is currently finalizing a comprehensive survey on Fault-Tolerant Consensus for ACM Computing Surveys, where we prominently feature your 2025 paper on bounded latency.\n\nWe would be thrilled to include a short interview quote regarding your vision for future aerospace swarm safety.\n\nCould you spare 5 minutes for a quick asynchronous Q&A?\n\nWith respect,\nEditorial Research Team'
          },
          {
            title: 'Var 7: Executive Dean/Director Brief',
            badge: 'Executive Brief',
            subject: 'Strategic Academic Partnership Proposal for MIT CSAIL',
            body: 'Dear Dr. Vance,\n\nAs Director of CSAIL, you oversee some of the world\'s most impactful computing initiatives. We are establishing an industry-academic alliance to fund next-generation autonomous systems infrastructure with zero IP lock-in.\n\nWe have earmarked initial research sponsorship and would value your guidance on strategic allocation for MIT.\n\nCould we schedule a 10-minute briefing at your convenience?\n\nRespectfully yours,\nVP of Strategic Partnerships'
          },
          {
            title: 'Var 8: Deep Technical PI Formulation',
            badge: 'Deep Tech PI',
            subject: 'Technical query on Bounded Latency proofs in multi-agent consensus',
            body: 'Dear Dr. Vance,\n\nIn Lemma 3.2 of your recent preprint on bounded latency, you establish an upper bound of O(log N) for Byzantine state convergence. We implemented your theorem on our rust-based runtime and observed near-linear throughput scaling.\n\nWe would love to share our benchmark data and discuss an extension to heterogeneous link delays.\n\nLet us know if you\'d be interested in reviewing the dataset!\n\nBest,\nDistributed Systems Core Team'
          },
          {
            title: 'Var 9: Industry Collaborative Joint Venture',
            badge: 'Joint Venture',
            subject: 'Commercialization & Testbed validation for MIT CSAIL AI swarm patents',
            body: 'Dear Dr. Vance,\n\nWe work with leading industry consortia to bridge cutting-edge academic prototypes into real-world autonomous grid deployments. We would love to explore co-developing a reference implementation based on your lab\'s consensus IP.\n\nWould you or your technology licensing officer be open for a discussion?\n\nWarm regards,\nTechnology Transfer Liaison'
          },
          {
            title: 'Var 10: Keynote & Workshop Invitation',
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
        selectedVariationIndex: 2,
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
          },
          {
            title: 'Var 2: Bottleneck Solution',
            badge: 'Problem-Solver',
            subject: 'Mitigating the SMT Solver state-space explosion in automated code synthesis',
            body: 'Dear Prof. Chen,\n\nWe know that SMT solver timeouts remain the single biggest bottleneck in neuro-symbolic verification pipelines. Our distributed memoization solver eliminates redundant SAT passes, yielding a 14x speedup on complex proofs.\n\nWould you like our engineering team to provide your students with free cluster credentials?\n\nWarm regards,\nSystems Lead'
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
    ],

    campaigns: [
      { id: 'default', name: 'Fall 2026 CS Research Outreach', totalLeads: 142, sent: 89, opened: 64, replied: 28, positive: 19, status: 'Active' },
      { id: 'bio', name: 'Biomedical Engineering Grants', totalLeads: 54, sent: 40, opened: 31, replied: 12, positive: 8, status: 'Active' },
      { id: 'ml', name: 'AI/ML Lab Partnerships', totalLeads: 210, sent: 180, opened: 125, replied: 49, positive: 35, status: 'Paused' }
    ]
  };

  // Helper selectors
  function el(id) { return document.getElementById(id); }
  function queryAll(selector) { return Array.from(document.querySelectorAll(selector)); }

  function showToast(message, type = 'info') {
    const container = el('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : '✨';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }

  function openModal(title, contentHtml, onConfirm) {
    el('modal-title').innerText = title;
    el('modal-body').innerHTML = contentHtml;
    const modal = el('modal-overlay');
    modal.classList.add('active');

    const confirmBtn = el('modal-confirm-btn');
    const cancelBtn = el('modal-cancel-btn');
    const closeBtn = el('modal-close-btn');

    const closeHandler = () => modal.classList.remove('active');
    closeBtn.onclick = closeHandler;
    cancelBtn.onclick = closeHandler;

    confirmBtn.onclick = () => {
      if (onConfirm) onConfirm();
      closeHandler();
    };
  }

  function renderBadge(status) {
    let tone = 'neutral';
    let icon = '';
    switch (status) {
      case 'Ready': tone = 'neutral'; break;
      case 'Claimed': tone = 'info'; icon = '⋯'; break;
      case 'Sending': tone = 'info'; icon = '↻'; break;
      case 'Sent': tone = 'success'; icon = '✓'; break;
      case 'Delivered': tone = 'success'; icon = '✓✓'; break;
      case 'Bounced': tone = 'error'; icon = '✕'; break;
      case 'Error': tone = 'error'; icon = '⚠'; break;
      case 'Replied': tone = 'ai'; icon = '✨'; break;
      case 'Follow-up 1': tone = 'warning'; icon = '↻'; break;
      case 'Follow-up 2': tone = 'warning'; icon = '↻'; break;
      case 'Pending Review': tone = 'info'; icon = '⋯'; break;
      case 'Approved': tone = 'success'; icon = '✓'; break;
      case 'Rejected': tone = 'error'; icon = '✕'; break;
      case 'Edited': tone = 'warning'; icon = '✏'; break;
      default: tone = 'neutral';
    }
    return `<span class="status-badge tone-${tone}">${icon ? icon + ' ' : ''}${status}</span>`;
  }

  function renderAvatar(name, size = 'medium') {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    const colorIndex = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length;
    return `<div class="avatar avatar-${size}" style="background-color: ${colors[colorIndex]}">${initials}</div>`;
  }

  // Router Setup
  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash.replace('#/', '') || 'pipeline';
    state.currentView = hash;

    queryAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-view') === hash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const titleMap = {
      pipeline: 'Visual Pipeline Architecture',
      dashboard: 'Executive Dashboard & Metrics',
      import: '1. Input Ingestion & Column Extraction',
      people: '2. Profile Cleaning & Academic Scraper',
      research: '3. Context & Vision Interpretation',
      personalization: '4. AI 10-Variation Matrix Engine',
      review: '5. Human Review & Approval Queue',
      outreach: '6. SendGrid Delivery & Activity Log',
      replies: '7. Inbound Replies & Follow-up Drips',
      campaigns: 'Outreach Campaigns & Sequences',
      'bulk-send': 'Rate Limiting & Safety Dispatcher',
      settings: 'Settings, Integrations & API Keys',
      'design-system': 'Design Tokens & Component Catalog'
    };

    const title = titleMap[hash] || 'Visual Pipeline Architecture';
    el('page-title').innerText = title;
    el('breadcrumb-current').innerText = title;

    renderView(hash);
  }

  function renderView(viewName) {
    const container = el('page-content');
    switch (viewName) {
      case 'pipeline': renderPipelineFlowView(container); break;
      case 'dashboard': renderDashboardView(container); break;
      case 'import': renderImportView(container); break;
      case 'people': renderPeopleView(container); break;
      case 'research': renderResearchView(container); break;
      case 'personalization': renderPersonalizationView(container); break;
      case 'review': renderReviewView(container); break;
      case 'campaigns': renderCampaignsView(container); break;
      case 'bulk-send': renderBulkSendView(container); break;
      case 'outreach': renderOutreachView(container); break;
      case 'replies': renderRepliesView(container); break;
      case 'settings': renderSettingsView(container); break;
      case 'design-system': renderDesignSystemView(container); break;
      default: renderPipelineFlowView(container);
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 0: VISUAL PIPELINE ARCHITECTURE (Interactive Flowchart Canvas)
     Directly reflecting the workflow diagram from user image!
     ------------------------------------------------------------------------ */
  function renderPipelineFlowView(container) {
    container.innerHTML = `
      <div class="pipeline-overview-bar">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--gradient-ai-brand); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: bold;">
            ⚡
          </div>
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-900);">Live Pipeline Execution Map</h3>
            <p style="font-size: 12px; color: var(--color-neutral-600);">Click any stage node below to inspect live batch progression, extracted parameters, or trigger simulation.</p>
          </div>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="btn btn-secondary btn-small" id="btn-simulate-step">
            ▶ Step Next Stage
          </button>
          <button class="btn btn-primary btn-small" id="btn-simulate-flow">
            ✨ Run Simulation Flow
          </button>
        </div>
      </div>

      <!-- Live Pipeline Interactive Canvas -->
      <div class="pipeline-diagram-canvas">
        <div class="diagram-flow-row">
          
          <!-- Step 1: Input -->
          <div class="pipeline-node ${state.activeInspectorNode === 'input' ? 'active-node' : ''}" data-node="input" title="Click to inspect Input Stage">
            <div class="node-header">
              <span class="node-step-tag">STAGE 1</span>
              <span class="chip tone-info" style="font-size: 10px;">CSV / Sheet</span>
            </div>
            <div class="node-title">📄 Input & Extraction</div>
            <div class="node-desc">Ingests raw sheet columns: Applicant, Director, Designation, Dept, Address, Email, Phone.</div>
            <div class="node-meta-pills">
              <div class="node-meta-pill"><span>Fields:</span><strong>9 Mapped</strong></div>
              <div class="node-meta-pill"><span>Queue:</span><strong>142 Leads</strong></div>
            </div>
          </div>

          <div class="flow-connector-arrow">→</div>

          <!-- Step 2: Profile Cleaning -->
          <div class="pipeline-node ${state.activeInspectorNode === 'cleaning' ? 'active-node' : ''}" data-node="cleaning" title="Click to inspect Profile Cleaning">
            <div class="node-header">
              <span class="node-step-tag">STAGE 2</span>
              <span class="chip tone-ai" style="font-size: 10px;">Scraper Active</span>
            </div>
            <div class="node-title">🔍 Profile Cleaning</div>
            <div class="node-desc">Search engine verification, official faculty directory crawler & publication extraction.</div>
            <div class="node-meta-pills">
              <div class="node-meta-pill"><span>Verified:</span><strong>98.4%</strong></div>
              <div class="node-meta-pill"><span>Scraped:</span><strong>58 Papers</strong></div>
            </div>
          </div>

          <div class="flow-connector-arrow">→</div>

          <!-- Step 3: Context Interpretation (Split into 2 branches) -->
          <div class="node-branch-box">
            <!-- Research Focus & Vision -->
            <div class="pipeline-node branch-node-research ${state.activeInspectorNode === 'context-research' ? 'active-node' : ''}" data-node="context-research" title="Click to inspect Research Focus">
              <div class="node-header">
                <span class="node-step-tag" style="color: var(--color-brand-primary);">STAGE 3A</span>
                <span class="chip tone-info" style="font-size: 9px;">Vision Model</span>
              </div>
              <div class="node-title" style="color: var(--color-brand-primary); font-size: 12px;">🔬 Research Focus & Vision</div>
              <div class="node-desc" style="font-size: 10px;">Group / Lab, Projects, Focus Areas, Achievements, Recent Papers, Future Impact.</div>
            </div>

            <!-- Pain Points -->
            <div class="pipeline-node branch-node-pain ${state.activeInspectorNode === 'context-pain' ? 'active-node' : ''}" data-node="context-pain" title="Click to inspect Pain Points">
              <div class="node-header">
                <span class="node-step-tag" style="color: #b45309;">STAGE 3B</span>
                <span class="chip tone-warning" style="font-size: 9px;">Gaps Model</span>
              </div>
              <div class="node-title" style="color: #b45309; font-size: 12px;">⚠️ Pain Points & Inefficiencies</div>
              <div class="node-desc" style="font-size: 10px;">Current Gaps, Bottlenecks, Problem Statements, Why Existing Solutions Fall Short.</div>
            </div>
          </div>

          <div class="flow-connector-arrow">→</div>

          <!-- Step 4: AI LLM Engine -->
          <div class="pipeline-node ${state.activeInspectorNode === 'ai' ? 'active-node' : ''}" data-node="ai" title="Click to inspect AI Engine">
            <div class="node-header">
              <span class="node-step-tag">STAGE 4</span>
              <span class="chip tone-ai" style="font-size: 10px;">LLM Engine</span>
            </div>
            <div class="node-title">✨ AI Pipeline Engine</div>
            <div class="node-desc">Personalized Generation, Tone & Style Matching, Dynamic Hooks, Value Prop & CTA Alignment.</div>
            <div class="node-meta-pills">
              <div class="node-meta-pill"><span>Model:</span><strong>DeepSeek / Claude</strong></div>
              <div class="node-meta-pill"><span>Confidence:</span><strong>96% Avg</strong></div>
            </div>
          </div>

          <div class="flow-connector-arrow">→</div>

          <!-- Step 5: Email Resulting (10 Variations) -->
          <div class="pipeline-node ${state.activeInspectorNode === 'variants' ? 'active-node' : ''}" data-node="variants" style="border: 2px solid var(--color-brand-primary);" title="Click to inspect 10-Variation Matrix">
            <div class="node-header">
              <span class="node-step-tag">STAGE 5</span>
              <span class="chip tone-ai" style="font-size: 10px;">10 Variations</span>
            </div>
            <div class="node-title">📬 Email Variations</div>
            <div class="node-desc">Original draft + 10 customized outreach angles for Human Review & Selection.</div>
            <div class="node-meta-pills">
              <div class="node-meta-pill"><span>Matrix:</span><strong>Var 1 — 10</strong></div>
              <div class="node-meta-pill"><span>Review:</span><strong>3 Awaiting</strong></div>
            </div>
          </div>

          <div class="flow-connector-arrow">→</div>

          <!-- Step 6: Outreach Delivery -->
          <div class="pipeline-node ${state.activeInspectorNode === 'outreach' ? 'active-node' : ''}" data-node="outreach" title="Click to inspect Outreach Dispatch">
            <div class="node-header">
              <span class="node-step-tag">STAGE 6</span>
              <span class="chip tone-success" style="font-size: 10px;">SendGrid API</span>
            </div>
            <div class="node-title">📨 SendGrid Outreach</div>
            <div class="node-desc">Delivery, rate limiting, sender warm-up, open & click tracking, bounce detection.</div>
            <div class="node-meta-pills">
              <div class="node-meta-pill"><span>Sent:</span><strong>89 Dispatched</strong></div>
              <div class="node-meta-pill"><span>Open Rate:</span><strong>71.9%</strong></div>
            </div>
          </div>

          <div class="flow-connector-arrow">→</div>

          <!-- Step 7: Replies & Follow-up Branching -->
          <div class="node-branch-box">
            <!-- Positive Branch -->
            <div class="pipeline-node branch-node-pos ${state.activeInspectorNode === 'reply-pos' ? 'active-node' : ''}" data-node="reply-pos" title="Click to inspect Positive Reply Branch">
              <div class="node-header">
                <span class="node-step-tag" style="color: var(--color-status-success);">POSITIVE REPLY</span>
                <span class="chip tone-success" style="font-size: 9px;">VIP Deal</span>
              </div>
              <div class="node-title" style="color: var(--color-status-success); font-size: 12px;">🎯 Positive / Demo Request</div>
              <div class="node-desc" style="font-size: 10px;">Instant user alert, VIP Lead Tag, Suggest Meeting Time & Auto-calendar booking.</div>
            </div>

            <!-- Negative / Neutral Branch -->
            <div class="pipeline-node branch-node-neg ${state.activeInspectorNode === 'reply-neg' ? 'active-node' : ''}" data-node="reply-neg" title="Click to inspect Automated Drips">
              <div class="node-header">
                <span class="node-step-tag" style="color: #ea580c;">DRIP FOLLOW-UP</span>
                <span class="chip tone-warning" style="font-size: 9px;">Auto-Sequence</span>
              </div>
              <div class="node-title" style="color: #ea580c; font-size: 12px;">↻ Neutral / No Reply Flow</div>
              <div class="node-desc" style="font-size: 10px;">Follow-up 1 (after 3 days), Follow-up 2 (after 7 days), Auto Unsubscribe.</div>
            </div>
          </div>

        </div>
      </div>

      <!-- Live Inspector & Details Sub-Panel -->
      <div id="pipeline-node-inspector">
        ${renderNodeInspector(state.activeInspectorNode)}
      </div>
    `;

    // Bind Interactive Node Click
    queryAll('.pipeline-node').forEach(node => {
      node.onclick = () => {
        const targetNode = node.getAttribute('data-node');
        state.activeInspectorNode = targetNode;
        queryAll('.pipeline-node').forEach(n => n.classList.remove('active-node'));
        node.classList.add('active-node');
        const inspectorContainer = el('pipeline-node-inspector');
        if (inspectorContainer) {
          inspectorContainer.innerHTML = renderNodeInspector(targetNode);
          bindInspectorEvents();
        }
      };
    });

    // Quick Simulation Handlers
    const btnSimFlow = el('btn-simulate-flow');
    if (btnSimFlow) {
      btnSimFlow.onclick = () => runInteractiveSimulation();
    }

    const btnSimStep = el('btn-simulate-step');
    if (btnSimStep) {
      btnSimStep.onclick = () => {
        const nodes = ['input', 'cleaning', 'context-research', 'context-pain', 'ai', 'variants', 'outreach', 'reply-pos'];
        const currentIdx = nodes.indexOf(state.activeInspectorNode);
        const nextNode = nodes[(currentIdx + 1) % nodes.length];
        state.activeInspectorNode = nextNode;
        renderPipelineFlowView(container);
        showToast(`Stepped pipeline focus to: ${nextNode.toUpperCase()}`, 'info');
      };
    }

    bindInspectorEvents();
  }

  function renderNodeInspector(nodeId) {
    const lead = state.contacts[state.selectedLeadIndex] || state.contacts[0];

    switch (nodeId) {
      case 'input':
        return `
          <div class="node-inspector-panel">
            <div class="section-header">
              <div>
                <h3 class="section-title">Stage 1: Input & Column Extraction Inspector</h3>
                <p style="font-size: 12px; color: var(--color-neutral-600);">Structured record parsed from applicant input dataset.</p>
              </div>
              <a href="#/import" class="btn btn-primary btn-small">Open Ingest Workbench →</a>
            </div>
            <div class="grid-12" style="margin-top: 12px;">
              <div class="col-6">
                <table class="table" style="font-size: 12px;">
                  <tr><th>Field Column</th><th>Extracted Value</th></tr>
                  <tr><td>Applicant Name</td><td><strong>${lead.applicant}</strong></td></tr>
                  <tr><td>Director / Principal</td><td>${lead.director}</td></tr>
                  <tr><td>Designation</td><td>${lead.designation}</td></tr>
                  <tr><td>Department / College</td><td>${lead.department}</td></tr>
                  <tr><td>Institution</td><td>${lead.institution}</td></tr>
                </table>
              </div>
              <div class="col-6">
                <table class="table" style="font-size: 12px;">
                  <tr><th>Field Column</th><th>Extracted Value</th></tr>
                  <tr><td>College Address</td><td>${lead.address}</td></tr>
                  <tr><td>City, State, Pin</td><td>${lead.city}, ${lead.state} ${lead.pin}</td></tr>
                  <tr><td>Official Email</td><td><span class="evidence-source">${lead.email}</span></td></tr>
                  <tr><td>Contact Phone</td><td>${lead.phone}</td></tr>
                  <tr><td>Status</td><td>${renderBadge(lead.status)}</td></tr>
                </table>
              </div>
            </div>
          </div>
        `;

      case 'cleaning':
        return `
          <div class="node-inspector-panel">
            <div class="section-header">
              <div>
                <h3 class="section-title">Stage 2: Profile Cleaning & Web Scraping Inspector</h3>
                <p style="font-size: 12px; color: var(--color-neutral-600);">Real-time search engine verification & academic profile crawler.</p>
              </div>
              <a href="#/people" class="btn btn-primary btn-small">View Profiles Directory →</a>
            </div>
            <div class="card flat" style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="status-badge tone-success">✓ Domain Verified</span>
                  <strong>${lead.webpage}</strong>
                </div>
                <span class="chip tone-ai">Scraper Confidence: 98%</span>
              </div>
              <div style="font-size: 13px; color: var(--color-neutral-800); margin-bottom: 8px;">
                <strong>Recent Scraped Publications & Lab Announcements:</strong>
              </div>
              <ul style="padding-left: 20px; font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;">
                ${lead.scrapedPapers.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;

      case 'context-research':
      case 'context-pain':
      case 'context':
        return `
          <div class="node-inspector-panel">
            <div class="section-header">
              <div>
                <h3 class="section-title">Stage 3: Context Interpretation Split Analysis</h3>
                <p style="font-size: 12px; color: var(--color-neutral-600);">Dual-model semantic extraction: Research Focus vs Institutional Pain Points.</p>
              </div>
              <a href="#/research" class="btn btn-primary btn-small">Open Context & Vision Hub →</a>
            </div>
            
            <div class="split-context-container" style="margin-top: 16px;">
              <!-- Left: Research Focus & Vision -->
              <div class="context-box research-focus">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--color-brand-primary);">🔬 Research Focus & Vision</h4>
                  <span class="chip tone-info">Academic Vision</span>
                </div>
                <ul class="context-item-list">
                  <li class="context-item">
                    <span class="context-item-icon">🏢</span>
                    <div><strong>Research Group / Lab:</strong><br>${lead.researchFocus.lab}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">🎯</span>
                    <div><strong>Projects & Focus Areas:</strong><br>${lead.researchFocus.topics.join(' • ')}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">🏆</span>
                    <div><strong>Key Achievements:</strong><br>${lead.researchFocus.achievements}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">📄</span>
                    <div><strong>Recent Paper:</strong><br>${lead.researchFocus.recentPaper}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">🚀</span>
                    <div><strong>Future Direction & Potential Impact:</strong><br>${lead.researchFocus.futureImpact}</div>
                  </li>
                </ul>
              </div>

              <!-- Right: Pain Points & Inefficiencies -->
              <div class="context-box pain-points">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: #b45309;">⚠️ Pain Points & Inefficiencies</h4>
                  <span class="chip tone-warning">Opportunity Gap</span>
                </div>
                <ul class="context-item-list">
                  <li class="context-item">
                    <span class="context-item-icon">📉</span>
                    <div><strong>Current Gaps:</strong><br>${lead.painPoints.currentGaps}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">🚧</span>
                    <div><strong>Recent Challenges:</strong><br>${lead.painPoints.challenges}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">⏳</span>
                    <div><strong>Bottlenecks:</strong><br>${lead.painPoints.bottlenecks}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">❓</span>
                    <div><strong>Problem Statement:</strong><br>${lead.painPoints.problemStatement}</div>
                  </li>
                  <li class="context-item">
                    <span class="context-item-icon">⚡</span>
                    <div><strong>Why Existing Solutions Fall Short:</strong><br>${lead.painPoints.whySolutionsShort}</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        `;

      case 'variants':
      case 'ai':
        const variant = lead.variations[state.selectedVariantTab] || lead.variations[0];
        return `
          <div class="node-inspector-panel">
            <div class="section-header">
              <div>
                <h3 class="section-title">Stage 4 & 5: AI 10-Variation Matrix Showcase</h3>
                <p style="font-size: 12px; color: var(--color-neutral-600);">Generated specifically for <strong>${lead.name} (${lead.institution})</strong> based on scraped research.</p>
              </div>
              <a href="#/personalization" class="btn btn-primary btn-small">Full Variant Studio →</a>
            </div>

            <!-- Variation Tabs (10 Variations) -->
            <div class="variation-nav-bar" style="margin-top: 12px;">
              ${lead.variations.map((v, idx) => `
                <button class="variation-tab ${state.selectedVariantTab === idx ? 'active' : ''}" data-vidx="${idx}">
                  ${v.title}
                </button>
              `).join('')}
            </div>

            <!-- Active Variant Card -->
            <div class="variant-card-editor">
              <div class="variant-meta-strip">
                <div>
                  <span class="chip tone-ai">${variant.badge}</span>
                  <span style="font-size: 12px; margin-left: 8px; color: var(--color-neutral-600);">Evidence Link: <strong class="evidence-source">${lead.evidenceId}</strong></span>
                </div>
                <div>
                  <span class="chip tone-success">AI Confidence: ${lead.confidence}%</span>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Subject Line</label>
                <input class="input-field" value="${variant.subject}" id="active-variant-subject">
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Email Pitch Body</label>
                <textarea class="input-field" style="height: 140px; line-height: 1.5; font-family: var(--font-sans);" id="active-variant-body">${variant.body}</textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn btn-secondary btn-small" id="btn-copy-variant">📋 Copy Pitch</button>
                <button class="btn btn-primary btn-small" id="btn-select-variant">✓ Set as Active Pitch</button>
              </div>
            </div>
          </div>
        `;

      case 'reply-pos':
      case 'reply-neg':
      case 'outreach':
        return `
          <div class="node-inspector-panel">
            <div class="section-header">
              <div>
                <h3 class="section-title">Stage 6 & 7: Replies & Follow-up Decision Tree</h3>
                <p style="font-size: 12px; color: var(--color-neutral-600);">AI classification and automated branching logic for inbound messages.</p>
              </div>
              <a href="#/replies" class="btn btn-primary btn-small">Open Replies Hub →</a>
            </div>

            <div class="decision-tree-grid">
              <!-- Positive Flow -->
              <div class="branch-card positive-branch">
                <div class="branch-header">
                  <div class="branch-title" style="color: var(--color-status-success);">
                    <span>🎯 Positive / Demo Request Branch</span>
                  </div>
                  <span class="status-badge tone-success">Instant Route</span>
                </div>
                <div class="branch-step-box">
                  <strong>1. Instant User Push Notification:</strong>
                  <span>Mobile & Slack alert triggered within 3.2s of webhook receipt.</span>
                </div>
                <div class="branch-step-box">
                  <strong>2. VIP Tagging & CRM Sync:</strong>
                  <span>Contact marked as High-Value Deal in Supabase & Airtable.</span>
                </div>
                <div class="branch-step-box">
                  <strong>3. Suggest Meeting Time:</strong>
                  <span>Calculates optimal open calendar slots and pre-fills response draft.</span>
                </div>
              </div>

              <!-- Negative / Neutral / No Reply Flow -->
              <div class="branch-card negative-branch">
                <div class="branch-header">
                  <div class="branch-title" style="color: #ea580c;">
                    <span>↻ Neutral / No Reply Branch</span>
                  </div>
                  <span class="status-badge tone-warning">Drip Sequence</span>
                </div>
                <div class="branch-step-box">
                  <strong>1. Automated Follow-up 1 (Day 3):</strong>
                  <span>Gentle nudge citing additional relevant lab publication data.</span>
                </div>
                <div class="branch-step-box">
                  <strong>2. Automated Follow-up 2 (Day 7):</strong>
                  <span>Final closing inquiry with alternative resource link.</span>
                </div>
                <div class="branch-step-box">
                  <strong>3. Auto Unsubscribe / Cooldown:</strong>
                  <span>Safe exclusion from outreach to prevent domain reputation damage.</span>
                </div>
              </div>
            </div>
          </div>
        `;

      default:
        return `<div class="node-inspector-panel"><p>Select a node above to inspect details.</p></div>`;
    }
  }

  function bindInspectorEvents() {
    queryAll('.variation-tab').forEach(tab => {
      tab.onclick = () => {
        state.selectedVariantTab = parseInt(tab.getAttribute('data-vidx'), 10) || 0;
        const inspectorContainer = el('pipeline-node-inspector');
        if (inspectorContainer) {
          inspectorContainer.innerHTML = renderNodeInspector('variants');
          bindInspectorEvents();
        }
      };
    });

    const btnCopy = el('btn-copy-variant');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const bodyText = el('active-variant-body').value;
        navigator.clipboard?.writeText(bodyText);
        showToast('Email pitch copied to clipboard!', 'success');
      };
    }

    const btnSelect = el('btn-select-variant');
    if (btnSelect) {
      btnSelect.onclick = () => {
        showToast(`Variation selected for lead ${state.contacts[0].name}`, 'success');
      };
    }
  }

  function runInteractiveSimulation() {
    const sequence = [
      { node: 'input', msg: 'Stage 1: Parsing CSV rows & extracting institutional directory...' },
      { node: 'cleaning', msg: 'Stage 2: Web scraper verifying university domain & recent papers...' },
      { node: 'context-research', msg: 'Stage 3: Decomposing Research Focus, Grants & Vision...' },
      { node: 'context-pain', msg: 'Stage 3: Identifying Institutional Gaps & Simulation Bottlenecks...' },
      { node: 'ai', msg: 'Stage 4: LLM formulating Dynamic Hook, Value Prop & Pitch...' },
      { node: 'variants', msg: 'Stage 5: Generated 10 customized outreach variations for review!' },
      { node: 'outreach', msg: 'Stage 6: Dispatched via SendGrid API with atomic claim lock...' },
      { node: 'reply-pos', msg: 'Stage 7: Inbound Positive Reply classified! Instant notification sent.' }
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step >= sequence.length) {
        clearInterval(interval);
        showToast('🎉 End-to-End Pipeline simulation successfully completed!', 'success');
        return;
      }
      const item = sequence[step];
      state.activeInspectorNode = item.node;
      const container = el('page-content');
      if (container && state.currentView === 'pipeline') {
        renderPipelineFlowView(container);
      }
      showToast(item.msg, 'info');
      step++;
    }, 1400);
  }

  /* ------------------------------------------------------------------------
     VIEW 1: DASHBOARD
     ------------------------------------------------------------------------ */
  function renderDashboardView(container) {
    container.innerHTML = `
      <div class="grid-12">
        <div class="col-3">
          <div class="card stat-card">
            <span class="stat-label">Total Outreached</span>
            <span class="stat-value">1,420</span>
            <span class="stat-subtext positive">↑ 18% vs last campaign</span>
          </div>
        </div>
        <div class="col-3">
          <div class="card stat-card">
            <span class="stat-label">Positive Response</span>
            <span class="stat-value">31.4%</span>
            <span class="stat-subtext positive">↑ 10-Variation Engine Boost</span>
          </div>
        </div>
        <div class="col-3">
          <div class="card stat-card">
            <span class="stat-label">Pending Review</span>
            <span class="stat-value">3</span>
            <span class="stat-subtext">Requires human approval</span>
          </div>
        </div>
        <div class="col-3">
          <div class="card stat-card">
            <span class="stat-label">SendGrid API</span>
            <span class="stat-value" style="color: var(--color-status-success);">Optimal</span>
            <span class="stat-subtext">0 Bounces / 100% Health</span>
          </div>
        </div>

        <div class="col-8">
          <div class="card">
            <div class="section-header">
              <h3 class="section-title">Active Outreach Directory</h3>
              <a href="#/pipeline" class="btn btn-secondary btn-small">⚡ View Live Pipeline</a>
            </div>
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Faculty / Contact</th>
                    <th>Institution & Lab</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.contacts.map((c, i) => `
                    <tr>
                      <td style="display: flex; align-items: center; gap: 8px;">
                        ${renderAvatar(c.name, 'small')}
                        <div>
                          <strong>${c.name}</strong><br>
                          <span style="font-size: 11px; color: var(--color-neutral-500);">${c.email}</span>
                        </div>
                      </td>
                      <td>
                        <strong>${c.institution}</strong><br>
                        <span style="font-size: 11px; color: var(--color-neutral-600);">${c.department}</span>
                      </td>
                      <td>${renderBadge(c.status)}</td>
                      <td>
                        <div class="confidence-bar" title="${c.confidence}% AI Trace Confidence">
                          <div class="confidence-fill" style="width: ${c.confidence}%;"></div>
                        </div>
                      </td>
                      <td>
                        <button class="btn btn-tertiary btn-small inspect-lead-btn" data-index="${i}">Inspect</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="col-4">
          <div class="card" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="section-header">
              <h3 class="section-title">Automated Triggers</h3>
            </div>
            <p style="font-size: 12px; color: var(--color-neutral-600);">Execute background pipeline jobs manually or sync databases.</p>
            <button class="btn btn-primary" id="btn-trigger-outreach">🚀 Trigger Outreach Batch</button>
            <button class="btn btn-secondary" id="btn-trigger-followup">↻ Process Drip Follow-Ups</button>
            <button class="btn btn-secondary" id="btn-trigger-replies">↪ Ingest Inbound Replies</button>
            <button class="btn btn-tertiary" id="btn-trigger-sync">📊 Sync Airtable & Supabase</button>
          </div>
        </div>
      </div>
    `;

    queryAll('.inspect-lead-btn').forEach(btn => {
      btn.onclick = () => {
        state.selectedLeadIndex = parseInt(btn.getAttribute('data-index'), 10) || 0;
        window.location.hash = '#/pipeline';
      };
    });

    const btnOutreach = el('btn-trigger-outreach');
    if (btnOutreach) {
      btnOutreach.onclick = async () => {
        btnOutreach.innerHTML = '<span class="btn-spinner"></span> Running SendGrid Dispatch...';
        btnOutreach.disabled = true;
        try {
          const res = await fetch('/api/trigger/outreach', {
            method: 'POST',
            headers: { 'x-api-key': 'dev-key-123', 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          showToast(`Outreach batch completed: ${data.result?.processed || 1} emails dispatched.`, 'success');
        } catch (e) {
          showToast('Outreach batch successfully queued.', 'success');
        } finally {
          btnOutreach.innerHTML = '🚀 Trigger Outreach Batch';
          btnOutreach.disabled = false;
        }
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 2: IMPORT / EXTRACTION (Stage 1)
     ------------------------------------------------------------------------ */
  function renderImportView(container) {
    container.innerHTML = `
      <div class="grid-12">
        <div class="col-8">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 8px;">Upload Prospect Directory (CSV / Excel / PDF)</h3>
            <p style="color: var(--color-neutral-600); margin-bottom: 24px;">Extracts raw directory fields: Applicant, Director, Designation, Dept, Address, City, State, Pin, Email, Phone.</p>
            
            <div style="border: 2px dashed var(--color-neutral-300); border-radius: var(--radius-l); padding: 48px; text-align: center; background: var(--color-neutral-50); cursor: pointer;" id="drop-zone">
              <div style="font-size: 40px; margin-bottom: 12px;">📁</div>
              <p style="font-weight: 600; color: var(--color-neutral-900);">Drop CSV or Excel faculty directory here</p>
              <span style="font-size: 12px; color: var(--color-neutral-500);">Supports .csv, .xlsx, .pdf up to 25MB</span>
              <input type="file" id="file-input" style="display: none;" accept=".csv,.xlsx,.pdf">
            </div>

            <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
              <button class="btn btn-secondary" id="btn-sample-import">Load Sample Faculty CSV</button>
              <button class="btn btn-primary" id="btn-start-import">✨ Process File & Extract Columns</button>
            </div>
          </div>
        </div>

        <div class="col-4">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">Extracted Column Mapping</h3>
            <ul style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; list-style: none;">
              <li style="display: flex; justify-content: space-between;"><span>Applicant</span><span class="chip tone-success">Auto-Mapped</span></li>
              <li style="display: flex; justify-content: space-between;"><span>Director / Institution</span><span class="chip tone-success">Auto-Mapped</span></li>
              <li style="display: flex; justify-content: space-between;"><span>Designation</span><span class="chip tone-success">Auto-Mapped</span></li>
              <li style="display: flex; justify-content: space-between;"><span>College / Department</span><span class="chip tone-success">Auto-Mapped</span></li>
              <li style="display: flex; justify-content: space-between;"><span>Address & Pin</span><span class="chip tone-success">Auto-Mapped</span></li>
              <li style="display: flex; justify-content: space-between;"><span>Email & Phone</span><span class="chip tone-success">Auto-Mapped</span></li>
              <li style="display: flex; justify-content: space-between;"><span>Scraped Webpage</span><span class="chip tone-ai">AI Ingested</span></li>
            </ul>
          </div>
        </div>

        <div class="col-12">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">Live Extracted Dataset Preview</h3>
            <div class="table-container">
              <table class="table" style="font-size: 12px;">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Director / Contact</th>
                    <th>Designation</th>
                    <th>College / Department</th>
                    <th>City, State, Pin</th>
                    <th>Email / Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.contacts.map(c => `
                    <tr>
                      <td>${c.applicant}</td>
                      <td><strong>${c.director}</strong></td>
                      <td>${c.designation}</td>
                      <td>${c.department}, ${c.institution}</td>
                      <td>${c.city}, ${c.state} ${c.pin}</td>
                      <td>
                        <span class="evidence-source">${c.email}</span><br>
                        <span style="font-size: 11px; color: var(--color-neutral-500);">${c.phone}</span>
                      </td>
                      <td>${renderBadge(c.status)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    const dropZone = el('drop-zone');
    const fileInput = el('file-input');
    if (dropZone && fileInput) {
      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        if (e.target.files.length) {
          showToast(`File selected: ${e.target.files[0].name}`, 'info');
        }
      };
    }

    const btnSample = el('btn-sample-import');
    if (btnSample) {
      btnSample.onclick = () => {
        showToast('Sample dataset reloaded: 4 verified institutional leads.', 'success');
      };
    }

    const btnStart = el('btn-start-import');
    if (btnStart) {
      btnStart.onclick = () => {
        showToast('Column extraction completed. 9 attributes mapped.', 'success');
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 3: PROFILE CLEANING & DIRECTORY (Stage 2)
     ------------------------------------------------------------------------ */
  function renderPeopleView(container) {
    container.innerHTML = `
      <div class="card">
        <div class="section-header">
          <div>
            <h3 class="section-title">Academic Directory & Profile Cleaning</h3>
            <p style="font-size: 13px; color: var(--color-neutral-600);">Automated search engine verification and faculty publication crawler.</p>
          </div>
          <button class="btn btn-primary" id="btn-run-crawler">🕷 Run Profile Crawler</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Designation & Dept</th>
                <th>Official Webpage URL</th>
                <th>Scraped Publications</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${state.contacts.map((c, i) => `
                <tr>
                  <td style="display: flex; align-items: center; gap: 10px;">
                    ${renderAvatar(c.name, 'medium')}
                    <div>
                      <strong>${c.name}</strong><br>
                      <span style="font-size: 11px; color: var(--color-neutral-500);">${c.email}</span>
                    </div>
                  </td>
                  <td>
                    <strong>${c.designation}</strong><br>
                    <span style="font-size: 11px; color: var(--color-neutral-600);">${c.department} &bull; ${c.institution}</span>
                  </td>
                  <td>
                    <a href="${c.webpage}" target="_blank" style="color: var(--color-brand-primary); font-size: 12px; text-decoration: none;">
                      🔗 ${c.webpage.replace('https://', '')}
                    </a>
                  </td>
                  <td>
                    <span class="chip tone-ai">${c.scrapedPapers.length} Papers Scraped</span>
                  </td>
                  <td>
                    <span class="status-badge tone-success">✓ Verified</span>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-small view-research-btn" data-index="${i}">View Context →</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    queryAll('.view-research-btn').forEach(btn => {
      btn.onclick = () => {
        state.selectedLeadIndex = parseInt(btn.getAttribute('data-index'), 10) || 0;
        window.location.hash = '#/research';
      };
    });

    const btnCrawler = el('btn-run-crawler');
    if (btnCrawler) {
      btnCrawler.onclick = () => {
        btnCrawler.innerHTML = '<span class="btn-spinner"></span> Crawling faculty pages...';
        btnCrawler.disabled = true;
        setTimeout(() => {
          btnCrawler.innerHTML = '🕷 Run Profile Crawler';
          btnCrawler.disabled = false;
          showToast('Crawler refreshed: 4 faculty profiles verified with Google Scholar.', 'success');
        }, 1200);
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 4: CONTEXT INTERPRETATION & VISION HUB (Stage 3)
     ------------------------------------------------------------------------ */
  function renderResearchView(container) {
    const lead = state.contacts[state.selectedLeadIndex] || state.contacts[0];

    container.innerHTML = `
      <div class="card" style="margin-bottom: var(--spacing-l);">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${renderAvatar(lead.name, 'large')}
            <div>
              <h3 class="section-title">${lead.name} — Context & Vision Interpretation</h3>
              <p style="font-size: 13px; color: var(--color-neutral-600);">${lead.designation} at ${lead.institution} &bull; <span class="evidence-source">${lead.evidenceId}</span></p>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <select class="input-field" id="select-lead-context" style="width: auto; padding: 6px 12px;">
              ${state.contacts.map((c, idx) => `
                <option value="${idx}" ${state.selectedLeadIndex === idx ? 'selected' : ''}>${c.name} (${c.institution})</option>
              `).join('')}
            </select>
            <a href="#/personalization" class="btn btn-primary btn-small">Generate 10 Variations →</a>
          </div>
        </div>

        <div class="split-context-container" style="margin-top: 16px;">
          <!-- Left: Research Focus & Vision -->
          <div class="context-box research-focus">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--color-brand-primary);">🔬 Research Focus & Vision</h4>
              <span class="chip tone-info">Academic Trajectory</span>
            </div>
            <ul class="context-item-list">
              <li class="context-item">
                <span class="context-item-icon">🏢</span>
                <div><strong>Research Group / Lab:</strong><br>${lead.researchFocus.lab}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">🎯</span>
                <div><strong>Projects / Research Topics:</strong><br>${lead.researchFocus.topics.join(' • ')}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">⭐</span>
                <div><strong>Focus Areas & Priorities:</strong><br>${lead.researchFocus.priorities}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">🏆</span>
                <div><strong>Achievements:</strong><br>${lead.researchFocus.achievements}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">📄</span>
                <div><strong>Recent Papers:</strong><br>${lead.researchFocus.recentPaper}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">🚀</span>
                <div><strong>Future Direction & Potential Impact:</strong><br>${lead.researchFocus.futureImpact}</div>
              </li>
            </ul>
          </div>

          <!-- Right: Pain Points & Inefficiencies -->
          <div class="context-box pain-points">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h4 style="font-size: 15px; font-weight: 700; color: #b45309;">⚠️ Pain Points & Inefficiencies</h4>
              <span class="chip tone-warning">Identified Bottlenecks</span>
            </div>
            <ul class="context-item-list">
              <li class="context-item">
                <span class="context-item-icon">📉</span>
                <div><strong>Current Gaps:</strong><br>${lead.painPoints.currentGaps}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">🚧</span>
                <div><strong>Recent Challenges:</strong><br>${lead.painPoints.challenges}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">⏳</span>
                <div><strong>Inefficiencies / Bottlenecks:</strong><br>${lead.painPoints.bottlenecks}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">❓</span>
                <div><strong>Problem Statement:</strong><br>${lead.painPoints.problemStatement}</div>
              </li>
              <li class="context-item">
                <span class="context-item-icon">⚡</span>
                <div><strong>Why Existing Solutions Fall Short:</strong><br>${lead.painPoints.whySolutionsShort}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;

    const selectLead = el('select-lead-context');
    if (selectLead) {
      selectLead.onchange = (e) => {
        state.selectedLeadIndex = parseInt(e.target.value, 10);
        renderResearchView(container);
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 5: AI 10-VARIATION MATRIX STUDIO (Stage 4 & 5)
     ------------------------------------------------------------------------ */
  function renderPersonalizationView(container) {
    const lead = state.contacts[state.selectedLeadIndex] || state.contacts[0];
    const variant = lead.variations[state.selectedVariantTab] || lead.variations[0];

    container.innerHTML = `
      <div class="grid-12">
        <div class="col-4">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">AI Generation Controls</h3>
            
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Target Recipient</label>
              <select class="input-field" id="select-lead-ai">
                ${state.contacts.map((c, idx) => `
                  <option value="${idx}" ${state.selectedLeadIndex === idx ? 'selected' : ''}>${c.name} (${c.institution})</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Tone Balance (Formal Academic ↔ Direct Collaborative)</label>
              <input type="range" min="0" max="100" value="70" class="input-field" style="padding: 0;" id="tone-slider">
            </div>

            <div class="form-group" style="margin-bottom: 18px;">
              <label class="form-label">Custom Instruction Prompt</label>
              <textarea class="input-field" style="height: 80px;" placeholder="Emphasize simulation harness scaling to 50k nodes..."></textarea>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-bottom: 8px;" id="btn-generate-all-variants">
              ✨ Regenerate 10 Variations
            </button>
            <a href="#/review" class="btn btn-secondary" style="width: 100%; text-align: center; text-decoration: none;">
              Go to Review Queue →
            </a>
          </div>
        </div>

        <div class="col-8">
          <div class="card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Multi-Variant Email Resulting Matrix</h3>
                <p style="font-size: 12px; color: var(--color-neutral-600);">10 specialized outreach formulations based on research interpretation.</p>
              </div>
              <span class="status-badge tone-ai">10x Generated</span>
            </div>

            <!-- 10 Variations Tab Bar -->
            <div class="variation-nav-bar">
              ${lead.variations.map((v, idx) => `
                <button class="variation-tab ${state.selectedVariantTab === idx ? 'active' : ''}" data-vidx="${idx}">
                  ${v.title}
                </button>
              `).join('')}
            </div>

            <!-- Active Variant Editor -->
            <div class="variant-card-editor">
              <div class="variant-meta-strip">
                <div>
                  <span class="chip tone-ai">${variant.badge}</span>
                  <span style="margin-left: 8px; font-size: 12px;">Trace ID: <strong class="evidence-source">${lead.evidenceId}</strong></span>
                </div>
                <span class="chip tone-success">Confidence: ${lead.confidence}%</span>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Subject</label>
                <input class="input-field" id="variant-subject" value="${variant.subject}">
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Personalized Body Content</label>
                <textarea class="input-field" style="height: 200px; font-family: var(--font-sans); line-height: 1.6;" id="variant-body">${variant.body}</textarea>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; color: var(--color-neutral-500);">~145 words &bull; Est. read time: 35s</span>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-small" id="btn-copy-pitch">📋 Copy</button>
                  <button class="btn btn-primary btn-small" id="btn-save-variant">✓ Save Pitch</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const selectLead = el('select-lead-ai');
    if (selectLead) {
      selectLead.onchange = (e) => {
        state.selectedLeadIndex = parseInt(e.target.value, 10);
        state.selectedVariantTab = 0;
        renderPersonalizationView(container);
      };
    }

    queryAll('.variation-tab').forEach(tab => {
      tab.onclick = () => {
        state.selectedVariantTab = parseInt(tab.getAttribute('data-vidx'), 10) || 0;
        renderPersonalizationView(container);
      };
    });

    const btnGen = el('btn-generate-all-variants');
    if (btnGen) {
      btnGen.onclick = () => {
        btnGen.innerHTML = '<span class="btn-spinner"></span> Synthesizing 10 Variants...';
        btnGen.disabled = true;
        setTimeout(() => {
          btnGen.innerHTML = '✨ Regenerate 10 Variations';
          btnGen.disabled = false;
          showToast('10 New Variations synthesized successfully!', 'success');
        }, 1200);
      };
    }

    const btnSave = el('btn-save-variant');
    if (btnSave) {
      btnSave.onclick = () => {
        showToast('Pitch variation saved & locked for review queue.', 'success');
      };
    }

    const btnCopy = el('btn-copy-pitch');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const text = el('variant-body').value;
        navigator.clipboard?.writeText(text);
        showToast('Copied to clipboard!', 'info');
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 6: REVIEW QUEUE & HUMAN APPROVAL
     ------------------------------------------------------------------------ */
  function renderReviewView(container) {
    container.innerHTML = `
      <div class="card">
        <div class="section-header">
          <div>
            <h3 class="section-title">Human Control & Approval Queue</h3>
            <p style="font-size: 13px; color: var(--color-neutral-600);">Inspect multi-variant pitches, edit, approve, or schedule batch sending.</p>
          </div>
          <button class="btn btn-primary" id="btn-batch-approve">Approve & Queue All (3)</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${state.contacts.map((c, i) => `
            <div class="card flat" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                  ${renderAvatar(c.name, 'medium')}
                  <div>
                    <strong>${c.name}</strong> &bull; <span style="font-size: 12px; color: var(--color-neutral-600);">${c.designation} at ${c.institution}</span>
                  </div>
                  ${renderBadge(c.status)}
                  <span class="chip tone-ai">${c.variations[c.selectedVariationIndex || 0].badge}</span>
                </div>

                <div style="background: #ffffff; padding: 12px; border-radius: var(--radius-m); border: 1px solid var(--color-neutral-300); font-size: 13px; line-height: 1.5; color: var(--color-neutral-800);">
                  <strong>Subject:</strong> ${c.variations[c.selectedVariationIndex || 0].subject}<br><br>
                  ${c.variations[c.selectedVariationIndex || 0].body.split('\n')[0]}...
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
                <button class="btn btn-primary btn-small approve-single-btn" data-index="${i}">✓ Approve</button>
                <button class="btn btn-secondary btn-small edit-single-btn" data-index="${i}">✏ Edit Pitch</button>
                <button class="btn btn-destructive btn-small reject-single-btn" data-index="${i}">✕ Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    queryAll('.approve-single-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        state.contacts[idx].status = 'Approved';
        showToast(`Approved outreach for ${state.contacts[idx].name}!`, 'success');
        renderReviewView(container);
      };
    });

    queryAll('.reject-single-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        state.contacts[idx].status = 'Rejected';
        showToast(`Rejected draft for ${state.contacts[idx].name}`, 'error');
        renderReviewView(container);
      };
    });

    const btnBatch = el('btn-batch-approve');
    if (btnBatch) {
      btnBatch.onclick = () => {
        state.contacts.forEach(c => { if (c.status === 'Pending Review' || c.status === 'Ready') c.status = 'Approved'; });
        showToast('All drafts approved & scheduled for SendGrid dispatch!', 'success');
        renderReviewView(container);
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 7: OUTREACH LOGS & SENDGRID DISPATCH
     ------------------------------------------------------------------------ */
  function renderOutreachView(container) {
    container.innerHTML = `
      <div class="card">
        <div class="section-header">
          <div>
            <h3 class="section-title">SendGrid Outreach Delivery Timeline</h3>
            <p style="font-size: 13px; color: var(--color-neutral-600);">Real-time dispatch, open rates, click tracking, and bounce guardrails.</p>
          </div>
          <button class="btn btn-primary" id="btn-dispatch-now">✉ Dispatch Ready Queue</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Institution</th>
                <th>Delivery Status</th>
                <th>Outreach Step</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${state.contacts.map(c => `
                <tr>
                  <td><strong>${c.name}</strong><br><span style="font-size: 11px; color: var(--color-neutral-500);">${c.email}</span></td>
                  <td>${c.institution}</td>
                  <td>${renderBadge(c.outreachStatus || 'Delivered')}</td>
                  <td>Initial Pitch (Var ${c.selectedVariationIndex + 1})</td>
                  <td>Today, 10:14 AM</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const btnDispatch = el('btn-dispatch-now');
    if (btnDispatch) {
      btnDispatch.onclick = () => {
        showToast('SendGrid API dispatched 4 emails with 0 bounces.', 'success');
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 8: REPLIES & FOLLOW-UP DECISION TREE (Stage 7)
     ------------------------------------------------------------------------ */
  function renderRepliesView(container) {
    container.innerHTML = `
      <div class="grid-12">
        <div class="col-8">
          <div class="card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Inbound Replies & Sentiment Classifier</h3>
                <p style="font-size: 13px; color: var(--color-neutral-600);">Automated decision tree routing for positive replies vs drip sequences.</p>
              </div>
              <button class="btn btn-secondary btn-small" id="btn-refresh-inbox">↻ Check Mailbox</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${state.contacts.filter(c => c.reply && c.reply.received).map(c => `
                <div class="card flat" style="border-left: 4px solid ${c.reply.type === 'positive' ? 'var(--color-status-success)' : 'var(--color-status-warning)'};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${renderAvatar(c.name, 'small')}
                      <strong>${c.name} (${c.institution})</strong>
                    </div>
                    <span class="chip ${c.reply.type === 'positive' ? 'tone-success' : 'tone-warning'}">${c.reply.sentiment}</span>
                  </div>

                  <p style="font-size: 13px; color: var(--color-neutral-800); margin-bottom: 12px; background: #ffffff; padding: 10px; border-radius: var(--radius-m); border: 1px solid var(--color-neutral-200);">
                    ${c.reply.snippet}
                  </p>

                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                    <span style="color: var(--color-neutral-500);">Next Action: <strong>${c.reply.nextAction}</strong></span>
                    ${c.reply.type === 'positive' ? `
                      <button class="btn btn-primary btn-small reply-action-btn" data-name="${c.name}">📅 Confirm Meeting Slot</button>
                    ` : `
                      <button class="btn btn-secondary btn-small">Schedule Drip</button>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="col-4">
          <div class="card" style="margin-bottom: var(--spacing-l);">
            <h3 class="section-title" style="margin-bottom: 12px;">Decision Tree Rules</h3>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
              <div class="branch-step-box" style="background: #f0fdf4;">
                <strong style="color: var(--color-status-success);">Positive Intent (Interested / Demo):</strong>
                <span>Instant user notification, High-Value VIP mark, Meeting Link suggested.</span>
              </div>
              <div class="branch-step-box" style="background: #fff7ed;">
                <strong style="color: #ea580c;">Neutral / Out of Office / No Reply:</strong>
                <span>Follow-up 1 after 3 days, Follow-up 2 after 7 days, Auto-unsubscribe on request.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    queryAll('.reply-action-btn').forEach(btn => {
      btn.onclick = () => {
        const name = btn.getAttribute('data-name');
        openModal(`Confirm Meeting with ${name}`, `
          <p>Recommended Time Slot: <strong>Next Tuesday, 2:00 PM - 2:30 PM EST</strong></p>
          <div class="form-group" style="margin-top: 12px;">
            <label class="form-label">Calendar Link</label>
            <input class="input-field" value="https://cal.com/outreach/15min-intro" readonly>
          </div>
        `, () => {
          showToast(`Meeting invite dispatched to ${name}!`, 'success');
        });
      };
    });
  }

  /* ------------------------------------------------------------------------
     VIEW 9: CAMPAIGNS
     ------------------------------------------------------------------------ */
  function renderCampaignsView(container) {
    container.innerHTML = `
      <div class="card">
        <div class="section-header">
          <h3 class="section-title">Outreach Campaigns & Sequences</h3>
          <button class="btn btn-primary">+ Create New Campaign</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Total Leads</th>
                <th>Sent</th>
                <th>Open Rate</th>
                <th>Positive Replies</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.campaigns.map(camp => `
                <tr>
                  <td><strong>${camp.name}</strong></td>
                  <td>${camp.totalLeads}</td>
                  <td>${camp.sent}</td>
                  <td>${Math.round((camp.opened / (camp.sent || 1)) * 100)}%</td>
                  <td><span class="chip tone-success">${camp.positive} VIP Leads</span></td>
                  <td><span class="status-badge tone-${camp.status === 'Active' ? 'success' : 'neutral'}">${camp.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     VIEW 10: RATE LIMITER & BULK SEND
     ------------------------------------------------------------------------ */
  function renderBulkSendView(container) {
    container.innerHTML = `
      <div class="grid-12">
        <div class="col-8">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">Bulk Outreach Dispatcher & Safety Guardrails</h3>
            <p style="font-size: 13px; color: var(--color-neutral-600); margin-bottom: 24px;">
              System handles rate-limiting, sender warming, and atomic claim-locking automatically.
            </p>
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label">Batch Dispatch Size</label>
              <input class="input-field" type="number" value="25" min="1" max="100">
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Delay Between Sends (seconds)</label>
              <input class="input-field" type="number" value="45" min="10" max="300">
            </div>
            <button class="btn btn-primary btn-large" id="btn-launch-bulk">✉ Launch Safe Bulk Dispatch</button>
          </div>
        </div>

        <div class="col-4">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 12px;">Daily Rate Limits</h3>
            <div style="font-size: 28px; font-weight: 700; color: var(--color-neutral-900); margin-bottom: 4px;">
              89 / 200
            </div>
            <div class="confidence-bar" style="width: 100%; height: 8px; margin-bottom: 12px;">
              <div class="confidence-fill" style="width: 44.5%; background: var(--color-brand-primary);"></div>
            </div>
            <p style="font-size: 12px; color: var(--color-neutral-500);">SendGrid warm-up protect active. Next quota reset in 12h 18m.</p>
          </div>
        </div>
      </div>
    `;

    const btnLaunch = el('btn-launch-bulk');
    if (btnLaunch) {
      btnLaunch.onclick = () => {
        showToast('Bulk dispatch job queued with 45s stagger.', 'success');
      };
    }
  }

  /* ------------------------------------------------------------------------
     VIEW 11: SETTINGS
     ------------------------------------------------------------------------ */
  function renderSettingsView(container) {
    container.innerHTML = `
      <div class="grid-12">
        <div class="col-6">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">Integration Status</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>SendGrid / SMTP API</strong><br>
                  <span style="font-size: 12px; color: var(--color-neutral-500);">sender: outreach@college.edu</span>
                </div>
                <span class="status-badge tone-success">Connected</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>Supabase DB</strong><br>
                  <span style="font-size: 12px; color: var(--color-neutral-500);">PostgreSQL Connected</span>
                </div>
                <span class="status-badge tone-success">Connected</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>LLM Engine (DeepSeek / Claude)</strong><br>
                  <span style="font-size: 12px; color: var(--color-neutral-500);">10-Variation Pipeline Active</span>
                </div>
                <span class="status-badge tone-ai">✨ Active</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">API Key & Security</h3>
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label">System API Key</label>
              <input class="input-field" type="password" value="dev-key-123" readonly>
            </div>
            <button class="btn btn-secondary" onclick="navigator.clipboard?.writeText('dev-key-123'); showToast('API Key copied', 'info');">Copy Key</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     VIEW 12: DESIGN SYSTEM SHOWCASE
     ------------------------------------------------------------------------ */
  function renderDesignSystemView(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="card" style="background: var(--gradient-ai-subtle);">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Design Tokens & Foundations Catalog</h2>
          <p style="font-size: 14px; color: var(--color-neutral-700);">Figma Variables, 8px grid, typography hierarchy, and semantic tokens.</p>
        </div>

        <div class="card">
          <h3 class="section-title" style="margin-bottom: 16px;">Semantic Badges & Statuses</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${renderBadge('Ready')}
            ${renderBadge('Claimed')}
            ${renderBadge('Sending')}
            ${renderBadge('Sent')}
            ${renderBadge('Delivered')}
            ${renderBadge('Replied')}
            ${renderBadge('Follow-up 1')}
            ${renderBadge('Pending Review')}
            ${renderBadge('Approved')}
            ${renderBadge('Rejected')}
          </div>
        </div>
      </div>
    `;
  }

  function initSidebar() {
    const toggleBtn = el('sidebar-toggle');
    const sidebar = el('sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.onclick = () => {
        sidebar.classList.toggle('collapsed');
        state.collapsed = sidebar.classList.contains('collapsed');
        toggleBtn.querySelector('span').innerText = state.collapsed ? '›' : '‹';
      };
    }
  }

  function initHeaderActions() {
    const quickRunBtn = el('btn-quick-run');
    if (quickRunBtn) {
      quickRunBtn.onclick = () => {
        window.location.hash = '#/pipeline';
        setTimeout(() => runInteractiveSimulation(), 200);
      };
    }
  }

  // App bootstrap
  document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initHeaderActions();
    initRouter();
  });

})();
