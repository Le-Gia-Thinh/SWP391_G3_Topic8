/**
 * FILE: ErrorBoundary.jsx
 * MÔ TẢ: Bắt các lỗi Javascript xảy ra trong quá trình render của các component con.
 * Hiển thị giao diện dự phòng (Fallback UI) và chi tiết lỗi thay vì làm sập toàn bộ ứng dụng.
 */

import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fee', color: '#c00', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>React Render Error</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', marginTop: 10 }}>Reload Page</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
