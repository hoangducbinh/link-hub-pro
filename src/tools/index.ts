import { registry } from './registry';
import { measureTool } from './modules/measure';
import { drawTool } from './modules/draw';
import { highlightTool } from './modules/highlight';
import { colorPickerTool } from './modules/colorpicker';
import { screenshotTool } from './modules/screenshot';
import { stickyNoteTool } from './modules/notes';

// Register all tools
registry.register(measureTool);
registry.register(drawTool);
registry.register(highlightTool);
registry.register(colorPickerTool);
registry.register(screenshotTool);
registry.register(stickyNoteTool);

export { registry };
export * from './types';
