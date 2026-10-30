import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Bind real browser storage explicitly: Node 25's global storage is not browser storage.
const storageWindow = new JSDOM('', { url: 'http://localhost' }).window;
vi.stubGlobal('localStorage', storageWindow.localStorage);
