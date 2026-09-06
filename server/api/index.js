import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = connectDB().then(() => createApp());
  }
  return appPromise;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
