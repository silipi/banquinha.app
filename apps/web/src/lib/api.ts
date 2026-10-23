import { client } from '@banquinha/api-client';

client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
});

export * from '@banquinha/api-client';
