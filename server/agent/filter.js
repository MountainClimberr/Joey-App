const signals = [
	{
		category: 'self_harm',
		severity: 'urgent',
		reason: 'immediate_self_harm_risk',
		patterns: [
			/\b(?:i|we)\s+(?:am|['’]m|will|might|may|could|plan to|want to|going to)\s+(?:kill|hurt|harm)\s+(?:myself|ourselves)\b/i,
			/\b(?:i|we)\s+(?:am|['’]m)\s+(?:thinking|considering)\s+(?:about\s+)?(?:killing|hurting|harming)\s+(?:myself|ourselves)\b/i,
			/\b(?:i|we)\s+(?:want to|wish i could|would rather)\s+(?:die|not wake up)\b/i,
			/\b(?:i|we)\s+(?:don['’]t want to|do not want to|can['’]t bear to|cannot bear to)\s+(?:be alive|live anymore)\b/i,
			/\b(?:i|we)\s+(?:plan to|am|['’]m|might|will)\s+end\s+my life\b/i,
			/\b(?:i|we)\s+(?:can['’]t|cannot|don['’]t think i can)\s+keep\s+(?:myself|ourselves)\s+safe\b/i,
		],
	},
	{
		category: 'self_harm',
		severity: 'high',
		reason: 'self_harm_disclosure',
		patterns: [
			/\b(?:i|we)\s+(?:(?:have|had) been\s+|am\s+|was\s+|tried to\s+|attempted to\s+)?(?:self[- ]harming|self[- ]harm|suicidal|attempted suicide)\b/i,
			/\b(?:i|we)\s+(?:cut|hurt|harmed|overdosed)\s+(?:myself|ourselves)\b/i,
			/\b(?:my|our)\s+(?:friend|child|partner|family member)\s+(?:is|was|has been)\s+(?:suicidal|self[- ]harming|trying to hurt themself)\b/i,
		],
	},
	{
		category: 'abuse',
		severity: 'urgent',
		reason: 'immediate_abuse_or_danger',
		patterns: [
			/\b(?:i|we)\s+(?:am|['’]m|feel)\s+not safe\b/i,
			/\b(?:someone|he|she|they)\s+(?:is|are|was|were)\s+(?:hitting|hurting|attacking|threatening|forcing)\s+(?:me|us)\b/i,
			/\b(?:my|our)\s+(?:partner|parent|father|mother|dad|mom|caregiver|family member|husband|wife|boyfriend|girlfriend)\s+(?:is|are)\s+(?:hitting|hurting|threatening|forcing)\s+(?:me|us)\b/i,
		],
	},
	{
		category: 'abuse',
		severity: 'high',
		reason: 'abuse_disclosure',
		patterns: [
			/\b(?:i|we)\s+(?:am|['’]m|have been|was|were)\s+(?:being\s+)?(?:abused|assaulted|hit|hurt|threatened|forced)\b/i,
			/\b(?:my|our)\s+(?:partner|parent|father|mother|dad|mom|caregiver|boss|child|friend|family member|husband|wife|boyfriend|girlfriend)\s+(?:hits|hit|hurts|hurt|abuses|abused|assaults|assaulted|threatens|threatened|forces|forced)\s+(?:me|us|them)\b/i,
			/\b(?:i|we)\s+(?:was|were|have been|am)\s+(?:sexually\s+)?(?:abused|assaulted)\b/i,
			/\b(?:my|our)\s+(?:child|friend|partner|family member)\s+(?:is being|was|has been)\s+(?:abused|assaulted)\b/i,
		],
	},
]

const noEscalation = Object.freeze({
	flagged: false,
	category: null,
	severity: 'none',
	reason: null,
})

/** Inspect one incoming message and return its highest-priority safety signal. */
export function filterEscalation(message) {
	if (typeof message !== 'string' || !message.trim()) return noEscalation

	for (const signal of signals) {
		if (signal.patterns.some((pattern) => pattern.test(message))) {
			return {
				flagged: true,
				category: signal.category,
				severity: signal.severity,
				reason: signal.reason,
			}
		}
	}

	return noEscalation
}
