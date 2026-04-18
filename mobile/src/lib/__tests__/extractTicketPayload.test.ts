import { extractTicketPayload } from '../extractTicketPayload';

describe('extractTicketPayload', () => {
  it('returns trimmed raw when no embedded id', () => {
    expect(extractTicketPayload('  mct-102-10000  ')).toBe('mct-102-10000');
  });

  it('extracts mct id from URL', () => {
    expect(extractTicketPayload('https://example.com/t?x=1&mct-101-10000')).toBe('mct-101-10000');
  });
});
