import { useCallback, useState } from "react";
import type { ScreenPoint } from "../types/radial";

type OpenArgs = {
	point: ScreenPoint;
	coordinate?: [number, number];
};

export function useRadialMenu() {
	const [visible, setVisible] = useState(false);
	const [anchor, setAnchor] = useState<ScreenPoint>({ x: 0, y: 0 });
	const [coordinate, setCoordinate] = useState<[number, number] | undefined>(undefined);

	const open = useCallback((args: OpenArgs) => {
		setAnchor(args.point);
		setCoordinate(args.coordinate);
		setVisible(true);
	}, []);

	const close = useCallback(() => {
		setVisible(false);
	}, []);

	return { visible, anchor, coordinate, open, close };
}


