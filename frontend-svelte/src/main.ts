import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const target = document.getElementById('app') || document.getElementById('root') || document.body;

const app = mount(App, {
  target,
});

export default app;
