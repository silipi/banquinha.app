export class HealthResponseDto {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}
