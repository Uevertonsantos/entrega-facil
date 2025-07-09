import React from 'react';

export default function TestComponent() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Teste - Entrega Fácil</h1>
      <p>Se você está vendo esta mensagem, o React está funcionando!</p>
      <button onClick={() => alert('Clicou!')}>Testar Clique</button>
    </div>
  );
}