import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

interface FooResponse {
  message: string;
  data: {
    id: number;
    name: string;
    description: string;
    timestamp: string;
  };
}

function App() {
  const [fooData, setFooData] = useState<FooResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFooData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/foo');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: FooResponse = await response.json();
      setFooData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        
        <div style={{ margin: '20px 0', padding: '20px', background: '#282c34', borderRadius: '8px' }}>
          <h3>API Call to /api/foo</h3>
          <button onClick={fetchFooData} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Foo Data'}
          </button>
          
          {error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Error: {error}
            </div>
          )}
          
          {fooData && (
            <div style={{ marginTop: '10px', textAlign: 'left' }}>
              <h4>{fooData.message}</h4>
              <pre style={{ background: '#1a1a1a', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(fooData.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
