import type { RadialAction, RadialSelectContext } from "../types/radial";

export function performAction(action: RadialAction, ctx: RadialSelectContext) {
	switch (action) {
		case "drop-pin":
			// TODO: Integrate with markers feature: dispatch addMarker at ctx.coordinate
			break;
		case "map-style":
			// TODO: Toggle style or open style selector
			break;
		case "annotate":
			// TODO: Enter annotate mode
			break;
		case "share":
			// TODO: Share current view / coordinate
			break;
		case "download":
			// TODO: Trigger offline tiles download flow
			break;
		case "route":
			// TODO: Start route planning from ctx.coordinate
			break;
		case "compass":
			// TODO: Toggle compass mode
			break;
		case "info":
			// TODO: Show info panel
			break;
		default:
			break;
	}
}


