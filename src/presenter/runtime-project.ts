import {bootstrap} from '@canvas-commons/core';
import settingsFile from 'virtual:settings.meta';
import metaFile from '../project.meta';
import projectSettings from '../scene-list';

// Mirrors the non-editor path of the Vite plugin's ?project module, which
// avoids pulling the editor and exporter plugins into the presenter pages.
export default bootstrap(
  'project',
  {core: '0.4.0', two: null, ui: null, vitePlugin: null},
  [],
  projectSettings,
  metaFile,
  settingsFile,
);
