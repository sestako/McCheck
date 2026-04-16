import { parseMeApiResponse, placeholderAuthUser } from '../sessionUser';

describe('placeholderAuthUser', () => {
  it('derives display name from email local part (lowercased)', () => {
    const u = placeholderAuthUser('Alex@Example.COM');
    expect(u.email).toBe('alex@example.com');
    expect(u.displayName).toBe('alex');
    expect(u.id).toBeNull();
  });
});

describe('parseMeApiResponse', () => {
  it('reads camelCase MeResource under data.user', () => {
    const u = parseMeApiResponse({
      code: 'SUCCESS',
      data: {
        user: {
          id: 42,
          email: 'ORG@Example.com',
          username: 'orguser',
          firstname: 'Pat',
          lastname: 'Lee',
          fullName: 'Pat Lee',
          phone: '+420111',
          bio: 'Hello',
          profilePhotoUrl: 'https://x/photo.jpg',
          hasGoogleAuth: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-02-02T12:00:00Z',
        },
      },
    });
    expect(u).not.toBeNull();
    expect(u!.email).toBe('org@example.com');
    expect(u!.id).toBe(42);
    expect(u!.username).toBe('orguser');
    expect(u!.firstName).toBe('Pat');
    expect(u!.lastName).toBe('Lee');
    expect(u!.displayName).toBeTruthy();
    expect(u!.phone).toBe('+420111');
    expect(u!.bio).toBe('Hello');
    expect(u!.profilePhotoUrl).toBe('https://x/photo.jpg');
    expect(u!.hasGoogleAuth).toBe(true);
    expect(u!.createdAt).toBe('2025-01-01T00:00:00Z');
    expect(u!.updatedAt).toBe('2026-02-02T12:00:00Z');
  });

  it('accepts snake_case and public_name for display', () => {
    const u = parseMeApiResponse({
      data: {
        me: {
          id: 1,
          email: 'a@b.c',
          public_name: 'Stage User',
          first_name: 'S',
          last_name: 'U',
          profile_photo_url: 'https://cdn/p.png',
          has_google_auth: 0,
          created_at: '2024-06-01T08:00:00.000Z',
        },
      },
    });
    expect(u!.displayName).toBe('Stage User');
    expect(u!.firstName).toBe('S');
    expect(u!.lastName).toBe('U');
    expect(u!.profilePhotoUrl).toBe('https://cdn/p.png');
    expect(u!.hasGoogleAuth).toBe(false);
    expect(u!.updatedAt).toBeNull();
  });

  it('returns null when email missing', () => {
    expect(parseMeApiResponse({ data: { user: { id: 1 } } })).toBeNull();
  });
});
