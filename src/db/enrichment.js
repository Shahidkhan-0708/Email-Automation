import { getSupabaseClient } from './client.js';
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

export async function enrichProfile(profileId) {
  const supabase = getSupabaseClient();
  const enrichmentResults = [];

  // Get all enabled enrichment sources
  const sources = await supabase
    .from('enrichment_sources')
    .select('*')
    .eq('is_enabled', true);

  // For each source, fetch enrichment data
  for (const source of sources.data || []) {
    try {
      // This would integrate with external APIs
      // For MVP, we'll simulate enrichment data based on profile
      const enrichmentData = await fetchEnrichmentData(profileId, source.id);

      for (const fact of enrichmentData || []) {
        // Save to enrichment_results
        await supabase
          .from('enrichment_results')
          .upsert({
            profile_id: profileId,
            source_id: source.id,
            source_url: fact.url,
            relationship: fact.relationship,
            fact_value: fact.value.toString(),
            confidence: fact.confidence,
            verified: true
          });

        enrichmentResults.push({
          id: fact.id,
          profile_id: profileId,
          source_id: source.id,
          source_url: fact.url,
          relationship: fact.relationship,
          fact_value: fact.value.toString(),
          confidence: fact.confidence,
          verified: true
        });
      }
    } catch (err) {
      logger.warn(`Enrichment failed for source ${source.id}:`, { error: err.message });
    }
  }

  return enrichmentResults;
}

async function fetchEnrichmentData(profileId, sourceId) {
  // Mock implementation for MVP
  // In real implementation, this would call external APIs

  // For marketing profiles, we might look up academic profiles, company affiliations, etc.
  // For MVP, we'll return mock data or allow manual enrichment

  return []; // Empty for now - will be populated manually or via UI
}