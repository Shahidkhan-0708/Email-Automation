import { getSupabaseClient } from './client.js';
import { getProfile } from './profiles.js';
import { logger } from '../utils/logger.js';

export async function getEnrichmentSources() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('enrichment_sources')
    .select('*');

  if (error) {
    logger.error('Error getting enrichment sources:', { error: error.message });
    throw error;
  }

  return data;
}

export async function getEnrichmentResults(profileId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('enrichment_results')
    .select('*')
    .eq('profile_id', profileId)
    .order('confidence', { ascending: false });

  if (error) {
    logger.error('Error getting enrichment results:', { profileId, error: error.message });
    throw error;
  }

  return data || [];
}

export async function saveEnrichmentResult({ profileId, sourceId, sourceUrl, relationship, factValue, confidence, verified = false }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('enrichment_results')
    .insert({
      profile_id: profileId,
      source_id: sourceId,
      source_url: sourceUrl || null,
      relationship,
      fact_value: factValue,
      confidence: confidence != null ? Math.min(Math.max(confidence, 0), 1) : null,
      verified,
      extracted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error saving enrichment result:', { profileId, error: error.message });
    throw error;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Real enrichment sources (free, no API keys)
// ---------------------------------------------------------------------------
const OPENALEX_URL = 'https://api.openalex.org/works';
const DDG_URL = 'https://api.duckduckgo.com/';
const WIKIPEDIA_URL = 'https://en.wikipedia.org/w/api.php';

const MIN_CONFIDENCE = 0.5; // facts below this are dropped
const MAX_FACTS_PER_SOURCE = 5;

/** Fetch academic publications for a person from OpenAlex (free, no key). */
async function fetchAcademicFacts(profile) {
  const query = [profile.full_name, profile.organization].filter(Boolean).join(' ');
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    search: query,
    per_page: String(MAX_FACTS_PER_SOURCE),
    mailto: 'outreach@example.com', // polite per OpenAlex API guidelines
  });

  const res = await fetch(`${OPENALEX_URL}?${params}`);
  if (!res.ok) {
    logger.warn(`OpenAlex request failed (${res.status})`);
    return [];
  }

  const body = await res.json();
  const works = Array.isArray(body.results) ? body.results : [];

  return works
    .filter(w => (w.relevance_score ?? 0) >= MIN_CONFIDENCE)
    .map(w => {
      const title = w.title || w.display_name || 'Untitled publication';
      const year = w.publication_year || w.publication_date?.slice(0, 4) || null;
      const venue = w.primary_location?.source?.display_name || w.host_venue?.display_name || null;
      const doi = w.doi || null;
      const value = [year ? `(${year})` : null, title, venue ? `— ${venue}` : null]
        .filter(Boolean)
        .join(' ');
      return {
        relationship: 'publication',
        value,
        url: doi || w.id || null,
        confidence: Math.min(w.relevance_score ?? 0.6, 0.99),
      };
    })
    .slice(0, MAX_FACTS_PER_SOURCE);
}

/** Fetch a person's bio/context from Wikipedia (free, no key; reliable). */
async function fetchWikipediaFacts(profile) {
  const query = [profile.full_name, profile.organization].filter(Boolean).join(' ');
  if (!query.trim()) return [];

  // 1. Search for the best-matching article title
  const searchParams = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '1',
    format: 'json',
    origin: '*',
  });
  const searchRes = await fetch(`${WIKIPEDIA_URL}?${searchParams}`);
  if (!searchRes.ok) return [];
  const searchBody = await searchRes.json();
  const hit = searchBody?.query?.search?.[0];
  if (!hit?.title) return [];

  // 2. Fetch the intro extract of the matched article
  const extractParams = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    titles: hit.title,
    format: 'json',
    origin: '*',
  });
  const extractRes = await fetch(`${WIKIPEDIA_URL}?${extractParams}`);
  if (!extractRes.ok) return [];
  const extractBody = await extractRes.json();
  const page = Object.values(extractBody?.query?.pages || {})[0];
  if (!page?.extract) return [];

  return [{
    relationship: 'bio',
    value: page.extract.slice(0, 600),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
    confidence: 0.8,
  }];
}

/** Fetch news/mentions for a person from DuckDuckGo Instant Answer (free, no key; sparse). */
async function fetchNewsFacts(profile) {
  const query = [profile.full_name, profile.organization].filter(Boolean).join(' ');
  if (!query.trim()) return [];

  // Wikipedia is the more reliable source; fall back to DDG if no article exists.
  const wiki = await fetchWikipediaFacts(profile);
  if (wiki.length > 0) return wiki;

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
    skip_disambig: '1',
  });

  const res = await fetch(`${DDG_URL}?${params}`);
  if (!res.ok) {
    logger.warn(`DuckDuckGo request failed (${res.status})`);
    return [];
  }

  const body = await res.json();
  const topics = [
    ...(Array.isArray(body.RelatedTopics) ? body.RelatedTopics : []),
    ...(Array.isArray(body.Topics) ? body.Topics : []),
  ];

  const facts = [];
  for (const topic of topics) {
    if (!topic.Text) continue;
    facts.push({
      relationship: 'news',
      value: topic.Text,
      url: topic.FirstURL || null,
      confidence: 0.6, // DDG gives no score; conservative default
    });
    if (facts.length >= MAX_FACTS_PER_SOURCE) break;
  }
  return facts;
}

const FETCHERS = {
  academic: fetchAcademicFacts,
  company: fetchWikipediaFacts, // organization/institution context
  news: fetchNewsFacts, // person bio/mentions (Wikipedia, DDG fallback)
};

/**
 * LinkedIn enrichment — primary source when APIFY_TOKEN is set.
 * Scrapes profile + posts via Apify actors, converting to enrichment facts.
 * Falls back to legacy sources on failure.
 */
async function fetchLinkedInFacts(profile, contact) {
  const { config } = await import('../config/env.js');
  if (!config.apify?.token) return [];

  try {
    const { researchLinkedIn, linkedinProfileToFacts, linkedinPostsToFacts } = await import('../services/linkedin.service.js');
    const result = await researchLinkedIn(profile, contact);
    if (!result) return [];

    const facts = [
      ...linkedinProfileToFacts(result.profile, 0.9),
      ...linkedinPostsToFacts(result.posts, 0.9),
    ];

    // Persist the LinkedIn URL for future runs
    if (result.linkedinUrl) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('profiles')
          .update({ linkedin_url: result.linkedinUrl })
          .eq('id', profile.id);
      } catch {
        // Column may not exist yet — silent no-op
      }
    }

    return facts;
  } catch (err) {
    logger.warn('LinkedIn enrichment failed, falling back to legacy sources:', { error: err.message });
    return [];
  }
}

export async function enrichProfile(profileId) {
  const supabase = getSupabaseClient();
  const profile = await getProfile(profileId);
  const contact = profile.contact_id ? await (await import('../db/contacts.js')).getContactById(profile.contact_id) : null;
  const enrichmentResults = [];

  // ---- LinkedIn first (if token is set) ------------------------------------
  const linkedinFacts = await fetchLinkedInFacts(profile, contact);
  if (linkedinFacts.length > 0) {
    // LinkedIn succeeded — save facts and skip legacy sources
    const sourceId = 'linkedin';
    for (const fact of linkedinFacts) {
      try {
        const saved = await saveEnrichmentResult({
          profileId,
          sourceId,
          sourceUrl: fact.url,
          relationship: fact.relationship,
          factValue: fact.value,
          confidence: fact.confidence,
          verified: false,
        });
        enrichmentResults.push(saved);
      } catch (err) {
        logger.warn(`Could not save LinkedIn fact for profile ${profileId}:`, { error: err.message });
      }
    }
    logger.info(`Enrichment: ${linkedinFacts.length} facts for profile ${profileId} from LinkedIn`);
    return enrichmentResults;
  }

  // ---- Legacy fallback: OpenAlex, Wikipedia, DuckDuckGo -------------------
  const { data: sources, error: srcErr } = await supabase
    .from('enrichment_sources')
    .select('*')
    .eq('is_enabled', true);

  if (srcErr) {
    logger.error('Error listing enrichment sources:', { error: srcErr.message });
    throw srcErr;
  }

  for (const source of sources || []) {
    const fetcher = FETCHERS[source.type];
    if (!fetcher) continue; // 'manual' and untyped sources are entered by hand

    try {
      const facts = await fetcher(profile);
      for (const fact of facts) {
        const saved = await saveEnrichmentResult({
          profileId,
          sourceId: source.id,
          sourceUrl: fact.url,
          relationship: fact.relationship,
          factValue: fact.value,
          confidence: fact.confidence,
          verified: false, // from third-party APIs; human review can verify
        });
        enrichmentResults.push(saved);
      }
      logger.info(`Enrichment: ${facts.length} facts for profile ${profileId} from source ${source.id}`);
    } catch (err) {
      logger.warn(`Enrichment failed for source ${source.id}:`, { error: err.message });
    }
  }

  return enrichmentResults;
}
