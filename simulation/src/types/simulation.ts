export interface SimulationConfig {
  vehicles: {
    count: number;
    type: string;
  };
  roadNetwork: {
    sizeKm2: number;
    density: string;
    oneWayRoutes: number;
    junctions: string;
    laneDistribution: {
      oneLanePercentage: number;
      twoLanePercentage: number;
      fourLanePercentage: number;
    };
  };
  traffic: {
    level: string;
    pattern: string;
    timeOfDay: string;
  };
  conditions: {
    weather: string;
    roadCondition: {
      good: number;
      average: number;
      bad: number;
    };
  };
  events: {
    accidents: number;
    roadClosures: number;
    constructionZones: number;
  };
  optimization: {
    priority: string;
  };
}
