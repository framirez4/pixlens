import { Text } from "ink";
import { useEffect, useRef } from "react";

type CancelledPhaseProps = {
	onFinish: () => void;
};

export function CancelledPhase({ onFinish }: CancelledPhaseProps) {
	const onFinishRef = useRef(onFinish);
	onFinishRef.current = onFinish;

	useEffect(() => {
		const t = setTimeout(() => onFinishRef.current(), 400);
		return () => clearTimeout(t);
	}, []);

	return <Text color="yellow">Cancelled. No files were moved.</Text>;
}
