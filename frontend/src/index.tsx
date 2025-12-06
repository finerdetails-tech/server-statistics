import { render } from 'preact';

export function App() {
	new WebSocket('ws://localhost:8080/api/metrics');
	return (
		<div>
		</div>
	);
}


render(<App />, document.getElementById('app'));
