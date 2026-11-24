import {makeProject} from '@canvas-commons/core';

import title from './scenes/title?scene';
import what from './scenes/what?scene';
import pipeline from './scenes/pipeline?scene';
import memory from './scenes/memory?scene';
import heap from './scenes/heap?scene';
import safety from './scenes/safety?scene';
import bench from './scenes/bench?scene';
import web from './scenes/web?scene';
import next from './scenes/next?scene';

// The one place to list scenes; the editor and the presenter pages both read it.
export default makeProject({
  scenes: [title, what, pipeline, memory, heap, safety, bench, web, next],
});
