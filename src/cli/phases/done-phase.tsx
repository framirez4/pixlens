import { Text } from "ink";
import { useEffect, useRef } from "react";

type DonePhaseProps = {
	onFinish: () => void;
};

export function DonePhase({ onFinish }: DonePhaseProps) {
	const onFinishRef = useRef(onFinish);
	onFinishRef.current = onFinish;

	useEffect(() => {
		const t = setTimeout(() => onFinishRef.current(), 400);
		return () => clearTimeout(t);
	}, []);

	return (
		<Text color="green">Done. No pending actions (or moves completed).</Text>
	);
}
