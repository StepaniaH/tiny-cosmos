function tierRates(game, tierId) {
  const { GC, GS } = game;
  const tier = GS.getTier(tierId);
  if (!tier || !tier.researched) {
    return { productionPerSecond: 0, demandPerSecond: 0, netPerSecond: 0 };
  }

  const productionPerSecond =
    GS.getProducerOutput(tierId) *
    GS.getSpeedMultiplier() *
    GS.getGravityMultiplier(tierId);

  let demandPerSecond = 0;
  if (tierId < GC.TIERS.length - 1) {
    const higher = GS.getTier(tierId + 1);
    if (higher && higher.researched) {
      let demand = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
      if (GS.hasMilestone(7)) demand *= 0.7;
      demandPerSecond = higher.count * demand;
    }
  }

  return {
    productionPerSecond,
    demandPerSecond,
    netPerSecond: productionPerSecond - demandPerSecond,
  };
}

function snapshot(game, elapsedSeconds) {
  const { GC, GS } = game;
  const tiers = GC.TIERS.map((tpl, tierId) => {
    const tier = GS.getTier(tierId);
    const rates = tierRates(game, tierId);
    return {
      id: tierId,
      name: tpl.name,
      researched: tier.researched,
      count: tier.count,
      producers: tier.producers,
      synthCount: tier.synthCount,
      totalEver: tier.totalEver,
      rates,
    };
  });

  return {
    elapsedSeconds,
    researchPoints: GS.getRP(),
    maxResearchedTier: GS.getMaxResearchedTier(),
    totalQuarksEver: GS.getTotalQuarksEver(),
    totalSynthesis: GS.getState().totalSynthesis,
    prestiges: GS.getPrestiges(),
    constantPoints: GS.getCP(),
    canPrestige: GS.canPrestige(),
    cpGain: GS.calcCPGain(),
    tiers,
  };
}

function warningsForSnapshot(snap) {
  const warnings = [];
  for (const tier of snap.tiers) {
    if (!tier.researched) continue;
    if (tier.count === 0 && tier.rates.netPerSecond < 0) {
      warnings.push(`tier-${tier.id}-depleted-negative-net`);
    }
    if (tier.count > 1e12) {
      warnings.push(`tier-${tier.id}-runaway-count`);
    }
  }
  if (snap.elapsedSeconds >= 3600 && snap.maxResearchedTier < 3) {
    warnings.push('midgame-stall-before-molecule');
  }
  return warnings;
}

function failureDetails(game, goal) {
  const { GC, GS } = game;
  const tiers = GC.TIERS.map((tpl, tierId) => {
    const tier = GS.getTier(tierId);
    return {
      id: tierId,
      name: tpl.name,
      researched: tier.researched,
      count: tier.count,
      producers: tier.producers,
      synthCost: tierId === 0 ? 0 : GS.getSynthCost(tierId),
      producerCost: tier.producerBaseCost === 0 ? null : GS.getProducerCost(tierId),
      everReachedOne: tier.totalEver >= 1,
      rates: tierRates(game, tierId),
    };
  });

  return {
    goal,
    failureReason: describeFailure(game, tiers, goal),
    tiers,
  };
}

function describeFailure(game, tiers, goal) {
  if (goal === 'first-prestige' && !game.GS.canPrestige()) {
    const civilization = tiers[6];
    if (civilization && civilization.count < 1) {
      return 'civilization-count-below-1';
    }
    return 'prestige-condition-not-met';
  }
  return 'goal-not-met';
}

module.exports = {
  snapshot,
  tierRates,
  warningsForSnapshot,
  failureDetails,
};
