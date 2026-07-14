export interface BatterySensor {
  entityId: string;
  name: string;
  level: number;
  unit: string;
  charging?: boolean;
}