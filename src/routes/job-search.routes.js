import express from 'express';
import multer from 'multer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { requireAuth } from '../middleware/supabase-auth.js';
import { requireModule } from '../middleware/rbac.js';
import { getSupabaseClient } from '../db/client.js';
import { logger } from '../utils/logger.js';

export const jobSearchRouter = express.Router();

// All job-search routes require auth + the 'job_search' module
jobSearchRouter.use(requireAuth);
jobSearchRouter.use(requireModule('job_search'));

// In-memory multer for resume uploads (max 5 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.doc', '.docx', '.md'];
    const ext = (file.originalname || '').toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
  },
});

function fail(res, err, label) {
  logger.error(`${label}:`, { error: err.message });
  res.status(500).json({ error: err.message });
}

// ---------------------------------------------------------------------------
// Job Discovery
// ---------------------------------------------------------------------------

// GET /api/jobs — list discovered jobs for the authenticated user
jobSearchRouter.get('/jobs', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const status = req.query.status || null;

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, jobs: data || [] });
  } catch (err) {
    fail(res, err, 'Error listing jobs');
  }
});

// POST /api/jobs — save a discovered job
jobSearchRouter.post('/jobs', async (req, res) => {
  try {
    const { title, company, location, url, description, salary_range, source } = req.body;
    if (!title || !company) {
      return res.status(400).json({ error: 'Title and company are required.' });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: req.user.id,
        title,
        company,
        location: location || null,
        url: url || null,
        description: description || null,
        salary_range: salary_range || null,
        source: source || null,
        status: 'discovered',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, job: data });
  } catch (err) {
    fail(res, err, 'Error saving job');
  }
});

// GET /api/jobs/:id — get a single job
jobSearchRouter.get('/jobs/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Job not found.' });
    res.json({ success: true, job: data });
  } catch (err) {
    fail(res, err, 'Error fetching job');
  }
});

// PATCH /api/jobs/:id — update job
jobSearchRouter.patch('/jobs/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const updates = { ...req.body };
    delete updates.id;
    delete updates.user_id;

    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, job: data });
  } catch (err) {
    fail(res, err, 'Error updating job');
  }
});

// DELETE /api/jobs/:id — remove a job
jobSearchRouter.delete('/jobs/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'Error deleting job');
  }
});

// ---------------------------------------------------------------------------
// Job Research — company intelligence via Wikipedia + DDG
// ---------------------------------------------------------------------------

async function fetchWikipediaSummary(query) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'JobSearchBot/1.0 (College Outreach System)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      title: data.title,
      summary: data.extract || null,
      url: data.content_urls?.desktop?.page || null,
      thumbnail: data.thumbnail?.source || null,
    };
  } catch {
    return null;
  }
}

async function fetchDDGInstantAnswer(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    const results = [];
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        summary: data.AbstractText,
        url: data.AbstractURL || null,
        source: 'DuckDuckGo',
      });
    }
    // Also grab related topics
    for (const topic of (data.RelatedTopics || []).slice(0, 3)) {
      if (topic.Text) {
        results.push({
          title: topic.Text.slice(0, 100),
          summary: topic.Text,
          url: topic.FirstURL || null,
          source: 'DuckDuckGo',
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// POST /api/jobs/:id/research — fetch company research for a job
jobSearchRouter.post('/jobs/:id/research', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: job, error: jErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (jErr || !job) return res.status(404).json({ error: 'Job not found.' });

    // Custom focus: user-supplied topics to research (comma-separated or free-form)
    const { focus } = req.body;
    const focusTopics = focus
      ? focus.split(',').map((f) => f.trim()).filter(Boolean)
      : [];

    // Wikipedia needs the exact article title — "Google" works, "Amazon" resolves to the river.
    // Try the bare name first; if it looks like a disambiguation page, retry with "(company)".
    let companyQuery = job.company;
    const firstTry = await fetchWikipediaSummary(companyQuery);
    let wikiCompany = firstTry;
    if (firstTry?.summary && (firstTry.summary.includes('most often refers') || firstTry.summary.includes('may refer to'))) {
      companyQuery = `${job.company} (company)`;
      wikiCompany = await fetchWikipediaSummary(companyQuery);
    }

    // When custom focus is provided, use OpenAI to research those specific topics.
    // Otherwise fall back to DuckDuckGo for general company intel.
    let aiFacts = [];
    let ddgResults = [];

    if (focusTopics.length > 0) {
      // Use OpenAI to generate focused research
      const topicsList = focusTopics.map((t) => `- ${t}`).join('\n');
      const aiPrompt = `You are a research analyst. Research the company "${job.company}" for a "${job.title}" role.

Research these specific topics:
${topicsList}

For each topic, provide a factual, specific finding. Use your knowledge of the company.
Return JSON array with objects having "title", "summary", and "url" (null if not applicable) fields.
Return ONLY the JSON array, no markdown.`;
      try {
        const aiResponse = await callOpenAI(aiPrompt);
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiFacts = parsed.map((f) => ({
            source: 'AI Research',
            type: 'custom_research',
            title: f.title || 'Untitled',
            summary: f.summary || '',
            url: f.url || null,
          }));
        }
      } catch (aiErr) {
        logger.warn('AI research failed, falling back to DuckDuckGo:', { error: aiErr.message });
        // Fall back to DDG
        const ddgPromises = focusTopics.map((t) => fetchDDGInstantAnswer(`${job.company} ${t}`));
        ddgResults = (await Promise.all(ddgPromises)).flat();
      }
    } else {
      // Default: DuckDuckGo for general company intel
      const ddgPromises = [
        fetchDDGInstantAnswer(`${job.company} company overview`),
        fetchDDGInstantAnswer(`${job.title} at ${job.company} role`),
      ];
      ddgResults = (await Promise.all(ddgPromises)).flat();
    }

    const [wikiRole] = await Promise.all([
      fetchWikipediaSummary(`${job.title} role`),
    ]);

    const facts = [];

    if (wikiCompany?.summary) {
      facts.push({
        source: 'Wikipedia',
        type: 'company_overview',
        title: wikiCompany.title,
        summary: wikiCompany.summary,
        url: wikiCompany.url,
      });
    }

    if (wikiRole?.summary && wikiRole.title !== wikiCompany?.title) {
      facts.push({
        source: 'Wikipedia',
        type: 'role_context',
        title: wikiRole.title,
        summary: wikiRole.summary,
        url: wikiRole.url,
      });
    }

    // Add AI research results (custom focus topics)
    for (const f of aiFacts) {
      facts.push(f);
    }

    // Add DuckDuckGo results
    for (const r of ddgResults) {
      facts.push({
        source: r.source || 'DuckDuckGo',
        type: 'company_intel',
        title: r.title,
        summary: r.summary,
        url: r.url,
      });
    }

    // Save research results to the job's notes field (append)
    const researchNote = facts.map(f => `[${f.source}] ${f.title}: ${f.summary?.slice(0, 300)}`).join('\n\n');
    const existingNotes = job.notes || '';
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n--- Research (${new Date().toISOString()}) ---\n${researchNote}`
      : `--- Research (${new Date().toISOString()}) ---\n${researchNote}`;

    await supabase
      .from('jobs')
      .update({ notes: updatedNotes })
      .eq('id', job.id);

    logger.info(`Job research: ${facts.length} facts for job ${job.id} (${job.company})`);
    res.json({ success: true, job: { ...job, notes: updatedNotes }, facts });
  } catch (err) {
    fail(res, err, 'Error researching job');
  }
});

// ---------------------------------------------------------------------------
// Resumes — upload, list, delete
// ---------------------------------------------------------------------------

// POST /api/resumes/upload — upload a resume file
jobSearchRouter.post('/resumes/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const supabase = getSupabaseClient();
    const ext = (req.file.originalname || '').toLowerCase().slice(req.file.originalname.lastIndexOf('.'));

    // Extract text content from the file
    let content = null;
    if (ext === '.txt' || ext === '.md') {
      content = req.file.buffer.toString('utf-8');
    } else if (ext === '.pdf') {
      try {
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(req.file.buffer) }).promise;
        const pageTexts = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const textContent = await page.getTextContent();
          const lines = [];
          let currentLine = [];
          let lastY = null;
          for (const item of textContent.items || []) {
            const y = item.transform ? item.transform[5] : (lastY ?? 0);
            if (lastY !== null && Math.abs(y - lastY) > 2 && currentLine.length > 0) {
              lines.push(currentLine.join(' '));
              currentLine = [];
            }
            currentLine.push(item.str);
            lastY = y;
          }
          if (currentLine.length > 0) lines.push(currentLine.join(' '));
          const text = lines.map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
          if (text) pageTexts.push(text);
          page.cleanup();
        }
        content = pageTexts.join('\n\n');
        logger.info(`PDF resume text extracted: ${content.length} chars from ${doc.numPages} pages`);
      } catch (pdfErr) {
        logger.warn(`PDF text extraction failed for resume: ${pdfErr.message}`);
        // Store null content — AI match will use filename metadata instead
      }
    }

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: req.user.id,
        filename: req.file.originalname,
        content,
        file_type: ext.replace('.', ''),
        file_size: req.file.size,
        raw_bytes: req.file.buffer,
      })
      .select('id, filename, file_type, file_size, created_at')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, resume: data });
  } catch (err) {
    fail(res, err, 'Error uploading resume');
  }
});

// GET /api/resumes — list user's resumes
jobSearchRouter.get('/resumes', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('resumes')
      .select('id, filename, file_type, file_size, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, resumes: data || [] });
  } catch (err) {
    fail(res, err, 'Error listing resumes');
  }
});

// DELETE /api/resumes/:id — delete a resume
jobSearchRouter.delete('/resumes/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'Error deleting resume');
  }
});

// ---------------------------------------------------------------------------
// Resume Match — AI analysis of resume vs job description
// ---------------------------------------------------------------------------

async function callOpenAI(prompt) {
  const { config } = await import('../config/env.js');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.ai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`OpenAI API error ${resp.status}: ${errBody}`);
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || '';
}

// POST /api/jobs/:id/match — AI resume match analysis
jobSearchRouter.post('/jobs/:id/match', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { resume_id } = req.body;

    const { data: job, error: jErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (jErr || !job) return res.status(404).json({ error: 'Job not found.' });

    // Fetch resume content
    const resumeQuery = resume_id
      ? supabase.from('resumes').select('*').eq('id', resume_id).eq('user_id', req.user.id).single()
      : supabase.from('resumes').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(1).single();

    const { data: resume, error: rErr } = await resumeQuery;
    if (rErr || !resume) return res.status(400).json({ error: 'No resume found. Upload a resume first.' });

    const resumeText = resume.content || `[${resume.filename} — ${resume.file_type?.toUpperCase()} file, ${resume.file_size} bytes]`;

    const prompt = `You are a career advisor AI. Analyze how well this resume matches the job description.

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Description: ${job.description || 'No description provided'}

RESUME (${resume.filename}):
${resumeText.slice(0, 4000)}

Provide your analysis as JSON with these fields:
{
  "matchScore": <0-100>,
  "strengths": ["<strength1>", "<strength2>", ...],
  "gaps": ["<gap1>", "<gap2>", ...],
  "suggestions": ["<suggestion1>", "<suggestion2>", ...],
  "summary": "<one paragraph overall assessment>"
}`;

    const aiResponse = await callOpenAI(prompt);

    // Try to parse JSON from the response
    let analysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: aiResponse, matchScore: 0, strengths: [], gaps: [], suggestions: [] };
    } catch {
      analysis = { summary: aiResponse, matchScore: 0, strengths: [], gaps: [], suggestions: [] };
    }

    logger.info(`Resume match: job=${job.id}, score=${analysis.matchScore}`);
    res.json({ success: true, analysis, job: { id: job.id, title: job.title, company: job.company }, resume: { id: resume.id, filename: resume.filename } });
  } catch (err) {
    fail(res, err, 'Error matching resume');
  }
});

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

// GET /api/applications — list applications for the authenticated user
jobSearchRouter.get('/applications', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs(*)')
      .eq('user_id', req.user.id)
      .order('applied_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, applications: data || [] });
  } catch (err) {
    fail(res, err, 'Error listing applications');
  }
});

// POST /api/applications — record an application
jobSearchRouter.post('/applications', async (req, res) => {
  try {
    const { job_id, resume_version, cover_letter, notes } = req.body;
    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required.' });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: req.user.id,
        job_id,
        resume_version: resume_version || null,
        cover_letter: cover_letter || null,
        notes: notes || null,
        status: 'applied',
        applied_at: new Date().toISOString(),
      })
      .select('*, jobs(*)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, application: data });
  } catch (err) {
    fail(res, err, 'Error recording application');
  }
});

// PATCH /api/applications/:id — update application status
jobSearchRouter.patch('/applications/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const updates = { ...req.body };
    delete updates.id;
    delete updates.user_id;

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*, jobs(*)')
      .single();

    if (error) throw error;
    res.json({ success: true, application: data });
  } catch (err) {
    fail(res, err, 'Error updating application');
  }
});

// ---------------------------------------------------------------------------
// Recruiter Outreach
// ---------------------------------------------------------------------------

// GET /api/recruiter-outreach — list recruiter outreach for this user
jobSearchRouter.get('/recruiter-outreach', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const { data, error } = await supabase
      .from('recruiter_outreach')
      .select('*, jobs(title, company)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, outreach: data || [] });
  } catch (err) {
    fail(res, err, 'Error listing recruiter outreach');
  }
});

// POST /api/recruiter-outreach — create a recruiter outreach record
jobSearchRouter.post('/recruiter-outreach', async (req, res) => {
  try {
    const { recruiter_name, recruiter_email, company, linkedin_url, message, job_id } = req.body;
    if (!recruiter_name || !recruiter_email) {
      return res.status(400).json({ error: 'Recruiter name and email are required.' });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('recruiter_outreach')
      .insert({
        user_id: req.user.id,
        job_id: job_id || null,
        recruiter_name,
        recruiter_email,
        company: company || null,
        linkedin_url: linkedin_url || null,
        message: message || null,
        status: 'draft',
      })
      .select('*, jobs(title, company)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, outreach: data });
  } catch (err) {
    fail(res, err, 'Error creating recruiter outreach');
  }
});

// PATCH /api/recruiter-outreach/:id — update recruiter outreach
jobSearchRouter.patch('/recruiter-outreach/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const updates = { ...req.body };
    delete updates.id;
    delete updates.user_id;

    const { data, error } = await supabase
      .from('recruiter_outreach')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*, jobs(title, company)')
      .single();

    if (error) throw error;
    res.json({ success: true, outreach: data });
  } catch (err) {
    fail(res, err, 'Error updating recruiter outreach');
  }
});

// DELETE /api/recruiter-outreach/:id — delete recruiter outreach
jobSearchRouter.delete('/recruiter-outreach/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('recruiter_outreach')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'Error deleting recruiter outreach');
  }
});

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

// GET /api/follow-ups — pending follow-ups for this user's applications
jobSearchRouter.get('/follow-ups', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs(*)')
      .eq('user_id', req.user.id)
      .not('next_follow_up', 'is', null)
      .lte('next_follow_up', new Date().toISOString())
      .order('next_follow_up', { ascending: true });

    if (error) throw error;
    res.json({ success: true, followUps: data || [] });
  } catch (err) {
    fail(res, err, 'Error listing follow-ups');
  }
});

// ---------------------------------------------------------------------------
// Job Tracking (stats / funnel / timeline)
// ---------------------------------------------------------------------------

// GET /api/job-stats — aggregate stats for the job search dashboard
jobSearchRouter.get('/job-stats', async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data: jobs, error: jErr } = await supabase
      .from('jobs')
      .select('status')
      .eq('user_id', req.user.id);
    if (jErr) throw jErr;

    const byStatus = {};
    for (const j of jobs || []) {
      byStatus[j.status] = (byStatus[j.status] || 0) + 1;
    }

    const { count: appCount, error: aErr } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    if (aErr) throw aErr;

    const { count: interviewCount, error: iErr } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('status', 'interview');
    if (iErr) throw iErr;

    const { count: offerCount, error: oErr } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('status', 'offered');
    if (oErr) throw oErr;

    const { count: recruiterCount, error: rErr } = await supabase
      .from('recruiter_outreach')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    if (rErr) throw rErr;

    res.json({
      success: true,
      stats: {
        totalJobs: (jobs || []).length,
        byStatus,
        totalApplications: appCount || 0,
        interviews: interviewCount || 0,
        offers: offerCount || 0,
        recruiterOutreach: recruiterCount || 0,
      },
    });
  } catch (err) {
    fail(res, err, 'Error getting job stats');
  }
});

// GET /api/job-timeline — timeline of job search activity
jobSearchRouter.get('/job-timeline', async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get recent jobs with timestamps
    const { data: jobs, error: jErr } = await supabase
      .from('jobs')
      .select('id, title, company, status, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })
      .limit(20);
    if (jErr) throw jErr;

    // Get recent applications
    const { data: apps, error: aErr } = await supabase
      .from('applications')
      .select('id, status, applied_at, next_follow_up, jobs(title, company)')
      .eq('user_id', req.user.id)
      .order('applied_at', { ascending: false })
      .limit(20);
    if (aErr) throw aErr;

    // Build timeline events
    const events = [];

    for (const job of jobs || []) {
      events.push({
        type: 'job',
        date: job.created_at,
        title: `${job.title} @ ${job.company}`,
        detail: `Status: ${job.status}`,
        jobId: job.id,
      });
      if (job.updated_at !== job.created_at) {
        events.push({
          type: 'job_update',
          date: job.updated_at,
          title: `${job.title} @ ${job.company}`,
          detail: `Updated to: ${job.status}`,
          jobId: job.id,
        });
      }
    }

    for (const app of apps || []) {
      events.push({
        type: 'application',
        date: app.applied_at,
        title: `Applied to ${app.jobs?.title || 'Unknown'} @ ${app.jobs?.company || ''}`,
        detail: `Status: ${app.status}`,
      });
      if (app.next_follow_up) {
        events.push({
          type: 'follow_up',
          date: app.next_follow_up,
          title: `Follow-up: ${app.jobs?.title || 'Unknown'} @ ${app.jobs?.company || ''}`,
          detail: 'Follow-up scheduled',
        });
      }
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ success: true, events: events.slice(0, 50) });
  } catch (err) {
    fail(res, err, 'Error building timeline');
  }
});

// ---------------------------------------------------------------------------
// Cover Letter Personalization — AI-generated cover letters
// ---------------------------------------------------------------------------

// POST /api/jobs/:id/personalize — generate a cover letter for a job
jobSearchRouter.post('/jobs/:id/personalize', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { resume_id, tone } = req.body;

    const { data: job, error: jErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (jErr || !job) return res.status(404).json({ error: 'Job not found.' });

    // Fetch resume
    const resumeQuery = resume_id
      ? supabase.from('resumes').select('*').eq('id', resume_id).eq('user_id', req.user.id).single()
      : supabase.from('resumes').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(1).single();

    const { data: resume, error: rErr } = await resumeQuery;
    if (rErr || !resume) return res.status(400).json({ error: 'No resume found. Upload a resume first.' });

    const resumeText = resume.content || `[Resume: ${resume.filename}]`;
    const toneHint = tone ? `Tone: ${tone}.` : 'Tone: professional and enthusiastic.';

    const prompt = `You are an expert career writer. Write a compelling cover letter for this job application.

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Description: ${job.description || 'No description provided'}

APPLICANT RESUME:
${resumeText.slice(0, 4000)}

${toneHint}

Write a cover letter with:
1. A strong opening paragraph that shows genuine interest in the specific role and company
2. A body that connects the applicant's experience to the job requirements (use specific examples)
3. A closing paragraph with a clear call to action

Keep it to 3-4 paragraphs. Do NOT use placeholder text like [Your Name] or [Company Name].
Output ONLY the cover letter text, no markdown formatting or labels.`;

    const coverLetter = await callOpenAI(prompt);

    logger.info(`Cover letter generated: job=${job.id}, resume=${resume.id}`);
    res.json({
      success: true,
      coverLetter: coverLetter.trim(),
      job: { id: job.id, title: job.title, company: job.company },
      resume: { id: resume.id, filename: resume.filename },
    });
  } catch (err) {
    fail(res, err, 'Error generating cover letter');
  }
});
