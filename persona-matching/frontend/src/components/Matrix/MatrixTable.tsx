interface MatrixPageProps {
  onBack: () => void;
}

export default function MatrixPage({ onBack }: MatrixPageProps) {
  return (
    <div className="page">
      <h2>Persona Tables</h2>
      <div className="controls">
        <button className="back-button" onClick={onBack}>← Back to Menu</button>
      </div>
      <p>Coming soon...</p>
    </div>
  );
}
