const signals = [
  // Urgent
	{
		category: 'self_harm',
		severity: 'urgent',
		reason: 'immediate_self_harm_risk',
		patterns: [
			/\b(?:i|we)\s+(?:am|['’]m|will|might|may|could|plan to|want to|going to)\s+(?:kill|hurt|harm)\s+(?:myself|ourselves)\b/i,
			/\b(?:i|we)\s+(?:am|['’]m)\s+(?:thinking|considering)\s+(?:about\s+)?(?:killing|hurting|harming)\s+(?:myself|ourselves)\b/i,
			/\b(?:i|we)\s+(?:want to|wish i could|would rather)\s+(?:die|not wake up)\b/i,
			/\b(?:i|we)\s+(?:don['’]t want to|do not want to|can['’]t bear to|cannot bear to)\s+(?:be alive|live anymore)\b/i,
			/\b(?:i|we)\s+(?:plan to|am|might|will|am going to)\s+end\s+(?:my life|it all)\b/,
      /\bkill myself\b/,
			/\b(?:i|we)\s+(?:can['’]t|cannot|don['’]t think i can)\s+keep\s+(?:myself|ourselves)\s+safe\b/i,
		],
	},
  {
		category: 'violence_to_others',
		severity: 'urgent',
		reason: 'threat_to_others',
		patterns: [
			/\b(?:i|we)\s+(?:am|will|might|want to|going to|gonna|am going to)\s+(?:kill|hurt|shoot|stab|attack|beat up)\s+(?:him|her|them|someone|my\s+(?:boss|manager|coworker|co worker|supervisor|team))\b/,
			/\bbring(?:ing)?\s+(?:a|my)\s+(?:gun|knife|weapon)\s+(?:to work|to the office|in)\b/,
		],
	},
  {
		category: 'abuse',
		severity: 'urgent',
		reason: 'immediate_abuse_or_danger',
		patterns: [
			/\b(?:i|we)\s+(?:am|feel)\s+not safe\b/,
			/\b(?:someone|he|she|they)\s+(?:is|are)\s+(?:hitting|hurting|attacking|threatening|forcing)\s+(?:me|us)\b/,
			/\b(?:my|our)\s+(?:partner|parent|father|mother|dad|mom|caregiver|family member|husband|wife|boyfriend|girlfriend|coworker|co worker|boss|manager|supervisor)\s+(?:is|are)\s+(?:hitting|hurting|threatening|forcing)\s+(?:me|us)\b/,
		],
	},

  // High
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
		category: 'harassment',
		severity: 'high',
		reason: 'workplace_harassment',
		patterns: [
			/\bharass(?:ed|es|ing|ment)?\b/,
			/\b(?:keeps?|kept|has been|was|is)\s+(?:touching|grabbing|groping)\s+me\b/,
			/\b(?:touched|grabbed|groped)\s+me\b/,
			/\bsexual\s+(?:comments?|advances?|jokes?|remarks?)\b/,
			/\b(?:my|a|our)\s+(?:coworker|co worker|boss|manager|supervisor)\s+(?:is|keeps?|has been)\s+(?:threatening|intimidating|bullying|stalking)\s+me\b/,
		],
	},
	{
		category: 'discrimination',
		severity: 'high',
		reason: 'workplace_discrimination',
		patterns: [
			/\bdiscriminat(?:e|ed|es|ing|ion)\b/,
			/\b(?:racist|sexist|homophobic|transphobic|ableist)\b/,
			/\bbecause\s+(?:i am|of my)\s+(?:pregnant|pregnancy|a woman|black|gay|trans|disabled|disability|religion|race|age|old|muslim|jewish)\b/,
		],
	},
	{
		category: 'abuse',
		severity: 'high',
		reason: 'abuse_disclosure',
		patterns: [
			/\b(?:i|we)\s+(?:am|['’]m|have been|was|were)\s+(?:being\s+)?(?:abused|assaulted|beaten|threatened|forced)\b/i,
			/\b(?:my|our)\s+(?:partner|parent|father|mother|dad|mom|caregiver|boss|child|friend|family member|husband|wife|boyfriend|girlfriend)\s+(?:hits|hit|hurts|hurt|abuses|abused|assaults|assaulted|threatens|threatened|forces|forced)\s+(?:me|us|them)\b/i,
			/\b(?:i|we)\s+(?:was|were|have been|am)\s+(?:sexually\s+)?(?:abused|assaulted)\b/i,
			/\b(?:my|our)\s+(?:child|friend|partner|family member)\s+(?:is being|was|has been)\s+(?:abused|assaulted)\b/i,
		],
	},

  // Check
  {
		category: 'possible_self_harm',
		severity: 'check',
		reason: 'ambiguous_distress',
		patterns: [
			/\b(?:i|we)\s+do not want to be here\b/,
			/\b(?:i|we)\s+cannot (?:do|take) (?:this|it) anymore\b/,
			/\b(?:i|we)\s+(?:want|wish i could) (?:to )?disappear\b/,
			/\bwhat is the point\b/,
			/\bno way out\b/,
			/\b(?:i|we)\s+am\s+(?:done|tired)\s+(?:with|of)\s+(?:everything|it all|life|living)\b/,
			/\bno one would (?:care|notice|miss me)\b/,
			/\beveryone would be better off without me\b/,
		],
	},
]

export function normalize(message) {
	return message
		.toLowerCase()
		.replace(/[‘’]/g, "'")
		.replace(/\b(i)'?m\b/g, 'i am')
		.replace(/\bdon'?t\b/g, 'do not')
		.replace(/\bcan'?t\b/g, 'cannot')
		.replace(/\bwon'?t\b/g, 'will not')
		.replace(/\bwhat'?s\b/g, 'what is')
		.replace(/\b(i|we)'ll\b/g, '$1 will')
		.replace(/\bi'?ve\b/g, 'i have')
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

const noEscalation = Object.freeze({
	flagged: false,
	category: null,
	severity: 'none',
	reason: null,
})

/** Inspect one incoming message and return its highest-priority safety signal. */
export function filterEscalation(message) {
	if (typeof message !== 'string' || !message.trim()) return noEscalation
  const text = normalize(message)

	for (const signal of signals) {
		if (signal.patterns.some((pattern) => pattern.test(text))) {
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
