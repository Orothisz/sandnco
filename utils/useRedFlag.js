"use client";

import { useState, useEffect } from 'react';

export function useRedFlagAlgorithm(target) {
  const [data, setData] = useState({ score: 0, loading: true });

  useEffect(() => {
    let isMounted = true;

    const calculateScore = async () => {
      if (!target) return;

      // ----------------------------------------------------
      // PHASE 1: Attempt Neural Uplink (GLM)
      // ----------------------------------------------------
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s strict cutoff

        const res = await fetch('/api/redflag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio: target.bio, age: target.age, alias: target.alias }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const apiData = await res.json();
          if (isMounted) setData({ score: apiData.score, loading: false });
          return; // Exit if the AI gives us a valid score
        }
      } catch (err) {
        console.warn(`[MINDER_SYS]: AI Uplink failed for ${target.alias}. Rerouting to V-Smart Offline Engine.`);
      }

      // ----------------------------------------------------
      // PHASE 2: V-Smart Offline Heuristic Engine
      // ----------------------------------------------------
      let score = 15; // Base skepticism score
      const bioRaw = target.bio || '';
      const bioLower = bioRaw.toLowerCase();
      const aliasLower = target.alias?.toLowerCase() || '';

      // Vector 1: Length & Effort Profile
      const wordCount = bioLower.split(/\s+/).length;
      if (wordCount < 4) score += 25; // Hiding something / zero effort
      if (wordCount > 60) score += 15; // Oversharing / baggage

      // Vector 2: The "Drama Paradox" (Those who mention it, bring it)
      if (/(no drama|drama free|toxic|fake people|loyalty|trust issues)/.test(bioLower)) {
        score += 35;
      }

      // Vector 3: Transactional & Materialistic Profiling
      if (/(cashapp|venmo|paypal|spoil me|sugar|generous|princess treatment|buy me)/.test(bioLower)) {
        score += 55;
      }

      // Vector 4: Narcissism Ratio
      const pronounCount = (bioLower.match(/\b(i|me|my|mine)\b/g) || []).length;
      if (wordCount > 10 && (pronounCount / wordCount) > 0.15) {
        score += 15; // If >15% of words are "I/Me", massive ego
      }
      if (/(alpha|sigma|high value|king|queen|boss bitch|ceo)/.test(bioLower)) score += 25;
      if (/(king|queen|official|real)/.test(aliasLower)) score += 20;

      // Vector 5: Aggressive Ultimatums
      const demandCount = (bioLower.match(/\b(must|should|never|require|need to|swipe left if)\b/g) || []).length;
      score += (demandCount * 12);
      if (/(entertain me|make me laugh|prove)/.test(bioLower)) score += 20;

      // Vector 6: Psychological Typography
      const capsMatch = bioRaw.match(/[A-Z]{4,}/g); 
      if (capsMatch && capsMatch.length > 2) score += 15; // Internet shouting
      const exclamationCount = (bioRaw.match(/!/g) || []).length;
      if (exclamationCount > 3) score += 10; // Overcompensating energy

      // Vector 7: The "Nice Guy/Girl" Syndrome
      if (/(nice guy|good guy|good girl|treat you right)/.test(bioLower)) score += 25;

      // Final Math: Clamp between 1 and 99
      // Add deterministic variance based on their ID so scores feel organic and alive
      const variance = (target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15) - 7;
      let finalScore = Math.round(score + variance);
      finalScore = Math.min(Math.max(finalScore, 1), 99);

      if (isMounted) setData({ score: finalScore, loading: false });
    };

    calculateScore();

    return () => { isMounted = false; };
  }, [target]);

  return data;
}
