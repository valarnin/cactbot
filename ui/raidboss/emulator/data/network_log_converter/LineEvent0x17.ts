import LineEvent from './LineEvent';
import LogRepository from './LogRepository';

// Cancel ability event
export class LineEvent0x17 extends LineEvent {
  constructor(repo: LogRepository, line: string, parts: string[]) {
    super(repo, line, parts);
  }

  public get id(): string {
    return this.parts[2]?.toUpperCase() ?? '';
  }

  public get name(): string {
    return this.parts[3] ?? '';
  }

  public get abilityId(): string {
    return this.parts[4]?.toUpperCase() ?? '';
  }

  public get abilityName(): string {
    return this.parts[5] ?? '';
  }

  public get reason(): string {
    return this.parts[6] ?? '';
  }
}

export class LineEvent23 extends LineEvent0x17 {}