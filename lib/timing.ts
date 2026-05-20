// E-03: Step-level timing tracker

export interface TimingSnapshot {
  face_check_ms?: number;
  cache_check_ms?: number;
  external_api_ms?: number;
  asset_save_ms?: number;
  dialogue_generation_ms?: number;
  total_ms: number;
}

export class Timer {
  private readonly start = Date.now();
  private marks: Record<string, number> = {};

  mark(name: string): void {
    this.marks[name] = Date.now();
  }

  elapsed(from?: string): number {
    const base = from ? (this.marks[from] ?? this.start) : this.start;
    return Date.now() - base;
  }

  snapshot(extraMs?: Partial<Omit<TimingSnapshot, "total_ms">>): TimingSnapshot {
    return {
      ...extraMs,
      total_ms: Date.now() - this.start,
    };
  }
}

export function msRange(startMark: number, endMark: number): number {
  return endMark - startMark;
}
