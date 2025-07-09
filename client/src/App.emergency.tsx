export default function EmergencyApp() {
  const handleLogin = (type: string) => {
    window.location.href = `/${type}-login`;
  };

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
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>🚚 Entrega Fácil</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Sistema de Gerenciamento de Entregas</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ color: '#333', marginTop: 0 }}>👨‍💼 Administrador</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Gerencie todo o sistema</p>
            <button 
              onClick={() => handleLogin('admin')}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Entrar
            </button>
          </div>
          
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ color: '#333', marginTop: 0 }}>🏪 Comerciante</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Solicite entregas</p>
            <button 
              onClick={() => handleLogin('merchant')}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Entrar
            </button>
          </div>
          
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ color: '#333', marginTop: 0 }}>🚴 Entregador</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Receba entregas</p>
            <button 
              onClick={() => handleLogin('deliverer')}
              style={{
                background: '#ffc107',
                color: 'black',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Entrar
            </button>
          </div>
        </div>
        
        <div style={{ fontSize: '14px', color: '#666' }}>
          <h3 style={{ marginBottom: '10px' }}>Credenciais de Teste</h3>
          <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
            <p><strong>Admin:</strong> Admin / admin123</p>
            <p><strong>Comerciante:</strong> joao@padaria.com / 123456789</p>
            <p><strong>Entregador:</strong> maria@entregador.com / 987654321</p>
          </div>
        </div>
      </div>
    </div>
  );
}