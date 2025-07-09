export default function App() {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      background: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333' }}>🚚 Entrega Fácil</h1>
        <p>Sistema funcionando com React!</p>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => window.location.href = '/admin-login'}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Admin Login
          </button>
          
          <button 
            onClick={() => window.location.href = '/merchant-login'}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Merchant Login
          </button>
          
          <button 
            onClick={() => window.location.href = '/deliverer-login'}
            style={{
              background: '#ffc107',
              color: 'black',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Deliverer Login
          </button>
        </div>
      </div>
    </div>
  );
}